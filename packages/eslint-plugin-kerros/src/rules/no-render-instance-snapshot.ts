import type { TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { createReferenceOriginTracker, getMemberName } from '../internal/semantic'

type FunctionNode = TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression

const deferredReactHooks = new Set([
  'useEffect',
  'useEffectEvent',
  'useInsertionEffect',
  'useLayoutEffect',
])
const deferredGlobals = new Set(['queueMicrotask', 'setInterval', 'setTimeout'])
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

/** Test whether an attribute is an intrinsic element event callback. */
function isIntrinsicEventAttribute(node: TSESTree.JSXAttribute) {
  if (node.name.type !== 'JSXIdentifier' || !/^on[A-Z]/u.test(node.name.name))
    return false

  const opening = node.parent
  return opening?.type === 'JSXOpeningElement'
    && opening.name.type === 'JSXIdentifier'
    && /^[a-z]/u.test(opening.name.name)
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
    const origins = createReferenceOriginTracker<TSESTree.Expression>(context.sourceCode.ast)
    const snapshotReaders = new Map<ts.Symbol, TSESTree.Expression>()
    const calls: Array<{
      caller?: FunctionNode
      node: TSESTree.CallExpression
    }> = []
    const immediateJsxCallbacks: Array<{
      caller?: FunctionNode
      node: TSESTree.Node
    }> = []
    const snapshots: Array<{
      kind: 'instance' | 'reader'
      node: TSESTree.CallExpression
      source: TSESTree.Expression
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

    /** Test whether a call targets a real global scheduling function. */
    const isDeferredGlobalCall = (node: TSESTree.CallExpression) => {
      const symbol = getResolvedSymbol(node.callee)
      if (!symbol || !deferredGlobals.has(symbol.getName()))
        return false

      return symbol.declarations?.some(declaration => {
        const sourceFile = declaration.getSourceFile()
        const filename = sourceFile.fileName.replaceAll('\\', '/')
        return services.program.isSourceFileDefaultLibrary(sourceFile)
          || filename.includes('/node_modules/@types/node/')
      }) === true
    }

    /** Test whether a call defers its first callback beyond render. */
    const isDeferredCall = (node: TSESTree.CallExpression) => {
      return isDeferredReactCall(node) || isDeferredGlobalCall(node)
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
        if (!node.init)
          return

        if (node.id.type === 'Identifier') {
          const symbol = getIdentifierSymbol(node.id)
          if (symbol)
            origins.record(symbol, node.init, node)
          return
        }

        if (node.id.type !== 'ObjectPattern')
          return

        for (const property of node.id.properties) {
          if (property.type !== 'Property')
            continue

          const key = property.key
          const name = !property.computed && key.type === 'Identifier'
            ? key.name
            : key.type === 'Literal' && typeof key.value === 'string'
              ? key.value
              : undefined
          const value = property.value.type === 'AssignmentPattern'
            ? property.value.left
            : property.value
          if (name !== 'getSnapshot' || value.type !== 'Identifier')
            continue

          const symbol = getIdentifierSymbol(value)
          if (symbol)
            snapshotReaders.set(symbol, node.init)
        }
      },
      AssignmentExpression(node) {
        if (node.left.type !== 'Identifier')
          return

        const symbol = getIdentifierSymbol(node.left)
        if (symbol)
          origins.record(symbol, node.right, node)
      },
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier'
          || !/^on[A-Z]/u.test(node.name.name)
          || node.value?.type !== 'JSXExpressionContainer') {
          return
        }

        const callback = node.value.expression.type === 'JSXEmptyExpression'
          ? undefined
          : node.value.expression
        if (!callback)
          return

        if (isIntrinsicEventAttribute(node))
          markDeferred(callback)
        else
          immediateJsxCallbacks.push({ caller: getOwner(node.parent), node: callback })
      },
      CallExpression(node) {
        const caller = getOwner(node.parent)
        calls.push({ caller, node })

        if (isDeferredCall(node)) {
          const callback = node.arguments[0]
          if (callback?.type !== 'SpreadElement')
            markDeferred(callback)
        }

        const callee = unwrapExpression(node.callee)
        if (callee.type === 'Identifier') {
          snapshots.push({ kind: 'reader', node, source: callee, owner: caller })
          return
        }
        if (callee.type !== 'MemberExpression' || getMemberName(callee) !== 'getSnapshot')
          return

        snapshots.push({ kind: 'instance', node, source: callee.object, owner: caller })
      },
      'Program:exit'() {
        const functionsBySymbol = new Map<ts.Symbol, FunctionNode>()
        const rendered = new Set<FunctionNode>()

        for (const fn of functions) {
          const identifier = getFunctionIdentifier(fn)
          if (!identifier) {
            if (fn.parent?.type === 'ExportDefaultDeclaration')
              rendered.add(fn)
            continue
          }

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

            if (isDeferredCall(node))
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

          for (const { caller, node } of immediateJsxCallbacks) {
            if (!caller || !rendered.has(caller))
              continue

            const callback = resolveFunction(node)
            if (callback && !rendered.has(callback)) {
              rendered.add(callback)
              changed = true
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
          if (node.type === 'AssignmentExpression')
            return isInstanceDerived(node.right, seen)
          if (node.type !== 'Identifier')
            return false

          const symbol = getIdentifierSymbol(node)
          if (!symbol || seen.has(symbol))
            return false
          const sources = origins.resolve(symbol, node)
          if (sources.length === 0)
            return false

          seen.add(symbol)
          const derived = sources.some(source => isInstanceDerived(source, seen))
          seen.delete(symbol)
          return derived
        }

        /** Test whether an identifier comes from destructuring an instance getSnapshot method. */
        const isSnapshotReaderDerived = (
          input: TSESTree.Node,
          seen = new Set<ts.Symbol>(),
        ): boolean => {
          const node = unwrapExpression(input)
          if (node.type !== 'Identifier')
            return false

          const symbol = getIdentifierSymbol(node)
          if (!symbol || seen.has(symbol))
            return false

          const instance = snapshotReaders.get(symbol)
          if (instance)
            return isInstanceDerived(instance)

          const sources = origins.resolve(symbol, node)
          if (sources.length === 0)
            return false

          seen.add(symbol)
          const derived = sources.some(source => isSnapshotReaderDerived(source, seen))
          seen.delete(symbol)
          return derived
        }

        for (const snapshot of snapshots) {
          const derived = snapshot.kind === 'instance'
            ? isInstanceDerived(snapshot.source)
            : isSnapshotReaderDerived(snapshot.source)
          if (snapshot.owner && rendered.has(snapshot.owner) && derived)
            context.report({ node: snapshot.node, messageId: 'renderSnapshot' })
        }
      },
    }
  },
})
