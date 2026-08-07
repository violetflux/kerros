import type { TSESTree } from '@typescript-eslint/utils'

const transparentExpressionTypes = new Set([
  'ChainExpression',
  'TSAsExpression',
  'TSInstantiationExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
])

/** Remove syntax-only expression wrappers without changing runtime ownership. */
export function unwrapExpression(node: TSESTree.Node): TSESTree.Node {
  let current = node

  while (transparentExpressionTypes.has(current.type) && 'expression' in current)
    current = current.expression as TSESTree.Node

  return current
}

/** Return the direct expressions produced by a selector body. */
export function getReturnedExpressions(
  selector: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
) {
  if (selector.body.type !== 'BlockStatement')
    return [selector.body]

  const expressions: TSESTree.Expression[] = []
  const visit = (node: TSESTree.Node) => {
    if (node !== selector.body && (
      node.type === 'ArrowFunctionExpression'
      || node.type === 'FunctionExpression'
      || node.type === 'FunctionDeclaration'
    )) {
      return
    }

    if (node.type === 'ReturnStatement' && node.argument) {
      expressions.push(node.argument)
      return
    }

    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'range' || key === 'loc')
        continue

      const value = node[key as keyof typeof node]
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === 'object' && 'type' in child)
            visit(child as TSESTree.Node)
        }
      }
      else if (value && typeof value === 'object' && 'type' in value) {
        visit(value as TSESTree.Node)
      }
    }
  }

  visit(selector.body)
  return expressions
}
