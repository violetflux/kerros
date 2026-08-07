import type { TSESTree } from '@typescript-eslint/utils'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'

const objectEnumerationMethods = new Set(['entries', 'keys', 'values'])

/** Test whether a call enumerates or serializes its Store snapshot argument. */
function isBroadConsumer(parent: TSESTree.Node | undefined, node: TSESTree.CallExpression) {
  if (parent?.type !== 'CallExpression' || !parent.arguments.includes(node))
    return false

  const { callee } = parent
  if (callee.type !== 'MemberExpression' || callee.computed)
    return false

  if (callee.object.type === 'Identifier' && callee.property.type === 'Identifier') {
    if (callee.object.name === 'Object' && objectEnumerationMethods.has(callee.property.name))
      return true

    return callee.object.name === 'JSON' && callee.property.name === 'stringify'
  }

  return false
}

/** Test whether object syntax expands the complete Store snapshot. */
function isBroadSyntax(parent: TSESTree.Node | undefined, node: TSESTree.CallExpression) {
  if (parent?.type === 'SpreadElement' && parent.argument === node)
    return true

  if (parent?.type !== 'VariableDeclarator' || parent.init !== node || parent.id.type !== 'ObjectPattern')
    return false

  return parent.id.properties.some(property => property.type === 'RestElement')
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
    const { isStoreHookCall } = createKerrosTypeTools(context)

    return {
      CallExpression(node) {
        if (node.arguments.length > 0 || !isStoreHookCall(node))
          return

        if (isBroadSyntax(node.parent, node) || isBroadConsumer(node.parent, node))
          context.report({ node, messageId: 'broadAccess' })
      },
    }
  },
})
