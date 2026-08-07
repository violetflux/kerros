import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { getTypeServices } from './rule'

export type FactoryKind = 'bindStore' | 'createStore'
type MarkerKind = 'externalStoreProvider' | 'storeHook' | 'storeInstanceHook'
export type ModelFunction = ts.ArrowFunction | ts.FunctionDeclaration | ts.FunctionExpression

const markerNames: Record<MarkerKind, string> = {
  externalStoreProvider: 'externalStoreProviderMarker',
  storeHook: 'storeHookMarker',
  storeInstanceHook: 'storeInstanceHookMarker',
}

/** Test whether a declaration belongs to the Kerros runtime package. */
function isKerrosSourceFile(sourceFile: ts.SourceFile) {
  const filename = sourceFile.fileName.replaceAll('\\', '/')
  if (filename.includes('/node_modules/@violetflux/kerros/'))
    return true

  return filename.endsWith('/src/index.tsx')
    && sourceFile.text.includes('declare const storeHookMarker: unique symbol')
    && sourceFile.text.includes('declare const storeInstanceHookMarker: unique symbol')
    && sourceFile.text.includes('declare const externalStoreProviderMarker: unique symbol')
}

/** Create type-backed Kerros identity checks shared across one TypeScript Program. */
export function createKerrosProgramTools(program: ts.Program) {
  const checker = program.getTypeChecker()

  /** Resolve aliases until the declaration that owns the type identity. */
  const resolveSymbol = (input: ts.Symbol) => {
    let symbol = input

    while ((symbol.flags & ts.SymbolFlags.Alias) !== 0)
      symbol = checker.getAliasedSymbol(symbol)

    return symbol
  }

  /** Read and de-alias the symbol referenced by a TypeScript node. */
  const getTsSymbol = (node: ts.Node) => {
    const shorthandSymbol = ts.isIdentifier(node)
      && ts.isShorthandPropertyAssignment(node.parent)
      ? checker.getShorthandAssignmentValueSymbol(node.parent)
      : undefined
    const symbol = shorthandSymbol ?? checker.getSymbolAtLocation(node)
    return symbol ? resolveSymbol(symbol) : undefined
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

        return isKerrosSourceFile(markerDeclaration.getSourceFile())
      }) === true
    }) === true
  }

  /** Test a TypeScript type for one nominal Kerros marker. */
  const hasMarker = (type: ts.Type, marker: MarkerKind) => {
    return type.getProperties().some(property => isMarkerProperty(property, marker))
  }

  /** Read the payload carried by one nominal Kerros marker. */
  const getMarkerType = (type: ts.Type, marker: MarkerKind, location: ts.Node) => {
    const property = type.getProperties().find(candidate => isMarkerProperty(candidate, marker))
    return property ? checker.getTypeOfSymbolAtLocation(property, location) : undefined
  }

  /** Resolve an inline, named, or imported model function. */
  const getModelFunction = (input: ts.Node): ModelFunction | undefined => {
    const seen = new Set<ts.Symbol>()

    /** Follow syntax wrappers and variable aliases to a concrete function body. */
    const resolve = (node: ts.Node): ModelFunction | undefined => {
      if (ts.isArrowFunction(node) || ts.isFunctionExpression(node))
        return node
      if (ts.isFunctionDeclaration(node) && node.body)
        return node

      if (ts.isParenthesizedExpression(node)
        || ts.isAsExpression(node)
        || ts.isNonNullExpression(node)
        || ts.isSatisfiesExpression(node)) {
        return resolve(node.expression)
      }

      const symbol = getTsSymbol(node)
      if (!symbol || seen.has(symbol))
        return undefined
      seen.add(symbol)

      for (const declaration of symbol.declarations ?? []) {
        if (ts.isFunctionDeclaration(declaration) && declaration.body)
          return declaration
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          const fn = resolve(declaration.initializer)
          if (fn)
            return fn
        }
      }

      return undefined
    }

    return resolve(input)
  }

  /** Test a call against an API declaration owned by React's type package. */
  const isReactCall = (node: ts.CallExpression, name: string) => {
    const symbol = getTsSymbol(node.expression)
    if (symbol?.getName() !== name)
      return false

    return symbol.declarations?.some(declaration => {
      const filename = declaration.getSourceFile().fileName.replaceAll('\\', '/')
      return filename.includes('/node_modules/@types/react/')
    }) === true
  }

  /** Read a tuple member type from a factory return type. */
  const getTupleMemberType = (type: ts.Type, index: number, location: ts.Node) => {
    const property = checker.getPropertyOfType(type, String(index))
    return property ? checker.getTypeOfSymbolAtLocation(property, location) : undefined
  }

  /** Classify a call by the nominal markers on its resolved return tuple. */
  const getFactoryKind = (node: ts.CallExpression): FactoryKind | undefined => {
    const inputSymbol = checker.getSymbolAtLocation(node.expression)
    if (!inputSymbol)
      return undefined

    const symbol = resolveSymbol(inputSymbol)
    const name = symbol.getName()
    if ((name !== 'createStore' && name !== 'bindStore')
      || !symbol.declarations?.some(declaration => isKerrosSourceFile(declaration.getSourceFile()))) {
      return undefined
    }

    const signature = checker.getResolvedSignature(node)
    if (!signature)
      return undefined

    const returnType = checker.getReturnTypeOfSignature(signature)
    const hookType = getTupleMemberType(returnType, 0, node)
    if (!hookType || !hasMarker(hookType, 'storeHook'))
      return undefined

    const instanceType = getTupleMemberType(returnType, 2, node)
    if (name === 'createStore' && !instanceType)
      return 'createStore'

    if (name !== 'bindStore' || !instanceType)
      return undefined

    const providerType = getTupleMemberType(returnType, 1, node)
    return providerType
      && hasMarker(providerType, 'externalStoreProvider')
      && hasMarker(instanceType, 'storeInstanceHook')
      ? 'bindStore'
      : undefined
  }

  /** Test whether a call invokes a nominal Kerros Store Hook. */
  const isStoreHookCall = (node: ts.CallExpression) => {
    return hasMarker(checker.getTypeAtLocation(node.expression), 'storeHook')
  }

  /** Test whether a call invokes a nominal Kerros Store instance Hook. */
  const isStoreInstanceHookCall = (node: ts.CallExpression) => {
    return hasMarker(checker.getTypeAtLocation(node.expression), 'storeInstanceHook')
  }

  return {
    checker,
    getFactoryKind,
    getMarkerType,
    getModelFunction,
    getTsSymbol,
    hasMarker,
    isReactCall,
    isStoreInstanceHookCall,
    isStoreHookCall,
    resolveSymbol,
  }
}

/** Create ESTree adapters for the Kerros identity checks in one rule context. */
export function createKerrosTypeTools<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(context: Readonly<TSESLint.RuleContext<TMessageIds, TOptions>>) {
  const services = getTypeServices(context)
  const programTools = createKerrosProgramTools(services.program)
  const { checker, getTsSymbol, resolveSymbol } = programTools

  /** Read an ESTree node's TypeScript type. */
  const getType = (node: TSESTree.Node) => {
    const tsNode = services.esTreeNodeToTSNodeMap.get(node)
    return checker.getTypeAtLocation(tsNode)
  }

  /** Read the TypeScript node corresponding to an ESTree node. */
  const getTsNode = (node: TSESTree.Node) => {
    return services.esTreeNodeToTSNodeMap.get(node)
  }

  /** Classify an ESTree call through the shared Program identity checks. */
  const getFactoryKind = (node: TSESTree.CallExpression) => {
    const tsNode = getTsNode(node)
    return ts.isCallExpression(tsNode)
      ? programTools.getFactoryKind(tsNode)
      : undefined
  }

  /** Resolve an ESTree model reference to its TypeScript implementation. */
  const getModelFunction = (node: TSESTree.Node) => {
    return programTools.getModelFunction(getTsNode(node))
  }

  /** Test whether an ESTree call invokes a nominal Kerros Store Hook. */
  const isStoreHookCall = (node: TSESTree.CallExpression) => {
    const tsNode = getTsNode(node)
    return ts.isCallExpression(tsNode) && programTools.isStoreHookCall(tsNode)
  }

  /** Test whether an ESTree call invokes a nominal Kerros Store instance Hook. */
  const isStoreInstanceHookCall = (node: TSESTree.CallExpression) => {
    const tsNode = getTsNode(node)
    return ts.isCallExpression(tsNode) && programTools.isStoreInstanceHookCall(tsNode)
  }

  /** Resolve an identifier to its non-alias TypeScript symbol. */
  const getIdentifierSymbol = (node: TSESTree.Identifier) => {
    const tsNode = services.esTreeNodeToTSNodeMap.get(node)
    const shorthandSymbol = ts.isIdentifier(tsNode)
      && ts.isShorthandPropertyAssignment(tsNode.parent)
      ? checker.getShorthandAssignmentValueSymbol(tsNode.parent)
      : undefined
    const symbol = shorthandSymbol ?? checker.getSymbolAtLocation(tsNode)
    return symbol ? resolveSymbol(symbol) : undefined
  }

  return {
    checker,
    getFactoryKind,
    getIdentifierSymbol,
    getMarkerType: programTools.getMarkerType,
    getModelFunction,
    getTsNode,
    getTsSymbol,
    getType,
    hasMarker: programTools.hasMarker,
    isReactCall: programTools.isReactCall,
    isStoreInstanceHookCall,
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

/** Read a type's visible property across unions and generic constraints. */
export function getTypeProperty(
  checker: ts.TypeChecker,
  type: ts.Type,
  name: string,
): ts.Symbol | undefined {
  const direct = checker.getPropertyOfType(type, name)
  if (direct)
    return direct

  if (type.isUnion()) {
    for (const member of type.types) {
      const property = getTypeProperty(checker, member, name)
      if (property)
        return property
    }
  }

  const constraint = checker.getBaseConstraintOfType(type)
  return constraint && constraint !== type
    ? getTypeProperty(checker, constraint, name)
    : undefined
}
