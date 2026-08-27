import type { TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { createReferenceOriginTracker } from '../internal/semantic'

const objectEnumerationMethods = new Set(['entries', 'keys', 'values'])

interface Options {
  includeObjectFields?: boolean
}

interface StoreOrigin {
  expression: TSESTree.Expression
  objectField: boolean
}

type StoreOriginKind = 'objectField' | 'snapshot'

/** Read the tracked value argument from a broad enumeration or serialization call. */
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

export const noBroadStoreAccess = createRule<[Options], 'broadAccess' | 'broadObjectField'>({
  name: 'no-broad-store-access',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent broad enumeration and serialization of complete Store snapshots.',
    },
    schema: [{
      type: 'object',
      properties: {
        includeObjectFields: { type: 'boolean' },
      },
      additionalProperties: false,
    }],
    messages: {
      broadAccess: 'Do not enumerate, serialize, or spread a complete selector-free Store snapshot.',
      broadObjectField: 'Do not enumerate, serialize, or spread an object field from a selector-free Store snapshot.',
    },
  },
  defaultOptions: [{ includeObjectFields: false }],
  create(context, [options]) {
    const { getIdentifierSymbol, getType, isStoreHookCall } = createKerrosTypeTools(context)
    const origins = createReferenceOriginTracker<StoreOrigin>(context.sourceCode.ast)

    /** Classify whether an expression is a complete Store snapshot or one object field from it. */
    const readStoreOrigin = (
      input: TSESTree.Node,
      seen = new Set<ts.Symbol>(),
    ): StoreOriginKind | undefined => {
      const node = unwrapExpression(input)

      if (node.type === 'CallExpression') {
        const selector = node.arguments[0]
        const selectorFree = node.arguments.length === 0
          || (node.arguments.length === 1
            && selector?.type !== 'SpreadElement'
            && (getType(selector).flags & ts.TypeFlags.Undefined) !== 0)

        return selectorFree && isStoreHookCall(node) ? 'snapshot' : undefined
      }

      if (node.type === 'AssignmentExpression')
        return readStoreOrigin(node.right, seen)

      if (node.type === 'MemberExpression') {
        return readStoreOrigin(node.object, seen) ? 'objectField' : undefined
      }

      if (node.type !== 'Identifier')
        return

      const symbol = getIdentifierSymbol(node)
      if (!symbol || seen.has(symbol))
        return

      seen.add(symbol)
      let result: StoreOriginKind | undefined
      for (const source of origins.resolve(symbol, node)) {
        const origin = readStoreOrigin(source.expression, seen)
        if (!origin)
          continue

        if (!source.objectField && origin === 'snapshot') {
          result = 'snapshot'
          break
        }
        result = 'objectField'
      }
      seen.delete(symbol)
      return result
    }

    /** Report one operation that subscribes to every enumerable field. */
    const reportBroadAccess = (expression: TSESTree.Expression) => {
      const origin = readStoreOrigin(expression)
      if (origin === 'snapshot')
        context.report({ node: expression, messageId: 'broadAccess' })
      else if (origin === 'objectField' && options.includeObjectFields)
        context.report({ node: expression, messageId: 'broadObjectField' })
    }

    /** Track object-valued bindings destructured from a snapshot. */
    const recordObjectBindings = (
      pattern: TSESTree.Node,
      source: TSESTree.Expression,
      write: TSESTree.Node,
      objectField = false,
    ) => {
      if (pattern.type === 'Identifier') {
        if ((getType(pattern).flags & ts.TypeFlags.Object) === 0)
          return

        const symbol = getIdentifierSymbol(pattern)
        if (symbol)
          origins.record(symbol, { expression: source, objectField }, write)
        return
      }

      if (pattern.type === 'AssignmentPattern') {
        recordObjectBindings(pattern.left, source, write, objectField)
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
          recordObjectBindings(entry.value, source, write, true)
        else
          recordObjectBindings(entry, source, write, true)
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
            origins.record(symbol, { expression: node.init, objectField: false }, node)
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
          origins.record(symbol, { expression: node.right, objectField: false }, node)
      },
    }
  },
})
