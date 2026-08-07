import ts from 'typescript'
import { createKerrosTypeTools, getTypeProperty } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { isPrimitiveType } from '../internal/semantic'
import { getTsReturnExpressions, unwrapTsExpression } from '../internal/typescript'

/** Test whether a declaration executes inside one snapshot reader invocation. */
function isInsideFunction(node: ts.Node, owner: ts.FunctionLikeDeclaration) {
  let current: ts.Node | undefined = node
  while (current) {
    if (current === owner)
      return true
    current = current.parent
  }
  return false
}

export const requireCachedSnapshot = createRule<[], 'uncachedSnapshot'>({
  name: 'require-cached-snapshot',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require bindStore snapshots to preserve reference identity between updates.',
    },
    schema: [],
    messages: {
      uncachedSnapshot: 'getSnapshot must return a cached snapshot reference.',
    },
  },
  defaultOptions: [],
  create(context) {
    const {
      checker,
      getFactoryKind,
      getMarkerType,
      getTsNode,
      getTsSymbol,
    } = createKerrosTypeTools(context)

    /** Resolve property functions through methods, arrow properties, and shorthand identifiers. */
    const getImplementations = (symbol: ts.Symbol) => {
      const implementations = new Set<ts.FunctionLikeDeclaration>()
      const seen = new Set<ts.Symbol>()

      /** Follow one syntax node to a concrete function body or referenced symbol. */
      const resolveNode = (node: ts.Node) => {
        if (ts.isFunctionDeclaration(node)
          || ts.isMethodDeclaration(node)
          || ts.isArrowFunction(node)
          || ts.isFunctionExpression(node)) {
          if (node.body)
            implementations.add(node)
          return
        }
        if ((ts.isVariableDeclaration(node) || ts.isPropertyDeclaration(node)) && node.initializer) {
          resolveNode(node.initializer)
          return
        }
        if (ts.isPropertyAssignment(node)) {
          resolveNode(node.initializer)
          return
        }
        if (ts.isShorthandPropertyAssignment(node)) {
          const value = checker.getShorthandAssignmentValueSymbol(node)
          if (value)
            resolveSymbol(value)
          return
        }
        if (ts.isIdentifier(node)) {
          const value = getTsSymbol(node)
          if (value)
            resolveSymbol(value)
          return
        }
        if (ts.isParenthesizedExpression(node)
          || ts.isAsExpression(node)
          || ts.isNonNullExpression(node)
          || ts.isSatisfiesExpression(node)) {
          resolveNode(node.expression)
        }
      }

      /** Follow a symbol's declarations once to avoid recursive aliases. */
      function resolveSymbol(candidate: ts.Symbol) {
        if (seen.has(candidate))
          return
        seen.add(candidate)
        for (const declaration of candidate.declarations ?? [])
          resolveNode(declaration)
      }

      resolveSymbol(symbol)
      return implementations
    }

    /** Prove that a snapshot value is primitive or allocated outside the reader invocation. */
    const isCached = (
      input: ts.Expression,
      owner: ts.FunctionLikeDeclaration,
      seen = new Set<ts.Symbol>(),
    ): boolean => {
      const node = unwrapTsExpression(input)
      const type = checker.getTypeAtLocation(node)
      if (isPrimitiveType(checker, type))
        return true

      if (ts.isObjectLiteralExpression(node)
        || ts.isArrayLiteralExpression(node)
        || ts.isNewExpression(node)
        || ts.isArrowFunction(node)
        || ts.isFunctionExpression(node)
        || ts.isClassExpression(node)
        || ts.isJsxElement(node)
        || ts.isJsxSelfClosingElement(node)
        || ts.isJsxFragment(node)
        || ts.isRegularExpressionLiteral(node)) {
        return false
      }

      if (node.kind === ts.SyntaxKind.ThisKeyword)
        return true
      if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
        return isCached(node.expression, owner, seen)
      if (ts.isConditionalExpression(node))
        return isCached(node.whenTrue, owner, seen) && isCached(node.whenFalse, owner, seen)
      if (ts.isBinaryExpression(node)
        && (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
          || node.operatorToken.kind === ts.SyntaxKind.BarBarToken
          || node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
        return isCached(node.left, owner, seen) && isCached(node.right, owner, seen)
      }
      if (!ts.isIdentifier(node))
        return false

      const symbol = getTsSymbol(node)
      if (!symbol || seen.has(symbol))
        return false
      seen.add(symbol)

      let cached = false
      for (const declaration of symbol.declarations ?? []) {
        if (!isInsideFunction(declaration, owner)) {
          cached = true
          break
        }
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          cached = isCached(declaration.initializer, owner, seen)
          if (cached)
            break
        }
      }

      seen.delete(symbol)
      return cached
    }

    return {
      CallExpression(node) {
        if (getFactoryKind(node) !== 'bindStore')
          return

        const tsNode = getTsNode(node)
        if (!ts.isCallExpression(tsNode))
          return

        const signature = checker.getResolvedSignature(tsNode)
        if (!signature)
          return
        const returnType = checker.getReturnTypeOfSignature(signature)
        const providerProperty = checker.getPropertyOfType(returnType, '1')
        const providerType = providerProperty
          ? checker.getTypeOfSymbolAtLocation(providerProperty, tsNode)
          : undefined
        const storeType = providerType
          ? getMarkerType(providerType, 'externalStoreProvider', tsNode)
          : undefined
        const snapshot = storeType
          ? getTypeProperty(checker, storeType, 'getSnapshot')
          : undefined
        if (!snapshot)
          return

        const uncached = [...getImplementations(snapshot)].some((implementation) => {
          return getTsReturnExpressions(implementation).some(value => !isCached(value, implementation))
        })
        if (uncached)
          context.report({ node, messageId: 'uncachedSnapshot' })
      },
    }
  },
})
