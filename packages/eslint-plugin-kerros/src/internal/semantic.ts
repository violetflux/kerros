import type { TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { unwrapExpression } from './ast'

export type SelectorFunction = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression

type FunctionNode = TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression

interface OriginEvent<T> {
  owner?: FunctionNode
  source: T
  write: TSESTree.Node
}

const arrayMutationMethods = new Set([
  'copyWithin',
  'fill',
  'pop',
  'push',
  'reverse',
  'shift',
  'sort',
  'splice',
  'unshift',
])
const mapMutationMethods = new Set(['clear', 'delete', 'set'])
const setMutationMethods = new Set(['add', 'clear', 'delete'])

/** Track assignment sources and resolve definitions that reach a concrete reference point. */
export function createReferenceOriginTracker<T>(program: TSESTree.Program) {
  const events = new Map<ts.Symbol, Array<OriginEvent<T>>>()

  /** Find the function execution scope containing one syntax node. */
  const getOwner = (input: TSESTree.Node) => {
    let node = input.parent
    while (node) {
      if (node.type === 'ArrowFunctionExpression'
        || node.type === 'FunctionDeclaration'
        || node.type === 'FunctionExpression') {
        return node
      }
      node = node.parent
    }
    return undefined
  }

  /** Test whether one syntax range contains another. */
  const contains = (container: TSESTree.Node, target: TSESTree.Node) => {
    return container.range[0] <= target.range[0] && container.range[1] >= target.range[1]
  }

  /** Merge branch states without duplicating the same reaching write. */
  const merge = (left: Array<OriginEvent<T>>, right: Array<OriginEvent<T>>) => {
    return [...new Set([...left, ...right])]
  }

  /** Test whether a simple statement cannot continue into its following sibling. */
  const terminates = (node: TSESTree.Node): boolean => {
    if (node.type === 'ReturnStatement' || node.type === 'ThrowStatement')
      return true
    if (node.type === 'BlockStatement') {
      const last = node.body.at(-1)
      return last ? terminates(last) : false
    }
    if (node.type === 'IfStatement' && node.alternate)
      return terminates(node.consequent) && terminates(node.alternate)
    if (node.type === 'LabeledStatement')
      return terminates(node.body)
    return false
  }

  /** Record one initializer or assignment after its right-hand side is evaluated. */
  const record = (symbol: ts.Symbol, source: T, write: TSESTree.Node) => {
    const existing = events.get(symbol) ?? []
    existing.push({ owner: getOwner(write), source, write })
    events.set(symbol, existing)
  }

  /** Resolve the possible definitions reaching one symbol reference. */
  const resolve = (symbol: ts.Symbol, reference: TSESTree.Node) => {
    const symbolEvents = events.get(symbol) ?? []
    const functions: FunctionNode[] = []
    let parent = reference.parent
    while (parent) {
      if (parent.type === 'ArrowFunctionExpression'
        || parent.type === 'FunctionDeclaration'
        || parent.type === 'FunctionExpression') {
        functions.push(parent)
      }
      parent = parent.parent
    }
    functions.reverse()

    /** Apply straight-line writes in runtime order up to an optional point. */
    const applyEvents = (
      container: TSESTree.Node,
      owner: FunctionNode | undefined,
      state: Array<OriginEvent<T>>,
      limit = container.range[1],
    ) => {
      const applicable = symbolEvents
        .filter((event) => {
          return event.owner === owner
            && contains(container, event.write)
            && event.write.range[1] <= limit
        })
        .sort((left, right) => {
          return left.write.range[1] - right.write.range[1]
            || right.write.range[0] - left.write.range[0]
        })

      for (const event of applicable)
        state = [event]
      return state
    }

    /** Evaluate one statement completely, merging simple conditional branches. */
    const flowFull = (
      node: TSESTree.Node,
      owner: FunctionNode | undefined,
      state: Array<OriginEvent<T>>,
    ): Array<OriginEvent<T>> => {
      if (node.type === 'BlockStatement')
        return flowSequence(node.body, owner, state)
      if (node.type !== 'IfStatement')
        return applyEvents(node, owner, state)

      const tested = applyEvents(node.test, owner, state)
      const consequent = flowFull(node.consequent, owner, tested)
      const alternate = node.alternate ? flowFull(node.alternate, owner, tested) : tested
      const consequentContinues = !terminates(node.consequent)
      const alternateContinues = !node.alternate || !terminates(node.alternate)
      if (!consequentContinues)
        return alternateContinues ? alternate : []
      if (!alternateContinues)
        return consequent
      return merge(consequent, alternate)
    }

    /** Evaluate one statement only until the requested reference point. */
    const flowUntil = (
      node: TSESTree.Node,
      owner: FunctionNode | undefined,
      state: Array<OriginEvent<T>>,
      target: TSESTree.Node,
    ): Array<OriginEvent<T>> => {
      if (node.type === 'BlockStatement')
        return flowSequence(node.body, owner, state, target)
      if (node.type !== 'IfStatement')
        return applyEvents(node, owner, state, target.range[0])
      if (contains(node.test, target))
        return applyEvents(node.test, owner, state, target.range[0])

      const tested = applyEvents(node.test, owner, state)
      if (contains(node.consequent, target))
        return flowUntil(node.consequent, owner, tested, target)
      if (node.alternate && contains(node.alternate, target))
        return flowUntil(node.alternate, owner, tested, target)
      return tested
    }

    /** Evaluate a lexical statement sequence, stopping before one nested target. */
    function flowSequence(
      nodes: TSESTree.Node[],
      owner: FunctionNode | undefined,
      input: Array<OriginEvent<T>>,
      target?: TSESTree.Node,
    ) {
      let state = input
      for (const node of nodes) {
        if (target && contains(node, target))
          return flowUntil(node, owner, state, target)
        if (target && node.range[0] >= target.range[0])
          return state
        state = flowFull(node, owner, state)
      }
      return state
    }

    /** Evaluate one program or function scope up to a nested function/reference. */
    const flowScope = (
      root: TSESTree.Program | FunctionNode,
      target: TSESTree.Node,
      state: Array<OriginEvent<T>>,
    ) => {
      const owner = root.type === 'Program' ? undefined : root
      if (root.type === 'Program')
        return flowSequence(root.body, owner, state, target)
      return root.body.type === 'BlockStatement'
        ? flowSequence(root.body.body, owner, state, target)
        : flowUntil(root.body, owner, state, target)
    }

    let state: Array<OriginEvent<T>> = []
    let root: TSESTree.Program | FunctionNode = program
    for (const fn of functions) {
      state = flowScope(root, fn, state)
      root = fn
    }
    state = flowScope(root, reference, state)
    return state.map(event => event.source)
  }

  return { record, resolve }
}

/** Return an inline selector from a nominal Store Hook call. */
export function getInlineSelector(
  node: TSESTree.CallExpression,
  isStoreHookCall: (call: TSESTree.CallExpression) => boolean,
): SelectorFunction | undefined {
  if (!isStoreHookCall(node))
    return undefined

  const selector = node.arguments[0]
  return selector?.type === 'ArrowFunctionExpression' || selector?.type === 'FunctionExpression'
    ? selector
    : undefined
}

/** Visit a syntax subtree while ignoring parser metadata and optional nested functions. */
export function visitSubtree(
  root: TSESTree.Node,
  visitor: (node: TSESTree.Node) => void,
  skipNestedFunctions = false,
) {
  const visit = (node: TSESTree.Node) => {
    if (node !== root && skipNestedFunctions && (
      node.type === 'ArrowFunctionExpression'
      || node.type === 'FunctionExpression'
      || node.type === 'FunctionDeclaration'
    )) {
      return
    }

    visitor(node)

    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'range' || key === 'loc')
        continue

      const value = node[key as keyof typeof node]
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === 'object' && 'type' in child)
            visit(child as TSESTree.Node)
        }
      }
      else if (value && typeof value === 'object' && 'type' in value) {
        visit(value as TSESTree.Node)
      }
    }
  }

  visit(root)
}

/** Return the statically known property name for member access. */
export function getMemberName(node: TSESTree.MemberExpression) {
  if (!node.computed && node.property.type === 'Identifier')
    return node.property.name

  if (node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string')
    return node.property.value

  return undefined
}

export type BuiltinTypeKind = 'array' | 'map' | 'set' | 'string'

/** Classify runtime built-ins by TypeScript's default-library declarations. */
export function getBuiltinTypeKind(
  checker: ts.TypeChecker,
  program: ts.Program,
  inputType: ts.Type,
): BuiltinTypeKind | undefined {
  const type = checker.getBaseConstraintOfType(inputType) ?? inputType
  if (type.isUnion() || type.isIntersection()) {
    for (const member of type.types) {
      const kind = getBuiltinTypeKind(checker, program, member)
      if (kind)
        return kind
    }
    return undefined
  }

  if (checker.isArrayType(type) || checker.isTupleType(type))
    return 'array'
  if ((type.flags & ts.TypeFlags.StringLike) !== 0)
    return 'string'

  for (const symbol of [type.getSymbol(), type.aliasSymbol]) {
    const name = symbol?.getName()
    const isBuiltin = symbol?.declarations?.some(declaration => {
      return program.isSourceFileDefaultLibrary(declaration.getSourceFile())
    }) === true
    if (!isBuiltin)
      continue
    if (name === 'Map' || name === 'ReadonlyMap')
      return 'map'
    if (name === 'Set' || name === 'ReadonlySet')
      return 'set'
    if (name === 'String')
      return 'string'
  }

  return undefined
}

/** Test whether a call invokes a known mutable collection method. */
export function isMutableCollectionCall(
  node: TSESTree.CallExpression,
  checker: ts.TypeChecker,
  program: ts.Program,
  getType: (node: TSESTree.Node) => ts.Type,
) {
  const callee = unwrapExpression(node.callee)
  if (callee.type !== 'MemberExpression')
    return false

  const name = getMemberName(callee)
  if (!name)
    return false

  const kind = getBuiltinTypeKind(checker, program, getType(callee.object))
  if (kind === 'array')
    return arrayMutationMethods.has(name)
  if (kind === 'map')
    return mapMutationMethods.has(name)
  if (kind === 'set')
    return setMutationMethods.has(name)

  return false
}

/** Test whether TypeScript proves a value is primitive across unions and constraints. */
export function isPrimitiveType(checker: ts.TypeChecker, inputType: ts.Type): boolean {
  const type = checker.getBaseConstraintOfType(inputType) ?? inputType
  if (type.isUnion())
    return type.types.every(member => isPrimitiveType(checker, member))
  if (type.isIntersection())
    return type.types.some(member => isPrimitiveType(checker, member))

  const primitiveFlags = ts.TypeFlags.StringLike
    | ts.TypeFlags.NumberLike
    | ts.TypeFlags.BigIntLike
    | ts.TypeFlags.BooleanLike
    | ts.TypeFlags.ESSymbolLike
    | ts.TypeFlags.Null
    | ts.TypeFlags.Undefined
    | ts.TypeFlags.Void
    | ts.TypeFlags.Never

  return (type.flags & primitiveFlags) !== 0
}
