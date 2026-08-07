import { createKerrosTypeTools, getTypeProperty } from '../internal/kerros-types'
import { createRule } from '../internal/rule'

export const noProviderKeyProp = createRule<[], 'keyProp'>({
  name: 'no-provider-key-prop',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent createStore models from consuming React key as a Provider prop.',
    },
    schema: [],
    messages: {
      keyProp: 'React key is not a Provider prop and cannot be consumed by a model.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { checker, getFactoryKind, getType } = createKerrosTypeTools(context)

    return {
      CallExpression(node) {
        if (getFactoryKind(node) !== 'createStore')
          return

        const model = node.arguments[0]
        if (!model || model.type === 'SpreadElement')
          return

        const signature = getType(model).getCallSignatures()[0]
        const props = signature?.getParameters()[0]
        const declaration = props?.valueDeclaration ?? props?.declarations?.[0]
        if (!props || !declaration)
          return

        const propsType = checker.getTypeOfSymbolAtLocation(props, declaration)
        if (getTypeProperty(checker, propsType, 'key'))
          context.report({ node: model, messageId: 'keyProp' })
      },
    }
  },
})
