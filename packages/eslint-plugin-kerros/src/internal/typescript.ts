import ts from 'typescript'

/** Remove TypeScript expression wrappers that preserve runtime identity. */
export function unwrapTsExpression(input: ts.Expression): ts.Expression {
  let node = input
  while (ts.isParenthesizedExpression(node)
    || ts.isAsExpression(node)
    || ts.isTypeAssertionExpression(node)
    || ts.isNonNullExpression(node)
    || ts.isSatisfiesExpression(node)) {
    node = node.expression
  }
  return node
}

/** Collect direct function return values without entering nested callbacks. */
export function getTsReturnExpressions(fn: ts.FunctionLikeDeclaration) {
  if (ts.isArrowFunction(fn) && !ts.isBlock(fn.body))
    return [fn.body]

  const expressions: ts.Expression[] = []
  if (!fn.body)
    return expressions

  /** Scan control-flow branches owned by the current function. */
  const visit = (node: ts.Node) => {
    if (node !== fn.body && ts.isFunctionLike(node))
      return
    if (ts.isReturnStatement(node) && node.expression) {
      expressions.push(node.expression)
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(fn.body)
  return expressions
}
