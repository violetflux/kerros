import ts from 'typescript'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { getTsReturnExpressions, unwrapTsExpression } from '../internal/typescript'

export const noEffectEventAction = createRule<[], 'effectEventAction'>({
  name: 'no-effect-event-action',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent React Effect Events from becoming public Store actions.',
    },
    schema: [],
    messages: {
      effectEventAction: 'A useEffectEvent function cannot be exposed as a Store action.',
    },
  },
  defaultOptions: [],
  create(context) {
    const {
      getFactoryKind,
      getModelFunction,
      getTsSymbol,
      isReactCall,
    } = createKerrosTypeTools(context)

    /** Test whether one model exposes an Effect Event in its returned Store object. */
    const exposesEffectEvent = (model: ts.FunctionLikeDeclaration) => {
      const writes = new Map<ts.Symbol, Array<{
        conditional: boolean
        source: ts.Expression
        write: ts.Node
      }>>()
      if (!model.body)
        return false

      /** Record one local value source at its execution point. */
      const record = (symbol: ts.Symbol, source: ts.Expression, write: ts.Node) => {
        let conditional = false
        let current: ts.Node | undefined = write.parent
        while (current && current !== model) {
          if (ts.isIfStatement(current)
            || ts.isConditionalExpression(current)
            || ts.isSwitchStatement(current)
            || ts.isForStatement(current)
            || ts.isForInStatement(current)
            || ts.isForOfStatement(current)
            || ts.isWhileStatement(current)
            || ts.isTryStatement(current)) {
            conditional = true
            break
          }
          current = current.parent
        }
        writes.set(symbol, [...(writes.get(symbol) ?? []), { conditional, source, write }])
      }

      /** Resolve straight-line overwrites while retaining conditional alternatives. */
      const getReachingWrites = (symbol: ts.Symbol, reference: number) => {
        let reaching: Array<{
          conditional: boolean
          source: ts.Expression
          write: ts.Node
        }> = []
        for (const candidate of writes.get(symbol) ?? []) {
          if (candidate.write.end > reference)
            continue
          reaching = candidate.conditional ? [...reaching, candidate] : [candidate]
        }
        return reaching
      }

      /** Record local aliases and assignments owned by this model invocation. */
      const collectWrites = (node: ts.Node) => {
        if (node !== model.body && ts.isFunctionLike(node))
          return
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
          const symbol = getTsSymbol(node.name)
          if (symbol)
            record(symbol, node.initializer, node)
        }
        else if (ts.isBinaryExpression(node)
          && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
          && ts.isIdentifier(node.left)) {
          const symbol = getTsSymbol(node.left)
          if (symbol)
            record(symbol, node.right, node)
        }
        ts.forEachChild(node, collectWrites)
      }
      collectWrites(model.body)

      /** Test whether an expression originates from React useEffectEvent. */
      const isEffectEvent = (
        input: ts.Expression,
        reference = input.getStart(),
        seen = new Set<ts.Symbol>(),
      ): boolean => {
        const node = unwrapTsExpression(input)
        if (ts.isCallExpression(node))
          return isReactCall(node, 'useEffectEvent')
        if (ts.isConditionalExpression(node))
          return isEffectEvent(node.whenTrue, reference, seen)
            || isEffectEvent(node.whenFalse, reference, seen)
        if (ts.isBinaryExpression(node)
          && (node.operatorToken.kind === ts.SyntaxKind.BarBarToken
            || node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
          return isEffectEvent(node.left, reference, seen)
            || isEffectEvent(node.right, reference, seen)
        }
        if (!ts.isIdentifier(node))
          return false

        const symbol = getTsSymbol(node)
        if (!symbol || seen.has(symbol))
          return false
        seen.add(symbol)
        const effectEvent = getReachingWrites(symbol, reference).some((source) => {
          return isEffectEvent(source.source, source.write.getStart(), seen)
        })
        seen.delete(symbol)
        return effectEvent
      }

      /** Resolve local aliases of returned Store object literals. */
      const getStoreObjects = (
        input: ts.Expression,
        reference = input.getStart(),
        seen = new Set<ts.Symbol>(),
      ): ts.ObjectLiteralExpression[] => {
        const node = unwrapTsExpression(input)
        if (ts.isObjectLiteralExpression(node))
          return [node]
        if (ts.isConditionalExpression(node)) {
          return [
            ...getStoreObjects(node.whenTrue, reference, seen),
            ...getStoreObjects(node.whenFalse, reference, seen),
          ]
        }
        if (!ts.isIdentifier(node))
          return []

        const symbol = getTsSymbol(node)
        if (!symbol || seen.has(symbol))
          return []
        seen.add(symbol)
        const objects = getReachingWrites(symbol, reference).flatMap((source) => {
          return getStoreObjects(source.source, source.write.getStart(), seen)
        })
        seen.delete(symbol)
        return objects
      }

      for (const returned of getTsReturnExpressions(model)) {
        for (const object of getStoreObjects(returned)) {
          for (const property of object.properties) {
            const value = ts.isPropertyAssignment(property)
              ? property.initializer
              : ts.isShorthandPropertyAssignment(property)
                ? property.name
                : undefined
            if (value && isEffectEvent(value))
              return true
          }
        }
      }

      return false
    }

    return {
      CallExpression(node) {
        if (getFactoryKind(node) !== 'createStore')
          return

        const model = node.arguments[0]
        if (!model || model.type === 'SpreadElement')
          return

        const declaration = getModelFunction(model)
        if (declaration && exposesEffectEvent(declaration))
          context.report({ node: model, messageId: 'effectEventAction' })
      },
    }
  },
})
