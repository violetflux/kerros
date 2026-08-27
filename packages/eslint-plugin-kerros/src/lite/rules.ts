import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { getReturnedExpressions, unwrapExpression } from '../internal/ast'
import { createRule } from '../internal/rule'
import { createLiteSyntaxTools } from './syntax'

const nestedScopeTypes = new Set([
  'ArrowFunctionExpression',
  'BlockStatement',
  'CatchClause',
  'ConditionalExpression',
  'DoWhileStatement',
  'ForInStatement',
  'ForOfStatement',
  'ForStatement',
  'FunctionDeclaration',
  'FunctionExpression',
  'IfStatement',
  'LogicalExpression',
  'PropertyDefinition',
  'StaticBlock',
  'SwitchCase',
  'SwitchStatement',
  'TryStatement',
  'WhileStatement',
])
const objectEnumerationMethods = new Set(['entries', 'keys', 'values'])
const modelNamePattern = /^use[A-Z][A-Za-z0-9]*Model$/u

/** Test whether a factory call executes unconditionally at module scope. */
function isModuleScopeCall(node: TSESTree.CallExpression) {
  let current: TSESTree.Node | undefined = node.parent
  while (current && current.type !== 'Program') {
    if (nestedScopeTypes.has(current.type))
      return false
    current = current.parent
  }
  return current?.type === 'Program'
}

/** Read one identifier from a factory tuple. */
function getElement(pattern: TSESTree.ArrayPattern, index: number) {
  const element = pattern.elements[index]
  return element?.type === 'Identifier' ? element : undefined
}

/** Extract the Store name carried by a createStore model. */
function getCreateStoreName(call: TSESTree.CallExpression) {
  const model = call.arguments[0]
  if (!model || model.type !== 'Identifier')
    return undefined
  return /^use(?<name>[A-Z][A-Za-z0-9]*)Model$/u.exec(model.name)?.groups?.name
}

/** Extract the explicit bindStore display name. */
function getBindStoreName(call: TSESTree.CallExpression) {
  const input = call.arguments[0]
  return input?.type === 'Literal' && typeof input.value === 'string' ? input.value : undefined
}

/** Resolve whether one identifier is declared in module scope. */
function isModuleBinding(
  context: Readonly<TSESLint.RuleContext<string, readonly unknown[]>>,
  node: TSESTree.Identifier,
) {
  let scope: TSESLint.Scope.Scope | null = context.sourceCode.getScope(node)
  while (scope) {
    const variable = scope.set.get(node.name)
    if (variable)
      return variable.scope.type === 'module'
    scope = scope.upper
  }
  return true
}

export const liteFactoryAtModuleScope = createRule<[], 'moduleScope'>({
  name: 'factory-at-module-scope',
  meta: {
    type: 'problem',
    docs: { description: 'Require directly imported Kerros factories to run once at module scope.' },
    schema: [],
    messages: { moduleScope: 'Kerros factories must be called at module scope.' },
  },
  defaultOptions: [],
  create(context) {
    const { getFactoryKind } = createLiteSyntaxTools(context)
    return {
      CallExpression(node) {
        if (getFactoryKind(node) && !isModuleScopeCall(node))
          context.report({ node, messageId: 'moduleScope' })
      },
    }
  },
})

export const liteModelConvention = createRule<[], 'anonymousModel' | 'modelName' | 'moduleModel'>({
  name: 'model-convention',
  meta: {
    type: 'problem',
    docs: { description: 'Require direct createStore models to be named module-level Hooks.' },
    schema: [],
    messages: {
      anonymousModel: 'createStore requires a named model Hook.',
      modelName: 'The model Hook must be named useXxxModel.',
      moduleModel: 'The model Hook must be declared at module scope.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { getFactoryKind } = createLiteSyntaxTools(context)
    return {
      CallExpression(node) {
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
        if (!isModuleBinding(context as never, model))
          context.report({ node: model, messageId: 'moduleModel' })
      },
    }
  },
})

export const liteBindingNaming = createRule<[], 'destructureBinding' | 'getterName' | 'hookName' | 'instanceName' | 'providerName'>({
  name: 'binding-naming',
  meta: {
    type: 'problem',
    docs: { description: 'Keep direct Kerros factory binding names aligned.' },
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
    const { getFactoryKind } = createLiteSyntaxTools(context)
    return {
      CallExpression(node) {
        const kind = getFactoryKind(node)
        if (!kind)
          return
        const expression = unwrapExpression(node)
        const declarator = expression.parent
        if (declarator?.type !== 'VariableDeclarator' || declarator.init !== expression
          || declarator.id.type !== 'ArrayPattern') {
          context.report({ node, messageId: 'destructureBinding' })
          return
        }

        const hook = getElement(declarator.id, 0)
        const provider = getElement(declarator.id, 1)
        const third = getElement(declarator.id, 2)
        const explicitName = kind === 'createStore' ? getCreateStoreName(node) : getBindStoreName(node)
        const hookMatch = hook && /^use(?<name>[A-Z][A-Za-z0-9]*)$/u.exec(hook.name)
        const providerMatch = provider && /^(?<name>[A-Z][A-Za-z0-9]*)Provider$/u.exec(provider.name)
        const thirdMatch = third && (kind === 'createStore'
          ? /^get(?<name>[A-Z][A-Za-z0-9]*)$/u.exec(third.name)
          : /^use(?<name>[A-Z][A-Za-z0-9]*)Instance$/u.exec(third.name))
        const name = explicitName ?? hookMatch?.groups?.name
          ?? providerMatch?.groups?.name ?? thirdMatch?.groups?.name

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

export const liteSelectorParameterName = createRule<[], 'parameterName'>({
  name: 'selector-parameter-name',
  meta: {
    type: 'suggestion',
    docs: { description: 'Use s for selectors on file-local Kerros Store Hooks.' },
    schema: [],
    messages: { parameterName: 'Name the Store selector parameter s.' },
  },
  defaultOptions: [],
  create(context) {
    const { isStoreHookCall } = createLiteSyntaxTools(context)
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

/** Collect direct local aliases of the selector parameter. */
function getAliases(selector: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression, parameter: string) {
  const aliases = new Set([parameter])
  if (selector.body.type !== 'BlockStatement')
    return aliases

  let changed = true
  while (changed) {
    changed = false
    for (const statement of selector.body.body) {
      if (statement.type !== 'VariableDeclaration')
        continue
      for (const declaration of statement.declarations) {
        if (declaration.id.type !== 'Identifier' || !declaration.init)
          continue
        const value = unwrapExpression(declaration.init)
        if (value.type === 'Identifier' && aliases.has(value.name) && !aliases.has(declaration.id.name)) {
          aliases.add(declaration.id.name)
          changed = true
        }
      }
    }
  }
  return aliases
}

/** Test whether an expression returns or embeds a complete selector parameter. */
function containsWholeStore(node: TSESTree.Node, aliases: ReadonlySet<string>): boolean {
  const expression = unwrapExpression(node)
  if (expression.type === 'Identifier')
    return aliases.has(expression.name)
  if (expression.type === 'ObjectExpression') {
    return expression.properties.some(property => property.type === 'SpreadElement'
      ? containsWholeStore(property.argument, aliases)
      : containsWholeStore(property.value, aliases))
  }
  if (expression.type === 'ArrayExpression') {
    return expression.elements.some(element => element?.type === 'SpreadElement'
      ? containsWholeStore(element.argument, aliases)
      : element ? containsWholeStore(element, aliases) : false)
  }
  if (expression.type === 'ConditionalExpression')
    return containsWholeStore(expression.consequent, aliases) || containsWholeStore(expression.alternate, aliases)
  if (expression.type === 'LogicalExpression')
    return containsWholeStore(expression.left, aliases) || containsWholeStore(expression.right, aliases)
  if (expression.type === 'SequenceExpression') {
    const result = expression.expressions.at(-1)
    return result ? containsWholeStore(result, aliases) : false
  }
  if (expression.type === 'AssignmentExpression')
    return containsWholeStore(expression.right, aliases)
  return false
}

export const liteNoWholeStoreSelector = createRule<[], 'wholeStore'>({
  name: 'no-whole-store-selector',
  meta: {
    type: 'problem',
    docs: { description: 'Prevent file-local Store selectors from returning the complete Store.' },
    schema: [],
    messages: { wholeStore: 'A selector cannot return or wrap the complete Store.' },
  },
  defaultOptions: [],
  create(context) {
    const { isStoreHookCall } = createLiteSyntaxTools(context)
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
        if (!parameter || parameter.type !== 'Identifier')
          return
        const aliases = getAliases(selector, parameter.name)
        if (getReturnedExpressions(selector).some(expression => containsWholeStore(expression, aliases)))
          context.report({ node: selector, messageId: 'wholeStore' })
      },
    }
  },
})

/** Read the argument of a broad object operation. */
function getBroadArgument(node: TSESTree.CallExpression) {
  const [argument] = node.arguments
  if (!argument || argument.type === 'SpreadElement')
    return
  const callee = node.callee
  if (callee.type !== 'MemberExpression' || callee.computed
    || callee.object.type !== 'Identifier' || callee.property.type !== 'Identifier') {
    return
  }
  if (callee.object.name === 'Object' && objectEnumerationMethods.has(callee.property.name))
    return argument
  if (callee.object.name === 'JSON' && callee.property.name === 'stringify')
    return argument
}

export const liteNoBroadStoreAccess = createRule<[], 'broadAccess'>({
  name: 'no-broad-store-access',
  meta: {
    type: 'problem',
    docs: { description: 'Prevent broad access to file-local selector-free Store snapshots.' },
    schema: [],
    messages: { broadAccess: 'Do not enumerate, serialize, or spread a complete selector-free Store snapshot.' },
  },
  defaultOptions: [],
  create(context) {
    const { isStoreHookCall } = createLiteSyntaxTools(context)
    const snapshots = new Set<string>()
    const isSnapshot = (node: TSESTree.Node) => {
      const expression = unwrapExpression(node)
      if (expression.type === 'Identifier')
        return snapshots.has(expression.name)
      return expression.type === 'CallExpression'
        && expression.arguments.length === 0
        && isStoreHookCall(expression)
    }
    const report = (node: TSESTree.Expression) => {
      if (isSnapshot(node))
        context.report({ node, messageId: 'broadAccess' })
    }

    return {
      VariableDeclarator(node) {
        if (!node.init)
          return
        if (node.id.type === 'Identifier' && isSnapshot(node.init))
          snapshots.add(node.id.name)
        if (node.id.type === 'ObjectPattern'
          && node.id.properties.some(property => property.type === 'RestElement')) {
          report(node.init)
        }
      },
      AssignmentExpression(node) {
        if (node.left.type === 'Identifier' && isSnapshot(node.right))
          snapshots.add(node.left.name)
      },
      CallExpression(node) {
        const argument = getBroadArgument(node)
        if (argument)
          report(argument)
      },
      SpreadElement(node) {
        report(node.argument)
      },
    }
  },
})

export const liteRules: NonNullable<TSESLint.FlatConfig.Plugin['rules']> = {
  'binding-naming': liteBindingNaming,
  'factory-at-module-scope': liteFactoryAtModuleScope,
  'model-convention': liteModelConvention,
  'no-broad-store-access': liteNoBroadStoreAccess,
  'no-whole-store-selector': liteNoWholeStoreSelector,
  'selector-parameter-name': liteSelectorParameterName,
}
