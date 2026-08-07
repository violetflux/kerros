import type { TSESTree } from '@typescript-eslint/utils'
import { createKerrosTypeTools, isModuleDeclaration } from '../internal/kerros-types'
import { createRule } from '../internal/rule'

const modelNamePattern = /^use[A-Z][A-Za-z0-9]*Model$/u

export const modelConvention = createRule<[], 'anonymousModel' | 'modelName' | 'moduleModel'>({
  name: 'model-convention',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require createStore models to be named module-level Hooks.',
    },
    schema: [],
    messages: {
      anonymousModel: 'createStore requires a named model Hook.',
      modelName: 'The model Hook must be named useXxxModel.',
      moduleModel: 'The model Hook must be declared at module scope.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { getFactoryKind, getIdentifierSymbol } = createKerrosTypeTools(context)

    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (getFactoryKind(node) !== 'createStore')
          return

        const model = node.arguments[0]
        if (!model || model.type === 'SpreadElement')
          return

        if (model.type !== 'Identifier') {
          context.report({ node: model, messageId: 'anonymousModel' })
          return
        }

        if (!modelNamePattern.test(model.name))
          context.report({ node: model, messageId: 'modelName' })

        const symbol = getIdentifierSymbol(model)
        if (symbol && symbol.declarations?.every(declaration => !isModuleDeclaration(declaration)))
          context.report({ node: model, messageId: 'moduleModel' })
      },
    }
  },
})
