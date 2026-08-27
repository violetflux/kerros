import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { unwrapExpression } from '../internal/ast'

export type LiteFactoryKind = 'bindStore' | 'createStore'

const factoryNames = new Set(['bindStore', 'createStore'])
const syntaxToolsCache = new WeakMap<object, {
  getFactoryKind: (node: TSESTree.CallExpression) => LiteFactoryKind | undefined
  isStoreHookCall: (node: TSESTree.CallExpression) => boolean
}>()

/** Visit ESTree descendants without following parent links. */
function visit(node: TSESTree.Node, callback: (node: TSESTree.Node) => void) {
  callback(node)

  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'range' || key === 'loc')
      continue

    const value = node[key as keyof typeof node]
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === 'object' && 'type' in child)
          visit(child as TSESTree.Node, callback)
      }
    }
    else if (value && typeof value === 'object' && 'type' in value) {
      visit(value as TSESTree.Node, callback)
    }
  }
}

/** Read one static member name. */
function getMemberName(node: TSESTree.MemberExpression) {
  if (!node.computed && node.property.type === 'Identifier')
    return node.property.name
  if (node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string')
    return node.property.value
}

/** Build file-local Kerros identities without TypeScript parser services. */
export function createLiteSyntaxTools<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(context: Readonly<TSESLint.RuleContext<TMessageIds, TOptions>>) {
  const cached = syntaxToolsCache.get(context.sourceCode)
  if (cached)
    return cached

  const factories = new Map<string, LiteFactoryKind>()
  const namespaces = new Set<string>()
  const storeHooks = new Set<string>()

  for (const statement of context.sourceCode.ast.body) {
    if (statement.type !== 'ImportDeclaration' || statement.source.value !== '@violetflux/kerros')
      continue

    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportNamespaceSpecifier') {
        namespaces.add(specifier.local.name)
        continue
      }
      if (specifier.type !== 'ImportSpecifier')
        continue

      const imported = specifier.imported.type === 'Identifier'
        ? specifier.imported.name
        : String(specifier.imported.value)
      if (factoryNames.has(imported))
        factories.set(specifier.local.name, imported as LiteFactoryKind)
    }
  }

  /** Classify direct and namespace Kerros factory calls. */
  const getFactoryKind = (node: TSESTree.CallExpression): LiteFactoryKind | undefined => {
    const callee = unwrapExpression(node.callee)
    if (callee.type === 'Identifier')
      return factories.get(callee.name)
    if (callee.type !== 'MemberExpression' || callee.object.type !== 'Identifier'
      || !namespaces.has(callee.object.name)) {
      return undefined
    }

    const name = getMemberName(callee)
    return name && factoryNames.has(name) ? name as LiteFactoryKind : undefined
  }

  if (factories.size === 0 && namespaces.size === 0) {
    const tools = {
      getFactoryKind,
      isStoreHookCall: () => false,
    }
    syntaxToolsCache.set(context.sourceCode, tools)
    return tools
  }

  visit(context.sourceCode.ast, (node) => {
    if (node.type !== 'CallExpression' || !getFactoryKind(node))
      return

    const expression = unwrapExpression(node)
    const declarator = expression.parent
    if (declarator?.type !== 'VariableDeclarator' || declarator.init !== expression
      || declarator.id.type !== 'ArrayPattern') {
      return
    }

    const hook = declarator.id.elements[0]
    if (hook?.type === 'Identifier')
      storeHooks.add(hook.name)
  })

  /** Test whether a call targets a Store Hook created in the current file. */
  const isStoreHookCall = (node: TSESTree.CallExpression) => {
    const callee = unwrapExpression(node.callee)
    return callee.type === 'Identifier' && storeHooks.has(callee.name)
  }

  const tools = {
    getFactoryKind,
    isStoreHookCall,
  }
  syntaxToolsCache.set(context.sourceCode, tools)
  return tools
}
