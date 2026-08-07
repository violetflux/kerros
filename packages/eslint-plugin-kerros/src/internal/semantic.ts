import type { TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { unwrapExpression } from './ast'

export type SelectorFunction = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression

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

/** Test whether a type is a mutable Array, Map, or Set family. */
function getMutableCollectionKind(
  checker: ts.TypeChecker,
  inputType: ts.Type,
): 'array' | 'map' | 'set' | undefined {
  const type = checker.getBaseConstraintOfType(inputType) ?? inputType
  if (type.isUnion()) {
    for (const member of type.types) {
      const kind = getMutableCollectionKind(checker, member)
      if (kind)
        return kind
    }
    return undefined
  }

  if (checker.isArrayType(type) || checker.isTupleType(type))
    return 'array'

  const name = type.aliasSymbol?.getName() ?? type.getSymbol()?.getName()
  if (name === 'Map')
    return 'map'
  if (name === 'Set')
    return 'set'

  return undefined
}

/** Test whether a call invokes a known mutable collection method. */
export function isMutableCollectionCall(
  node: TSESTree.CallExpression,
  checker: ts.TypeChecker,
  getType: (node: TSESTree.Node) => ts.Type,
) {
  const callee = unwrapExpression(node.callee)
  if (callee.type !== 'MemberExpression')
    return false

  const name = getMemberName(callee)
  if (!name)
    return false

  const kind = getMutableCollectionKind(checker, getType(callee.object))
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
    return type.types.every(member => isPrimitiveType(checker, member))

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
