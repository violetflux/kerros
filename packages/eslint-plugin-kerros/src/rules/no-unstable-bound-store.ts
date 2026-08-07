import ts from 'typescript'
import { createKerrosTypeTools, isModuleDeclaration } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { isPrimitiveType } from '../internal/semantic'
import { unwrapTsExpression } from '../internal/typescript'

/** Test whether a binding declaration originates from a component parameter. */
function isParameterBinding(input: ts.Declaration) {
  let node: ts.Node | undefined = input
  while (node) {
    if (ts.isParameter(node))
      return true
    if (ts.isVariableDeclaration(node) || ts.isFunctionLike(node.parent))
      return false
    node = node.parent
  }
  return false
}

export const noUnstableBoundStore = createRule<[], 'unstableStore'>({
  name: 'no-unstable-bound-store',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require stable Store instances for bindStore Providers.',
    },
    schema: [],
    messages: {
      unstableStore: 'The Provider store prop must have stable identity.',
    },
  },
  defaultOptions: [],
  create(context) {
    const {
      checker,
      getTsNode,
      getTsSymbol,
      getType,
      hasMarker,
      isReactCall,
    } = createKerrosTypeTools(context)

    /** Test whether an expression is a ref object created by React useRef. */
    const isStableRef = (input: ts.Expression, seen = new Set<ts.Symbol>()): boolean => {
      const node = unwrapTsExpression(input)
      if (ts.isCallExpression(node))
        return isReactCall(node, 'useRef')
      if (!ts.isIdentifier(node))
        return false

      const symbol = getTsSymbol(node)
      if (!symbol || seen.has(symbol))
        return false
      seen.add(symbol)

      const stable = symbol.declarations?.some((declaration) => {
        return ts.isVariableDeclaration(declaration)
          && declaration.initializer !== undefined
          && isStableRef(declaration.initializer, seen)
      }) === true
      seen.delete(symbol)
      return stable
    }

    /** Test whether a destructured value is the lazy state owned by React useState. */
    const isLazyStateBinding = (declaration: ts.Declaration) => {
      if (!ts.isBindingElement(declaration)
        || !ts.isArrayBindingPattern(declaration.parent)
        || declaration.parent.elements[0] !== declaration) {
        return false
      }

      const variable = declaration.parent.parent
      if (!ts.isVariableDeclaration(variable) || !variable.initializer)
        return false
      const initializer = unwrapTsExpression(variable.initializer)
      if (!ts.isCallExpression(initializer) || !isReactCall(initializer, 'useState'))
        return false

      const initialState = initializer.arguments[0]
      return initialState !== undefined
        && checker.getTypeAtLocation(initialState).getCallSignatures().length > 0
    }

    /** Prove a Provider value is retained outside the current render. */
    const isStable = (
      input: ts.Expression,
      seen = new Set<ts.Symbol>(),
    ): boolean => {
      const node = unwrapTsExpression(input)
      if (isPrimitiveType(checker, checker.getTypeAtLocation(node)))
        return true
      if (node.kind === ts.SyntaxKind.ThisKeyword)
        return true
      if (ts.isObjectLiteralExpression(node)
        || ts.isArrayLiteralExpression(node)
        || ts.isNewExpression(node)
        || ts.isArrowFunction(node)
        || ts.isFunctionExpression(node)
        || ts.isClassExpression(node)) {
        return false
      }
      if (ts.isCallExpression(node))
        return isReactCall(node, 'useMemo')
      if (ts.isPropertyAccessExpression(node)) {
        if (node.name.text === 'current' && isStableRef(node.expression))
          return true
        return isStable(node.expression, seen)
      }
      if (ts.isElementAccessExpression(node))
        return isStable(node.expression, seen)
      if (ts.isConditionalExpression(node))
        return isStable(node.whenTrue, seen) && isStable(node.whenFalse, seen)
      if (ts.isBinaryExpression(node)
        && (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
          || node.operatorToken.kind === ts.SyntaxKind.BarBarToken
          || node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
        return isStable(node.left, seen) && isStable(node.right, seen)
      }
      if (!ts.isIdentifier(node))
        return false

      const symbol = getTsSymbol(node)
      if (!symbol || seen.has(symbol))
        return false
      seen.add(symbol)

      let stable = false
      for (const declaration of symbol.declarations ?? []) {
        if (isModuleDeclaration(declaration)
          || isParameterBinding(declaration)
          || isLazyStateBinding(declaration)) {
          stable = true
          break
        }
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          stable = isStable(declaration.initializer, seen)
          if (stable)
            break
        }
        if (ts.isBindingElement(declaration)
          && ts.isObjectBindingPattern(declaration.parent)) {
          const variable = declaration.parent.parent
          if (ts.isVariableDeclaration(variable) && variable.initializer) {
            stable = isStable(variable.initializer, seen)
            if (stable)
              break
          }
        }
      }

      seen.delete(symbol)
      return stable
    }

    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'store')
          return
        const opening = node.parent
        if (opening?.type !== 'JSXOpeningElement'
          || !hasMarker(getType(opening.name), 'externalStoreProvider')) {
          return
        }
        if (node.value?.type !== 'JSXExpressionContainer'
          || node.value.expression.type === 'JSXEmptyExpression') {
          return
        }

        const value = getTsNode(node.value.expression)
        if (ts.isExpression(value) && !isStable(value))
          context.report({ node: node.value.expression, messageId: 'unstableStore' })
      },
    }
  },
})
