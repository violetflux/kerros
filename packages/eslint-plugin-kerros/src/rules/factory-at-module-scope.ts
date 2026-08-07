import type { TSESTree } from '@typescript-eslint/utils'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'

const nestedScopeTypes = new Set([
  'ArrowFunctionExpression',
  'BlockStatement',
  'CatchClause',
  'ConditionalExpression',
  'DoWhileStatement',
  'ForInStatement',
  'ForOfStatement',
  'ForStatement',
  'FunctionDeclaration',
  'FunctionExpression',
  'IfStatement',
  'LogicalExpression',
  'StaticBlock',
  'SwitchCase',
  'SwitchStatement',
  'TryStatement',
  'WhileStatement',
])

/** Test whether a factory call executes unconditionally at module scope. */
function isModuleScopeCall(node: TSESTree.CallExpression) {
  let current: TSESTree.Node | undefined = node.parent

  while (current && current.type !== 'Program') {
    if (nestedScopeTypes.has(current.type))
      return false

    current = current.parent
  }

  return current?.type === 'Program'
}

export const factoryAtModuleScope = createRule<[], 'moduleScope'>({
  name: 'factory-at-module-scope',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require Kerros factories to run once at module scope.',
    },
    schema: [],
    messages: {
      moduleScope: 'Kerros factories must be called at module scope.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { getFactoryKind } = createKerrosTypeTools(context)

    return {
      CallExpression(node) {
        if (getFactoryKind(node) && !isModuleScopeCall(node))
          context.report({ node, messageId: 'moduleScope' })
      },
    }
  },
})
