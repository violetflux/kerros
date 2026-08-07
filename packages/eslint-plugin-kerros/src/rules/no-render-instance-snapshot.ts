import type { TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { getMemberName } from '../internal/semantic'

type FunctionNode = TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression

const deferredReactHooks = new Set([
  'useEffect',
  'useEffectEvent',
  'useInsertionEffect',
  'useLayoutEffect',
])
const renderFunctionPattern = /^(?:[A-Z]|use[A-Z])/u

/** Return the declaration identifier that owns a local function. */
function getFunctionIdentifier(node: FunctionNode) {
  if (node.type !== 'ArrowFunctionExpression' && node.id)
    return node.id

  const parent = node.parent
  return parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier'
    ? parent.id
    : undefined
}

/** Test whether JSX treats an expression as an event callback. */
function isEventAttribute(node: TSESTree.JSXAttribute) {
  return node.name.type === 'JSXIdentifier' && /^on[A-Z]/u.test(node.name.name)
}

export const noRenderInstanceSnapshot = createRule<[], 'renderSnapshot'>({
  name: 'no-render-instance-snapshot',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent direct external Store snapshot reads during render.',
    },
    schema: [],
    messages: {
      renderSnapshot: 'Subscribe with the Store Hook instead of reading getSnapshot during render.',
    },
  },
  defaultOptions: [],
  create(context) {
    const {
      checker,
      getIdentifierSymbol,
      isStoreInstanceHookCall,
      services,
    } = createKerrosTypeTools(context)
    const functions = new Set<FunctionNode>()
    const deferredFunctions = new Set<FunctionNode>()
    const deferredSymbols = new Set<ts.Symbol>()
    const origins = new Map<ts.Symbol, TSESTree.Expression>()
    const calls: Array<{
      caller?: FunctionNode
      node: TSESTree.CallExpression
    }> = []
    const snapshots: Array<{
      node: TSESTree.CallExpression
      object: TSESTree.Expression
      owner?: FunctionNode
    }> = []

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

    /** Resolve a TypeScript symbol through import and export aliases. */
    const getResolvedSymbol = (node: TSESTree.Node) => {
      const tsNode = services.esTreeNodeToTSNodeMap.get(node)
      let symbol = checker.getSymbolAtLocation(tsNode)
      while (symbol && (symbol.flags & ts.SymbolFlags.Alias) !== 0)
        symbol = checker.getAliasedSymbol(symbol)
      return symbol
    }

    /** Test whether a call targets one of React's deferred callback Hooks. */
    const isDeferredReactCall = (node: TSESTree.CallExpression) => {
      const symbol = getResolvedSymbol(node.callee)
      if (!symbol || !deferredReactHooks.has(symbol.getName()))
        return false

      return symbol.declarations?.some(declaration => {
        return declaration.getSourceFile().fileName.replaceAll('\\', '/').includes('/node_modules/@types/react/')
      }) === true
    }

    /** Mark a direct function or referenced local function as deferred. */
    const markDeferred = (node: TSESTree.Node | undefined) => {
      if (!node)
        return
      if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
        deferredFunctions.add(node)
        return
      }
      if (node.type === 'Identifier') {
        const symbol = getIdentifierSymbol(node)
        if (symbol)
          deferredSymbols.add(symbol)
      }
    }

    /** Collect a function node for the final local call graph. */
    const collectFunction = (node: FunctionNode) => {
      functions.add(node)
    }

    return {
      ArrowFunctionExpression: collectFunction,
      FunctionDeclaration: collectFunction,
      FunctionExpression: collectFunction,
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !node.init)
          return

        const symbol = getIdentifierSymbol(node.id)
        if (symbol)
          origins.set(symbol, node.init)
      },
      JSXAttribute(node) {
        if (!isEventAttribute(node) || node.value?.type !== 'JSXExpressionContainer')
          return

        markDeferred(node.value.expression.type === 'JSXEmptyExpression'
          ? undefined
          : node.value.expression)
      },
      CallExpression(node) {
        const caller = getOwner(node.parent)
        calls.push({ caller, node })

        if (isDeferredReactCall(node)) {
          const callback = node.arguments[0]
          if (callback?.type !== 'SpreadElement')
            markDeferred(callback)
        }

        const callee = unwrapExpression(node.callee)
        if (callee.type !== 'MemberExpression' || getMemberName(callee) !== 'getSnapshot')
          return

        snapshots.push({ node, object: callee.object, owner: caller })
      },
      'Program:exit'() {
        const functionsBySymbol = new Map<ts.Symbol, FunctionNode>()
        const rendered = new Set<FunctionNode>()

        for (const fn of functions) {
          const identifier = getFunctionIdentifier(fn)
          if (!identifier)
            continue

          const symbol = getIdentifierSymbol(identifier)
          if (symbol) {
            functionsBySymbol.set(symbol, fn)
            if (deferredSymbols.has(symbol))
              deferredFunctions.add(fn)
          }

          if (renderFunctionPattern.test(identifier.name) && !deferredFunctions.has(fn))
            rendered.add(fn)
        }

        /** Resolve a local function expression or identifier used as a callback. */
        const resolveFunction = (input: TSESTree.Node) => {
          const node = unwrapExpression(input)
          if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression')
            return node
          if (node.type !== 'Identifier')
            return undefined

          const symbol = getIdentifierSymbol(node)
          return symbol ? functionsBySymbol.get(symbol) : undefined
        }

        let changed = true
        while (changed) {
          changed = false
          for (const { caller, node } of calls) {
            if (!caller || !rendered.has(caller))
              continue

            const callee = resolveFunction(node.callee)
            if (callee && !rendered.has(callee)) {
              rendered.add(callee)
              changed = true
            }

            if (isDeferredReactCall(node))
              continue

            for (const argument of node.arguments) {
              if (argument.type === 'SpreadElement')
                continue
              const callback = resolveFunction(argument)
              if (callback && !rendered.has(callback)) {
                rendered.add(callback)
                changed = true
              }
            }
          }
        }

        /** Test whether an expression is a local alias of a Store instance Hook result. */
        const isInstanceDerived = (
          input: TSESTree.Node,
          seen = new Set<ts.Symbol>(),
        ): boolean => {
          const node = unwrapExpression(input)
          if (node.type === 'CallExpression')
            return isStoreInstanceHookCall(node)
          if (node.type !== 'Identifier')
            return false

          const symbol = getIdentifierSymbol(node)
          if (!symbol || seen.has(symbol))
            return false
          const origin = origins.get(symbol)
          if (!origin)
            return false

          seen.add(symbol)
          const derived = isInstanceDerived(origin, seen)
          seen.delete(symbol)
          return derived
        }

        for (const snapshot of snapshots) {
          if (snapshot.owner && rendered.has(snapshot.owner) && isInstanceDerived(snapshot.object))
            context.report({ node: snapshot.node, messageId: 'renderSnapshot' })
        }
      },
    }
  },
})
