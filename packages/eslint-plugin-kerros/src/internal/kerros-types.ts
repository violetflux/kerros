import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { getTypeServices } from './rule'

type FactoryKind = 'bindStore' | 'createStore'
type MarkerKind = 'externalStoreProvider' | 'storeHook' | 'storeInstanceHook'

const markerNames: Record<MarkerKind, string> = {
  externalStoreProvider: 'externalStoreProviderMarker',
  storeHook: 'storeHookMarker',
  storeInstanceHook: 'storeInstanceHookMarker',
}

/** Create type-backed Kerros identity checks for one rule context. */
export function createKerrosTypeTools<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(context: Readonly<TSESLint.RuleContext<TMessageIds, TOptions>>) {
  const services = getTypeServices(context)
  const checker = services.program.getTypeChecker()

  /** Resolve aliases until the declaration that owns the type identity. */
  const resolveSymbol = (input: ts.Symbol) => {
    let symbol = input

    while ((symbol.flags & ts.SymbolFlags.Alias) !== 0)
      symbol = checker.getAliasedSymbol(symbol)

    return symbol
  }

  /** Verify that a computed property comes from Kerros' private unique symbol. */
  const isMarkerProperty = (property: ts.Symbol, marker: MarkerKind) => {
    return property.declarations?.some(declaration => {
      if (!ts.isPropertySignature(declaration) || !ts.isComputedPropertyName(declaration.name))
        return false

      const inputSymbol = checker.getSymbolAtLocation(declaration.name.expression)
      if (!inputSymbol)
        return false

      const symbol = resolveSymbol(inputSymbol)
      if (symbol.getName() !== markerNames[marker])
        return false

      return symbol.declarations?.some(markerDeclaration => {
        if (!ts.isVariableDeclaration(markerDeclaration))
          return false

        const sourceFile = markerDeclaration.getSourceFile()
        const filename = sourceFile.fileName.replaceAll('\\', '/')
        const isPublishedKerros = filename.includes('/node_modules/@violetflux/kerros/')
        const isKerrosSource = filename.endsWith('/src/index.tsx')
          && sourceFile.text.includes('declare const storeHookMarker: unique symbol')
          && sourceFile.text.includes('declare const storeInstanceHookMarker: unique symbol')
          && sourceFile.text.includes('declare const externalStoreProviderMarker: unique symbol')

        return isPublishedKerros || isKerrosSource
      }) === true
    }) === true
  }

  /** Test a TypeScript type for one nominal Kerros marker. */
  const hasMarker = (type: ts.Type, marker: MarkerKind) => {
    return type.getProperties().some(property => isMarkerProperty(property, marker))
  }

  /** Read an ESTree node's TypeScript type. */
  const getType = (node: TSESTree.Node) => {
    const tsNode = services.esTreeNodeToTSNodeMap.get(node)
    return checker.getTypeAtLocation(tsNode)
  }

  /** Read a tuple member type from a factory return type. */
  const getTupleMemberType = (type: ts.Type, index: number, location: ts.Node) => {
    const property = checker.getPropertyOfType(type, String(index))
    return property ? checker.getTypeOfSymbolAtLocation(property, location) : undefined
  }

  /** Classify a call by the nominal markers on its resolved return tuple. */
  const getFactoryKind = (node: TSESTree.CallExpression): FactoryKind | undefined => {
    const tsNode = services.esTreeNodeToTSNodeMap.get(node)
    if (!ts.isCallExpression(tsNode))
      return undefined

    const signature = checker.getResolvedSignature(tsNode)
    if (!signature)
      return undefined

    const returnType = checker.getReturnTypeOfSignature(signature)
    const hookType = getTupleMemberType(returnType, 0, tsNode)
    if (!hookType || !hasMarker(hookType, 'storeHook'))
      return undefined

    const instanceType = getTupleMemberType(returnType, 2, tsNode)
    if (!instanceType)
      return 'createStore'

    const providerType = getTupleMemberType(returnType, 1, tsNode)
    return providerType
      && hasMarker(providerType, 'externalStoreProvider')
      && hasMarker(instanceType, 'storeInstanceHook')
      ? 'bindStore'
      : undefined
  }

  /** Test whether a call invokes a nominal Kerros Store Hook. */
  const isStoreHookCall = (node: TSESTree.CallExpression) => {
    return hasMarker(getType(node.callee), 'storeHook')
  }

  /** Resolve an identifier to its non-alias TypeScript symbol. */
  const getIdentifierSymbol = (node: TSESTree.Identifier) => {
    const tsNode = services.esTreeNodeToTSNodeMap.get(node)
    const symbol = checker.getSymbolAtLocation(tsNode)
    return symbol ? resolveSymbol(symbol) : undefined
  }

  return {
    checker,
    getFactoryKind,
    getIdentifierSymbol,
    getType,
    hasMarker,
    isStoreHookCall,
    services,
  }
}

/** Test whether a declaration is owned directly by a source file. */
export function isModuleDeclaration(declaration: ts.Declaration) {
  let current: ts.Node = declaration

  while (current.parent && !ts.isSourceFile(current.parent)) {
    if (ts.isFunctionLike(current.parent) || ts.isBlock(current.parent))
      return false

    current = current.parent
  }

  return ts.isSourceFile(current.parent)
}

/** Read a generic parameter's visible property, including its constraint. */
export function getTypeProperty(checker: ts.TypeChecker, type: ts.Type, name: string) {
  const direct = checker.getPropertyOfType(type, name)
  if (direct)
    return direct

  const constraint = checker.getBaseConstraintOfType(type)
  return constraint ? checker.getPropertyOfType(constraint, name) : undefined
}
