import type { TSESTree } from '@typescript-eslint/utils'
import { unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'

type MessageId = 'destructureBinding' | 'getterName' | 'hookName' | 'instanceName' | 'providerName'

/** Extract the model-derived Store name used by createStore bindings. */
function getCreateStoreName(call: TSESTree.CallExpression) {
  const model = call.arguments[0]
  if (!model || model.type !== 'Identifier')
    return undefined

  const match = /^use(?<name>[A-Z][A-Za-z0-9]*)Model$/u.exec(model.name)
  return match?.groups?.name
}

/** Extract the explicit display name used by bindStore bindings. */
function getBindStoreName(call: TSESTree.CallExpression) {
  const input = call.arguments[0]
  return input?.type === 'Literal' && typeof input.value === 'string'
    ? input.value
    : undefined
}

/** Read one identifier from a binding tuple, leaving holes untouched. */
function getElement(pattern: TSESTree.ArrayPattern, index: number) {
  const element = pattern.elements[index]
  return element?.type === 'Identifier' ? element : undefined
}

export const bindingNaming = createRule<[], MessageId>({
  name: 'binding-naming',
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep Kerros Hook, Provider, and getter binding names aligned.',
    },
    schema: [],
    messages: {
      destructureBinding: 'Kerros factory results must be destructured.',
      getterName: 'The Store getter must be named getXxx.',
      hookName: 'The Store Hook must be named useXxx.',
      providerName: 'The Provider name must match the Store Hook.',
      instanceName: 'The instance Hook name must match the Store Hook.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { getFactoryKind } = createKerrosTypeTools(context)

    return {
      CallExpression(node) {
        const kind = getFactoryKind(node)
        if (!kind)
          return

        const expression = unwrapExpression(node)
        const declarator = expression.parent
        if (declarator?.type !== 'VariableDeclarator' || declarator.init !== expression) {
          context.report({ node, messageId: 'destructureBinding' })
          return
        }

        if (declarator.id.type !== 'ArrayPattern') {
          context.report({ node: declarator.id, messageId: 'destructureBinding' })
          return
        }

        const hook = getElement(declarator.id, 0)
        const provider = getElement(declarator.id, 1)
        const third = getElement(declarator.id, 2)
        const explicitName = kind === 'createStore'
          ? getCreateStoreName(node)
          : getBindStoreName(node)
        const hookMatch = hook && /^use(?<name>[A-Z][A-Za-z0-9]*)$/u.exec(hook.name)
        const providerMatch = provider && /^(?<name>[A-Z][A-Za-z0-9]*)Provider$/u.exec(provider.name)
        const thirdMatch = third && (kind === 'createStore'
          ? /^get(?<name>[A-Z][A-Za-z0-9]*)$/u.exec(third.name)
          : /^use(?<name>[A-Z][A-Za-z0-9]*)Instance$/u.exec(third.name))
        const inferredName = hookMatch?.groups?.name
          ?? providerMatch?.groups?.name
          ?? thirdMatch?.groups?.name
        const name = explicitName ?? inferredName

        if (hook && (!hookMatch || (name && hookMatch.groups?.name !== name)))
          context.report({ node: hook, messageId: 'hookName' })

        if (provider && (!providerMatch || (name && providerMatch.groups?.name !== name)))
          context.report({ node: provider, messageId: 'providerName' })

        if (third && (!thirdMatch || (name && thirdMatch.groups?.name !== name))) {
          context.report({
            node: third,
            messageId: kind === 'createStore' ? 'getterName' : 'instanceName',
          })
        }
      },
    }
  },
})
