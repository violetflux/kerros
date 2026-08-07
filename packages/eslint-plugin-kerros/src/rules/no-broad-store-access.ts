import type { TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { createReferenceOriginTracker } from '../internal/semantic'

const objectEnumerationMethods = new Set(['entries', 'keys', 'values'])

/** Read the snapshot argument from a complete enumeration or serialization call. */
function getBroadArgument(node: TSESTree.CallExpression) {
  const [argument] = node.arguments
  if (!argument || argument.type === 'SpreadElement')
    return false

  const { callee } = node
  if (callee.type !== 'MemberExpression' || callee.computed)
    return

  if (callee.object.type === 'Identifier' && callee.property.type === 'Identifier') {
    if (callee.object.name === 'Object' && objectEnumerationMethods.has(callee.property.name))
      return argument

    if (callee.object.name === 'JSON' && callee.property.name === 'stringify')
      return argument
  }
}

export const noBroadStoreAccess = createRule<[], 'broadAccess'>({
  name: 'no-broad-store-access',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent complete Store enumeration and serialization.',
    },
    schema: [],
    messages: {
      broadAccess: 'Do not enumerate or spread the complete Store snapshot.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { getIdentifierSymbol, getType, isStoreHookCall } = createKerrosTypeTools(context)
    const origins = createReferenceOriginTracker<TSESTree.Expression>(context.sourceCode.ast)

    /** Test whether an expression originates from a selector-free Store snapshot. */
    const isSnapshotDerived = (
      input: TSESTree.Node,
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
        return isSnapshotDerived(node.right, seen)

      if (node.type === 'MemberExpression')
        return isSnapshotDerived(node.object, seen)

      if (node.type !== 'Identifier')
        return false

      const symbol = getIdentifierSymbol(node)
      if (!symbol || seen.has(symbol))
        return false

      seen.add(symbol)
      const derived = origins.resolve(symbol, node).some(source => (
        isSnapshotDerived(source, seen)
      ))
      seen.delete(symbol)
      return derived
    }

    /** Report one operation that subscribes to every enumerable field. */
    const reportBroadAccess = (expression: TSESTree.Expression) => {
      if (isSnapshotDerived(expression))
        context.report({ node: expression, messageId: 'broadAccess' })
    }

    /** Track object-valued bindings destructured from a snapshot. */
    const recordObjectBindings = (
      pattern: TSESTree.Node,
      source: TSESTree.Expression,
      write: TSESTree.Node,
    ) => {
      if (pattern.type === 'Identifier') {
        if ((getType(pattern).flags & ts.TypeFlags.Object) === 0)
          return

        const symbol = getIdentifierSymbol(pattern)
        if (symbol)
          origins.record(symbol, source, write)
        return
      }

      if (pattern.type === 'AssignmentPattern') {
        recordObjectBindings(pattern.left, source, write)
        return
      }

      if (pattern.type === 'RestElement') {
        return
      }

      if (pattern.type !== 'ObjectPattern' && pattern.type !== 'ArrayPattern')
        return

      const entries = pattern.type === 'ObjectPattern'
        ? pattern.properties
        : pattern.elements

      for (const entry of entries) {
        if (!entry)
          continue
        if (entry.type === 'Property')
          recordObjectBindings(entry.value, source, write)
        else
          recordObjectBindings(entry, source, write)
      }
    }

    return {
      CallExpression(node) {
        const argument = getBroadArgument(node)
        if (argument)
          reportBroadAccess(argument)
      },
      SpreadElement(node) {
        reportBroadAccess(node.argument)
      },
      VariableDeclarator(node) {
        if (!node.init)
          return

        if (node.id.type === 'Identifier') {
          const symbol = getIdentifierSymbol(node.id)
          if (symbol)
            origins.record(symbol, node.init, node)
          return
        }

        if (node.id.type === 'ObjectPattern'
          && node.id.properties.some(property => property.type === 'RestElement')) {
          reportBroadAccess(node.init)
        }

        recordObjectBindings(node.id, node.init, node)
      },
      AssignmentExpression(node) {
        if (node.left.type !== 'Identifier')
          return

        const symbol = getIdentifierSymbol(node.left)
        if (symbol)
          origins.record(symbol, node.right, node)
      },
    }
  },
})
