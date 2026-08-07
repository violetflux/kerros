import ts from 'typescript'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'

export const preferBindStore = createRule<[], 'bindExternalStore'>({
  name: 'prefer-bind-store',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer bindStore when a model delegates to React useSyncExternalStore.',
    },
    schema: [],
    messages: {
      bindExternalStore: 'Use bindStore for an existing external Store.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { getFactoryKind, getModelFunction, isReactCall } = createKerrosTypeTools(context)

    /** Test only calls executed directly by the model body, excluding returned callbacks. */
    const readsExternalStore = (model: ts.FunctionLikeDeclaration) => {
      if (!model.body)
        return false

      let found = false

      /** Scan the model body without crossing into nested function lifecycles. */
      const visit = (node: ts.Node) => {
        if (found)
          return
        if (node !== model && ts.isFunctionLike(node))
          return
        if (ts.isCallExpression(node) && isReactCall(node, 'useSyncExternalStore')) {
          found = true
          return
        }
        ts.forEachChild(node, visit)
      }

      visit(model.body)
      return found
    }

    return {
      CallExpression(node) {
        if (getFactoryKind(node) !== 'createStore')
          return

        const model = node.arguments[0]
        if (!model || model.type === 'SpreadElement')
          return

        const declaration = getModelFunction(model)
        if (declaration && readsExternalStore(declaration))
          context.report({ node: model, messageId: 'bindExternalStore' })
      },
    }
  },
})
