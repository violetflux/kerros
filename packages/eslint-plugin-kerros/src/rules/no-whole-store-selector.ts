import type { TSESTree } from '@typescript-eslint/utils'
import type ts from 'typescript'
import { getReturnedExpressions, unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'

/** Collect simple local aliases of a selector's complete Store parameter. */
function getStoreAliases(
  selector: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
  parameter: TSESTree.Identifier,
  getIdentifierSymbol: (node: TSESTree.Identifier) => ts.Symbol | undefined,
) {
  const aliases = new Set<ts.Symbol>()
  const parameterSymbol = getIdentifierSymbol(parameter)
  if (parameterSymbol)
    aliases.add(parameterSymbol)

  if (selector.body.type !== 'BlockStatement')
    return aliases

  const declarations: TSESTree.VariableDeclarator[] = []
  const collectDeclarations = (node: TSESTree.Node) => {
    if (node !== selector.body && (
      node.type === 'ArrowFunctionExpression'
      || node.type === 'FunctionExpression'
      || node.type === 'FunctionDeclaration'
    )) {
      return
    }

    if (node.type === 'VariableDeclarator')
      declarations.push(node)

    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'range' || key === 'loc')
        continue

      const value = node[key as keyof typeof node]
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === 'object' && 'type' in child)
            collectDeclarations(child as TSESTree.Node)
        }
      }
      else if (value && typeof value === 'object' && 'type' in value) {
        collectDeclarations(value as TSESTree.Node)
      }
    }
  }

  collectDeclarations(selector.body)

  let changed = true
  while (changed) {
    changed = false
    for (const declaration of declarations) {
      if (declaration.id.type !== 'Identifier' || !declaration.init)
        continue

      const value = unwrapExpression(declaration.init)
      if (value.type !== 'Identifier')
        continue

      const valueSymbol = getIdentifierSymbol(value)
      const declarationSymbol = getIdentifierSymbol(declaration.id)
      if (valueSymbol && declarationSymbol
        && aliases.has(valueSymbol) && !aliases.has(declarationSymbol)) {
        aliases.add(declarationSymbol)
        changed = true
      }
    }
  }

  return aliases
}

/** Test whether an expression returns or embeds the complete Store value. */
function containsWholeStore(
  node: TSESTree.Node,
  aliases: ReadonlySet<ts.Symbol>,
  getIdentifierSymbol: (node: TSESTree.Identifier) => ts.Symbol | undefined,
): boolean {
  const expression = unwrapExpression(node)
  if (expression.type === 'Identifier') {
    const symbol = getIdentifierSymbol(expression)
    return symbol ? aliases.has(symbol) : false
  }

  if (expression.type === 'ObjectExpression') {
    return expression.properties.some(property => {
      return property.type === 'SpreadElement'
        ? containsWholeStore(property.argument, aliases, getIdentifierSymbol)
        : containsWholeStore(property.value, aliases, getIdentifierSymbol)
    })
  }

  if (expression.type === 'ArrayExpression') {
    return expression.elements.some(element => {
      return element?.type === 'SpreadElement'
        ? containsWholeStore(element.argument, aliases, getIdentifierSymbol)
        : element ? containsWholeStore(element, aliases, getIdentifierSymbol) : false
    })
  }

  if (expression.type === 'ConditionalExpression') {
    return containsWholeStore(expression.consequent, aliases, getIdentifierSymbol)
      || containsWholeStore(expression.alternate, aliases, getIdentifierSymbol)
  }

  if (expression.type === 'LogicalExpression') {
    return containsWholeStore(expression.left, aliases, getIdentifierSymbol)
      || containsWholeStore(expression.right, aliases, getIdentifierSymbol)
  }

  if (expression.type === 'SequenceExpression') {
    const result = expression.expressions.at(-1)
    return result ? containsWholeStore(result, aliases, getIdentifierSymbol) : false
  }

  if (expression.type === 'AssignmentExpression')
    return containsWholeStore(expression.right, aliases, getIdentifierSymbol)

  if (expression.type === 'AwaitExpression' || expression.type === 'YieldExpression') {
    return expression.argument
      ? containsWholeStore(expression.argument, aliases, getIdentifierSymbol)
      : false
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
    const { getIdentifierSymbol, isStoreHookCall } = createKerrosTypeTools(context)

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

        const aliases = getStoreAliases(selector, parameter, getIdentifierSymbol)
        if (getReturnedExpressions(selector).some((expression) => {
          return containsWholeStore(expression, aliases, getIdentifierSymbol)
        })) {
          context.report({ node: selector, messageId: 'wholeStore' })
        }
      },
    }
  },
})
