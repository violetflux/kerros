import type { TSESTree } from '@typescript-eslint/utils'
import { getReturnedExpressions, unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'

/** Collect simple local aliases of a selector's complete Store parameter. */
function getStoreAliases(
  selector: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
  parameter: TSESTree.Identifier,
) {
  const aliases = new Set([parameter.name])
  if (selector.body.type !== 'BlockStatement')
    return aliases

  let changed = true
  while (changed) {
    changed = false
    for (const statement of selector.body.body) {
      if (statement.type !== 'VariableDeclaration')
        continue

      for (const declaration of statement.declarations) {
        if (declaration.id.type !== 'Identifier' || !declaration.init)
          continue

        const value = unwrapExpression(declaration.init)
        if (value.type === 'Identifier' && aliases.has(value.name) && !aliases.has(declaration.id.name)) {
          aliases.add(declaration.id.name)
          changed = true
        }
      }
    }
  }

  return aliases
}

/** Test whether an expression returns or embeds the complete Store value. */
function containsWholeStore(node: TSESTree.Node, aliases: ReadonlySet<string>): boolean {
  const expression = unwrapExpression(node)
  if (expression.type === 'Identifier')
    return aliases.has(expression.name)

  if (expression.type === 'MemberExpression') {
    if (expression.computed && containsWholeStore(expression.property, aliases))
      return true

    const object = unwrapExpression(expression.object)
    return object.type !== 'Identifier' && containsWholeStore(object, aliases)
  }

  for (const key of Object.keys(expression)) {
    if (key === 'parent' || key === 'range' || key === 'loc')
      continue

    const value = expression[key as keyof typeof expression]
    if (Array.isArray(value)) {
      if (value.some(child => child && typeof child === 'object' && 'type' in child
        && containsWholeStore(child as TSESTree.Node, aliases))) {
        return true
      }
    }
    else if (value && typeof value === 'object' && 'type' in value
      && containsWholeStore(value as TSESTree.Node, aliases)) {
      return true
    }
  }

  return false
}

export const noWholeStoreSelector = createRule<[], 'wholeStore'>({
  name: 'no-whole-store-selector',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent selectors from returning the complete Store.',
    },
    schema: [],
    messages: {
      wholeStore: 'A selector cannot return or wrap the complete Store.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { isStoreHookCall } = createKerrosTypeTools(context)

    return {
      CallExpression(node) {
        if (!isStoreHookCall(node))
          return

        const selector = node.arguments[0]
        if (!selector || selector.type === 'SpreadElement'
          || (selector.type !== 'ArrowFunctionExpression' && selector.type !== 'FunctionExpression')) {
          return
        }

        const parameter = selector.params[0]
        if (!parameter || parameter.type !== 'Identifier')
          return

        const aliases = getStoreAliases(selector, parameter)
        if (getReturnedExpressions(selector).some(expression => containsWholeStore(expression, aliases)))
          context.report({ node: selector, messageId: 'wholeStore' })
      },
    }
  },
})
