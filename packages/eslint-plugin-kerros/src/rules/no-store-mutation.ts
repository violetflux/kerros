import type { TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { createReferenceOriginTracker, isMutableCollectionCall } from '../internal/semantic'

interface Options {
  deepAliases?: boolean
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
    const candidates: Array<{
      expression: TSESTree.Expression
      node: TSESTree.Node
    }> = []
    const maxAliasDepth = options.deepAliases === false ? 1 : Number.POSITIVE_INFINITY

    /** Test whether an expression comes from a selector-free Store Hook snapshot. */
    const isSnapshotDerived = (
      input: TSESTree.Node,
      remainingAliases = maxAliasDepth,
      seen = new Set<ts.Symbol>(),
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
        return isSnapshotDerived(node.right, remainingAliases, seen)

      if (node.type === 'MemberExpression')
        return isSnapshotDerived(node.object, remainingAliases, seen)

      if (node.type !== 'Identifier' || remainingAliases <= 0)
        return false

      const symbol = getIdentifierSymbol(node)
      if (!symbol || seen.has(symbol))
        return false

      const sources = origins.resolve(symbol, node)
      if (sources.length === 0)
        return false

      seen.add(symbol)
      const derived = sources.some(source => isSnapshotDerived(source, remainingAliases - 1, seen))
      seen.delete(symbol)
      return derived
    }

    return {
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
          candidates.push({ expression: node.left, node })
        }
      },
      UpdateExpression(node) {
        candidates.push({ expression: node.argument, node })
      },
      UnaryExpression(node) {
        if (node.operator === 'delete')
          candidates.push({ expression: node.argument, node })
      },
      CallExpression(node) {
        if (!isMutableCollectionCall(node, checker, services.program, getType))
          return

        const callee = unwrapExpression(node.callee)
        if (callee.type === 'MemberExpression')
          candidates.push({ expression: callee.object, node })
      },
      'Program:exit'() {
        for (const candidate of candidates) {
          if (isSnapshotDerived(candidate.expression))
            context.report({ node: candidate.node, messageId: 'mutation' })
        }
      },
    }
  },
})
