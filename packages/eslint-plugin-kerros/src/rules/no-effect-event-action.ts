import type { TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { createReferenceOriginTracker } from '../internal/semantic'
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
      getIdentifierSymbol,
      getModelFunction,
      getTsNode,
      getTsSymbol,
      isReactCall,
      services,
    } = createKerrosTypeTools(context)
    const origins = createReferenceOriginTracker<TSESTree.Expression>(context.sourceCode.ast)
    const candidates: Array<{
      declaration: ts.FunctionLikeDeclaration
      node: TSESTree.Node
    }> = []

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

      /** Prefer the shared flow tracker for current-file references, with TS fallback cross-file. */
      const getSources = (symbol: ts.Symbol, reference: ts.Node): ts.Expression[] => {
        const estreeReference = services.tsNodeToESTreeNodeMap.get(reference)
        if (estreeReference) {
          const expressions: ts.Expression[] = []
          for (const source of origins.resolve(symbol, estreeReference)) {
            const tsSource: ts.Node = getTsNode(source)
            if (ts.isExpression(tsSource))
              expressions.push(tsSource)
          }
          return expressions
        }
        return getReachingWrites(symbol, reference.getStart()).map(source => source.source)
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

      /** Resolve local aliases and logical branches of returned Store objects. */
      function getStoreObjects(
        input: ts.Expression,
        reference = input.getStart(),
        seen = new Set<ts.Symbol>(),
      ): ts.ObjectLiteralExpression[] {
        const node = unwrapTsExpression(input)
        if (ts.isObjectLiteralExpression(node))
          return [node]
        if (ts.isConditionalExpression(node)) {
          return [
            ...getStoreObjects(node.whenTrue, reference, seen),
            ...getStoreObjects(node.whenFalse, reference, seen),
          ]
        }
        if (ts.isBinaryExpression(node)
          && (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
            || node.operatorToken.kind === ts.SyntaxKind.BarBarToken
            || node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
          return [
            ...getStoreObjects(node.left, reference, seen),
            ...getStoreObjects(node.right, reference, seen),
          ]
        }
        if (ts.isCommaListExpression(node)) {
          const value = node.elements.at(-1)
          return value ? getStoreObjects(value, reference, seen) : []
        }
        if (!ts.isIdentifier(node))
          return []

        const symbol = getTsSymbol(node)
        if (!symbol || seen.has(symbol))
          return []
        seen.add(symbol)
        const objects = getSources(symbol, node).flatMap((source) => {
          return getStoreObjects(source, source.getStart(), seen)
        })
        seen.delete(symbol)
        return objects
      }

      /** Read a statically named TypeScript object property. */
      function getPropertyName(node: ts.PropertyName) {
        if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node))
          return node.text
        return undefined
      }

      /** Test whether an expression originates from React useEffectEvent. */
      function isEffectEvent(
        input: ts.Expression,
        reference = input.getStart(),
        seen = new Set<ts.Symbol>(),
      ): boolean {
        const node = unwrapTsExpression(input)
        if (ts.isCallExpression(node))
          return isReactCall(node, 'useEffectEvent')
        if (ts.isConditionalExpression(node)) {
          return isEffectEvent(node.whenTrue, reference, seen)
            || isEffectEvent(node.whenFalse, reference, seen)
        }
        if (ts.isBinaryExpression(node)
          && (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
            || node.operatorToken.kind === ts.SyntaxKind.BarBarToken
            || node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
          return isEffectEvent(node.left, reference, seen)
            || isEffectEvent(node.right, reference, seen)
        }
        if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
          const name = ts.isPropertyAccessExpression(node)
            ? node.name.text
            : node.argumentExpression && ts.isStringLiteralLike(node.argumentExpression)
              ? node.argumentExpression.text
              : undefined
          if (!name)
            return false
          return getStoreObjects(node.expression, reference).some((object) => {
            return object.properties.some((property) => {
              if (ts.isShorthandPropertyAssignment(property))
                return property.name.text === name && isEffectEvent(property.name)
              return ts.isPropertyAssignment(property)
                && getPropertyName(property.name) === name
                && isEffectEvent(property.initializer)
            })
          })
        }
        if (!ts.isIdentifier(node))
          return false

        const symbol = getTsSymbol(node)
        if (!symbol || seen.has(symbol))
          return false
        seen.add(symbol)
        const effectEvent = getSources(symbol, node).some((source) => {
          return isEffectEvent(source, source.getStart(), seen)
        })
        seen.delete(symbol)
        return effectEvent
      }

      /** Test Store properties and recursively expanded object spreads. */
      function objectContainsEffectEvent(
        object: ts.ObjectLiteralExpression,
        seen = new Set<ts.ObjectLiteralExpression>(),
      ): boolean {
        if (seen.has(object))
          return false
        seen.add(object)

        for (const property of object.properties) {
          if (ts.isSpreadAssignment(property)) {
            if (getStoreObjects(property.expression, property.getStart()).some((spread) => {
              return objectContainsEffectEvent(spread, seen)
            })) {
              return true
            }
            continue
          }

          const value = ts.isPropertyAssignment(property)
            ? property.initializer
            : ts.isShorthandPropertyAssignment(property)
              ? property.name
              : undefined
          if (value && isEffectEvent(value))
            return true
        }

        return false
      }

      for (const returned of getTsReturnExpressions(model)) {
        if (getStoreObjects(returned).some(object => objectContainsEffectEvent(object)))
          return true
      }

      return false
    }

    return {
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !node.init)
          return
        const symbol = getIdentifierSymbol(node.id)
        if (symbol)
          origins.record(symbol, node.init, node)
      },
      AssignmentExpression(node) {
        if (node.left.type !== 'Identifier')
          return
        const symbol = getIdentifierSymbol(node.left)
        if (symbol)
          origins.record(symbol, node.right, node)
      },
      CallExpression(node) {
        if (getFactoryKind(node) !== 'createStore')
          return

        const model = node.arguments[0]
        if (!model || model.type === 'SpreadElement')
          return

        const declaration = getModelFunction(model)
        if (declaration)
          candidates.push({ declaration, node: model })
      },
      'Program:exit'() {
        for (const candidate of candidates) {
          if (exposesEffectEvent(candidate.declaration))
            context.report({ node: candidate.node, messageId: 'effectEventAction' })
        }
      },
    }
  },
})
