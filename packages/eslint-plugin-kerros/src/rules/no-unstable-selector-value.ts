import type { TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { getReturnedExpressions, unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools, isModuleDeclaration } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { getInlineSelector, isPrimitiveType } from '../internal/semantic'

/** Collect object literals that directly form selector return branches. */
function collectSelectionObjects(
  input: TSESTree.Node,
  objects: TSESTree.ObjectExpression[],
  getInitializer: (node: TSESTree.Identifier) => TSESTree.Node | undefined,
  seen = new Set<TSESTree.Node>(),
) {
  const node = unwrapExpression(input)
  if (seen.has(node))
    return
  seen.add(node)

  if (node.type === 'ObjectExpression') {
    objects.push(node)
    return
  }

  if (node.type === 'Identifier') {
    const initializer = getInitializer(node)
    if (initializer)
      collectSelectionObjects(initializer, objects, getInitializer, seen)
    return
  }

  if (node.type === 'ConditionalExpression') {
    collectSelectionObjects(node.consequent, objects, getInitializer, seen)
    collectSelectionObjects(node.alternate, objects, getInitializer, seen)
  }
  else if (node.type === 'LogicalExpression') {
    collectSelectionObjects(node.left, objects, getInitializer, seen)
    collectSelectionObjects(node.right, objects, getInitializer, seen)
  }
  else if (node.type === 'SequenceExpression') {
    const result = node.expressions.at(-1)
    if (result)
      collectSelectionObjects(result, objects, getInitializer, seen)
  }
}

export const noUnstableSelectorValue = createRule<[], 'unstableValue'>({
  name: 'no-unstable-selector-value',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent selector fields from allocating unstable references.',
    },
    schema: [],
    messages: {
      unstableValue: 'Selector fields must not create a new reference on every call.',
    },
  },
  defaultOptions: [],
  create(context) {
    const {
      checker,
      getIdentifierSymbol,
      getType,
      isStoreHookCall,
      services,
    } = createKerrosTypeTools(context)

    /** Resolve a non-module variable to the expression assigned in its declaration. */
    const getLocalInitializer = (node: TSESTree.Identifier) => {
      const symbol = getIdentifierSymbol(node)
      const declaration = symbol?.declarations?.find(ts.isVariableDeclaration)
      if (!declaration?.initializer || isModuleDeclaration(declaration))
        return undefined

      return services.tsNodeToESTreeNodeMap.get(declaration.initializer)
    }

    /** Test whether an expression preserves a primitive or previously cached reference. */
    const isStable = (input: TSESTree.Node, seen = new Set<ts.Symbol>()): boolean => {
      const node = unwrapExpression(input)
      if (node.type === 'Literal')
        return !('regex' in node)
      if (node.type === 'MemberExpression')
        return true
      if (node.type === 'ConditionalExpression')
        return isStable(node.consequent, seen) && isStable(node.alternate, seen)
      if (node.type === 'LogicalExpression')
        return isStable(node.left, seen) && isStable(node.right, seen)
      if (node.type === 'SequenceExpression') {
        const result = node.expressions.at(-1)
        return result ? isStable(result, seen) : true
      }

      if (node.type === 'Identifier') {
        const symbol = getIdentifierSymbol(node)
        if (symbol?.declarations?.some(isModuleDeclaration))
          return true

        if (isPrimitiveType(checker, getType(node)))
          return true
        if (!symbol || seen.has(symbol))
          return false

        seen.add(symbol)
        const declaration = symbol.declarations?.find(ts.isVariableDeclaration)
        const initializer = declaration?.initializer
          ? services.tsNodeToESTreeNodeMap.get(declaration.initializer)
          : undefined
        const stable = initializer ? isStable(initializer, seen) : false
        seen.delete(symbol)
        return stable
      }

      if (node.type === 'ObjectExpression'
        || node.type === 'ArrayExpression'
        || node.type === 'ArrowFunctionExpression'
        || node.type === 'FunctionExpression'
        || node.type === 'ClassExpression'
        || node.type === 'NewExpression'
        || node.type === 'JSXElement'
        || node.type === 'JSXFragment') {
        return false
      }

      return isPrimitiveType(checker, getType(node))
    }

    return {
      CallExpression(node) {
        const selector = getInlineSelector(node, isStoreHookCall)
        if (!selector)
          return

        const objects: TSESTree.ObjectExpression[] = []
        for (const expression of getReturnedExpressions(selector))
          collectSelectionObjects(expression, objects, getLocalInitializer)

        for (const object of objects) {
          for (const property of object.properties) {
            if (property.type === 'Property' && !isStable(property.value))
              context.report({ node: property.value, messageId: 'unstableValue' })
          }
        }
      },
    }
  },
})
