import type { TSESTree } from '@typescript-eslint/utils'
import type { CallSiteContext, FunctionNode, LocalCallEdge } from '../internal/semantic'
import ts from 'typescript'
import { unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import {
  createReferenceOriginTracker,
  getFunctionCallSiteContexts,
  isMutableCollectionCall,
} from '../internal/semantic'

interface Options {
  deepAliases?: boolean
}

/** Return the declaration identifier that owns a local function. */
function getFunctionIdentifier(node: FunctionNode) {
  if (node.type !== 'ArrowFunctionExpression' && node.id)
    return node.id

  const parent = node.parent
  return parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier'
    ? parent.id
    : undefined
}

/** Collect every identifier introduced by one binding pattern. */
function collectPatternIdentifiers(
  pattern: TSESTree.Node,
  identifiers: TSESTree.Identifier[],
) {
  if (pattern.type === 'Identifier') {
    identifiers.push(pattern)
    return
  }

  if (pattern.type === 'RestElement') {
    collectPatternIdentifiers(pattern.argument, identifiers)
    return
  }

  if (pattern.type === 'AssignmentPattern') {
    collectPatternIdentifiers(pattern.left, identifiers)
    return
  }

  if (pattern.type !== 'ObjectPattern' && pattern.type !== 'ArrayPattern')
    return

  for (const property of pattern.type === 'ObjectPattern' ? pattern.properties : pattern.elements) {
    if (!property)
      continue
    if (property.type === 'Property')
      collectPatternIdentifiers(property.value, identifiers)
    else
      collectPatternIdentifiers(property, identifiers)
  }
}

export const noStoreMutation = createRule<[Options], 'mutation'>({
  name: 'no-store-mutation',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent mutation of selector-free Store snapshots.',
    },
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        deepAliases: { type: 'boolean' },
      },
    }],
    messages: {
      mutation: 'Store snapshots are immutable.',
    },
  },
  defaultOptions: [{ deepAliases: true }],
  create(context, [options]) {
    const { checker, getIdentifierSymbol, getType, isStoreHookCall, services } = createKerrosTypeTools(context)
    const origins = createReferenceOriginTracker<TSESTree.Expression>(context.sourceCode.ast)
    const functions = new Set<FunctionNode>()
    const calls: Array<{
      caller?: FunctionNode
      node: TSESTree.CallExpression
    }> = []
    const candidates: Array<{
      expression: TSESTree.Expression
      node: TSESTree.Node
      owner?: FunctionNode
    }> = []
    const maxAliasDepth = options.deepAliases === false ? 1 : Number.POSITIVE_INFINITY

    /** Find the function whose body contains a syntax node. */
    const getOwner = (input: TSESTree.Node | undefined) => {
      let node = input
      while (node) {
        if (node.type === 'ArrowFunctionExpression'
          || node.type === 'FunctionDeclaration'
          || node.type === 'FunctionExpression') {
          return node
        }
        node = node.parent
      }
      return undefined
    }

    /** Collect a function node for the final local call graph. */
    const collectFunction = (node: FunctionNode) => {
      functions.add(node)
    }

    /** Test whether an expression comes from a selector-free Store Hook snapshot. */
    const isSnapshotDerived = (
      input: TSESTree.Node,
      remainingAliases = maxAliasDepth,
      seen = new Set<ts.Symbol>(),
      calls?: CallSiteContext,
    ): boolean => {
      const node = unwrapExpression(input)
      if (node.type === 'CallExpression') {
        const selector = node.arguments[0]
        const selectorFree = node.arguments.length === 0
          || (node.arguments.length === 1
            && selector?.type !== 'SpreadElement'
            && (getType(selector).flags & ts.TypeFlags.Undefined) !== 0)
        return selectorFree && isStoreHookCall(node)
      }

      if (node.type === 'AssignmentExpression')
        return isSnapshotDerived(node.right, remainingAliases, seen, calls)

      if (node.type === 'MemberExpression')
        return isSnapshotDerived(node.object, remainingAliases, seen, calls)

      if (node.type !== 'Identifier' || remainingAliases <= 0)
        return false

      const symbol = getIdentifierSymbol(node)
      if (!symbol || seen.has(symbol))
        return false

      const sources = origins.resolve(symbol, node, calls)
      if (sources.length === 0)
        return false

      seen.add(symbol)
      const derived = sources.some((source) => {
        return isSnapshotDerived(source, remainingAliases - 1, seen, calls)
      })
      seen.delete(symbol)
      return derived
    }

    return {
      ArrowFunctionExpression: collectFunction,
      FunctionDeclaration: collectFunction,
      FunctionExpression: collectFunction,
      VariableDeclarator(node) {
        if (!node.init)
          return

        const identifiers: TSESTree.Identifier[] = []
        collectPatternIdentifiers(node.id, identifiers)
        for (const identifier of identifiers) {
          const symbol = getIdentifierSymbol(identifier)
          if (symbol)
            origins.record(symbol, node.init, node)
        }
      },
      AssignmentExpression(node) {
        if (node.left.type === 'Identifier') {
          const symbol = getIdentifierSymbol(node.left)
          if (symbol)
            origins.record(symbol, node.right, node)
        }
        else if (node.left.type === 'MemberExpression') {
          candidates.push({ expression: node.left, node, owner: getOwner(node.parent) })
        }
      },
      UpdateExpression(node) {
        candidates.push({ expression: node.argument, node, owner: getOwner(node.parent) })
      },
      UnaryExpression(node) {
        if (node.operator === 'delete')
          candidates.push({ expression: node.argument, node, owner: getOwner(node.parent) })
      },
      CallExpression(node) {
        calls.push({ caller: getOwner(node.parent), node })
        if (!isMutableCollectionCall(node, checker, services.program, getType))
          return

        const callee = unwrapExpression(node.callee)
        if (callee.type === 'MemberExpression')
          candidates.push({ expression: callee.object, node, owner: getOwner(node.parent) })
      },
      'Program:exit'() {
        const functionsBySymbol = new Map<ts.Symbol, FunctionNode>()
        for (const fn of functions) {
          const identifier = getFunctionIdentifier(fn)
          if (!identifier)
            continue
          const symbol = getIdentifierSymbol(identifier)
          if (symbol)
            functionsBySymbol.set(symbol, fn)
        }

        /** Resolve a directly called local function. */
        const resolveFunction = (input: TSESTree.Node) => {
          const node = unwrapExpression(input)
          if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression')
            return node
          if (node.type !== 'Identifier')
            return undefined

          const symbol = getIdentifierSymbol(node)
          return symbol ? functionsBySymbol.get(symbol) : undefined
        }

        const localEdges: LocalCallEdge[] = []
        for (const { caller, node } of calls) {
          const callee = resolveFunction(node.callee)
          if (caller && callee)
            localEdges.push({ callee, caller, site: node })
        }

        for (const candidate of candidates) {
          const callContexts = candidate.owner
            ? getFunctionCallSiteContexts(candidate.owner, localEdges)
            : [new Map<FunctionNode, TSESTree.Node>()]
          const derived = callContexts.some((calls) => {
            return isSnapshotDerived(candidate.expression, maxAliasDepth, new Set(), calls)
          })
          if (derived)
            context.report({ node: candidate.node, messageId: 'mutation' })
        }
      },
    }
  },
})
