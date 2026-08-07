import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'

export const selectorParameterName = createRule<[], 'parameterName'>({
  name: 'selector-parameter-name',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use s as the conventional Kerros selector parameter name.',
    },
    schema: [],
    messages: {
      parameterName: 'Name the Store selector parameter s.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { isStoreHookCall } = createKerrosTypeTools(context)

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
        if (parameter && (parameter.type !== 'Identifier' || parameter.name !== 's'))
          context.report({ node: parameter, messageId: 'parameterName' })
      },
    }
  },
})
