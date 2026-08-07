import type { TSESTree } from '@typescript-eslint/utils'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'

const transparentParents = new Set([
  'ChainExpression',
  'TSAsExpression',
  'TSInstantiationExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
])

/** Find the first parent that changes how a Store snapshot is consumed. */
function getConsumptionParent(node: TSESTree.CallExpression) {
  let current: TSESTree.Node = node
  let parent: TSESTree.Node | undefined = current.parent

  while (parent && transparentParents.has(parent.type)) {
    current = parent as TSESTree.Node
    parent = current.parent
  }

  return { current, parent }
}

/** Test whether the snapshot is read immediately without retaining the Proxy. */
function hasImmediateAccess(node: TSESTree.CallExpression) {
  const { current, parent } = getConsumptionParent(node)
  if (!parent)
    return false

  if (parent.type === 'MemberExpression' && parent.object === current)
    return true

  return parent.type === 'VariableDeclarator'
    && parent.init === current
    && parent.id.type === 'ObjectPattern'
}

export const requireImmediateStoreAccess = createRule<[], 'immediateAccess'>({
  name: 'require-immediate-store-access',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require immediate property access for selector-free Store Hooks.',
    },
    schema: [],
    messages: {
      immediateAccess: 'Immediately destructure or read a property from a selector-free Store Hook.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { isStoreHookCall } = createKerrosTypeTools(context)

    return {
      CallExpression(node) {
        if (node.arguments.length === 0 && isStoreHookCall(node) && !hasImmediateAccess(node))
          context.report({ node, messageId: 'immediateAccess' })
      },
    }
  },
})
