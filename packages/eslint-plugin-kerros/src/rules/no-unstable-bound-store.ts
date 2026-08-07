import type { TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'
import { unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools, isModuleDeclaration } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import { createReferenceOriginTracker, isPrimitiveType } from '../internal/semantic'

type RenderFunction = TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression

const renderFunctionPattern = /^(?:[A-Z]|use[A-Z])/u

/** Find the nearest function that owns one JSX reference. */
function getOwner(input: TSESTree.Node): RenderFunction | undefined {
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

/** Read the declaration identifier for one local function. */
function getFunctionIdentifier(node: RenderFunction) {
  if (node.type !== 'ArrowFunctionExpression' && node.id)
    return node.id
  const parent = node.parent
  return parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier'
    ? parent.id
    : undefined
}

/** Test whether a function is a component, Hook, or anonymous default render root. */
function isRenderRoot(node: RenderFunction | undefined) {
  if (!node)
    return false
  const identifier = getFunctionIdentifier(node)
  if (identifier)
    return renderFunctionPattern.test(identifier.name)
  return node.parent?.type === 'ExportDefaultDeclaration'
}

/** Collect every identifier introduced by one binding pattern. */
function collectPatternIdentifiers(
  pattern: TSESTree.Node,
  identifiers: TSESTree.Identifier[],
) {
  if (pattern.type === 'Identifier') {
    identifiers.push(pattern)
    return
  }
  if (pattern.type === 'RestElement') {
    collectPatternIdentifiers(pattern.argument, identifiers)
    return
  }
  if (pattern.type === 'AssignmentPattern') {
    collectPatternIdentifiers(pattern.left, identifiers)
    return
  }
  if (pattern.type !== 'ObjectPattern' && pattern.type !== 'ArrayPattern')
    return

  for (const property of pattern.type === 'ObjectPattern' ? pattern.properties : pattern.elements) {
    if (!property)
      continue
    if (property.type === 'Property')
      collectPatternIdentifiers(property.value, identifiers)
    else
      collectPatternIdentifiers(property, identifiers)
  }
}

export const noUnstableBoundStore = createRule<[], 'unstableStore'>({
  name: 'no-unstable-bound-store',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require stable Store instances for bindStore Providers.',
    },
    schema: [],
    messages: {
      unstableStore: 'The Provider store prop must have stable identity.',
    },
  },
  defaultOptions: [],
  create(context) {
    const {
      checker,
      getIdentifierSymbol,
      getTsNode,
      getType,
      hasMarker,
      isReactCall,
      services,
    } = createKerrosTypeTools(context)
    const origins = createReferenceOriginTracker<TSESTree.Expression>(context.sourceCode.ast)
    const refCurrents = createReferenceOriginTracker<TSESTree.Expression>(context.sourceCode.ast)

    /** Read a parameter or binding-element default; null means a parameter without a default. */
    const getParameterDefault = (input: ts.Declaration): ts.Expression | null | undefined => {
      let node: ts.Node | undefined = input
      while (node) {
        if (ts.isBindingElement(node) && node.initializer)
          return node.initializer
        if (ts.isParameter(node))
          return node.initializer ?? null
        if (ts.isVariableDeclaration(node) || ts.isFunctionLike(node.parent))
          return undefined
        node = node.parent
      }
      return undefined
    }

    /** Test whether a destructured value is the lazy state owned by React useState. */
    const isLazyStateBinding = (declaration: ts.Declaration) => {
      if (!ts.isBindingElement(declaration)
        || !ts.isArrayBindingPattern(declaration.parent)
        || declaration.parent.elements[0] !== declaration) {
        return false
      }

      const variable = declaration.parent.parent
      if (!ts.isVariableDeclaration(variable) || !variable.initializer)
        return false
      const initializer = variable.initializer
      if (!ts.isCallExpression(initializer) || !isReactCall(initializer, 'useState'))
        return false

      const initialState = initializer.arguments[0]
      return initialState !== undefined
        && checker.getTypeAtLocation(initialState).getCallSignatures().length > 0
    }

    /** Test whether an expression is a ref object created by React useRef. */
    const isStableRef = (
      input: TSESTree.Node,
      seen = new Set<ts.Symbol>(),
    ): boolean => {
      const node = unwrapExpression(input)
      if (node.type === 'CallExpression') {
        const tsNode = getTsNode(node)
        return ts.isCallExpression(tsNode) && isReactCall(tsNode, 'useRef')
      }
      if (node.type !== 'Identifier')
        return false

      const symbol = getIdentifierSymbol(node)
      if (!symbol || seen.has(symbol))
        return false
      seen.add(symbol)
      const sources = origins.resolve(symbol, node)
      const stable = sources.length > 0
        && sources.every(source => isStableRef(source, seen))
      seen.delete(symbol)
      return stable
    }

    /** Prove a Provider value is retained outside the current render at this reference point. */
    const isStable = (
      input: TSESTree.Node,
      seen = new Set<ts.Symbol>(),
    ): boolean => {
      const node = unwrapExpression(input)
      if (isPrimitiveType(checker, getType(node)))
        return true
      if (node.type === 'ThisExpression')
        return true
      if (node.type === 'ObjectExpression'
        || node.type === 'ArrayExpression'
        || node.type === 'NewExpression'
        || node.type === 'ArrowFunctionExpression'
        || node.type === 'FunctionExpression'
        || node.type === 'ClassExpression') {
        return false
      }
      if (node.type === 'CallExpression') {
        const tsNode = getTsNode(node)
        return ts.isCallExpression(tsNode) && isReactCall(tsNode, 'useMemo')
      }
      if (node.type === 'MemberExpression') {
        const current = !node.computed
          && node.property.type === 'Identifier'
          && node.property.name === 'current'
        if (current && node.object.type === 'Identifier') {
          const symbol = getIdentifierSymbol(node.object)
          const sources = symbol ? refCurrents.resolve(symbol, node) : []
          if (sources.length > 0)
            return sources.every(source => isStable(source, seen))
          return isStableRef(node.object)
        }
        return isStable(node.object, seen)
      }
      if (node.type === 'ConditionalExpression')
        return isStable(node.consequent, seen) && isStable(node.alternate, seen)
      if (node.type === 'LogicalExpression')
        return isStable(node.left, seen) && isStable(node.right, seen)
      if (node.type === 'SequenceExpression') {
        const value = node.expressions.at(-1)
        return value ? isStable(value, seen) : true
      }
      if (node.type !== 'Identifier')
        return false

      const symbol = getIdentifierSymbol(node)
      if (!symbol || seen.has(symbol))
        return false
      if (symbol.declarations?.some(isModuleDeclaration))
        return true
      if (symbol.declarations?.some(isLazyStateBinding))
        return true

      seen.add(symbol)
      const sources = origins.resolve(symbol, node)
      if (sources.length > 0) {
        const stable = sources.every(source => isStable(source, seen))
        seen.delete(symbol)
        return stable
      }

      let stable = false
      for (const declaration of symbol.declarations ?? []) {
        const defaultValue = getParameterDefault(declaration)
        if (defaultValue !== undefined) {
          const expression = defaultValue
            ? services.tsNodeToESTreeNodeMap.get(defaultValue)
            : undefined
          stable = expression ? isStable(expression, seen) : true
          break
        }
      }

      seen.delete(symbol)
      return stable
    }

    return {
      VariableDeclarator(node) {
        if (!node.init)
          return
        const identifiers: TSESTree.Identifier[] = []
        collectPatternIdentifiers(node.id, identifiers)
        for (const identifier of identifiers) {
          const symbol = getIdentifierSymbol(identifier)
          if (symbol)
            origins.record(symbol, node.init, node)
        }
      },
      AssignmentExpression(node) {
        if (node.left.type === 'Identifier') {
          const symbol = getIdentifierSymbol(node.left)
          if (symbol)
            origins.record(symbol, node.right, node)
          return
        }
        if (node.left.type !== 'MemberExpression'
          || node.left.object.type !== 'Identifier'
          || node.left.computed
          || node.left.property.type !== 'Identifier'
          || node.left.property.name !== 'current') {
          return
        }

        const symbol = getIdentifierSymbol(node.left.object)
        if (symbol)
          refCurrents.record(symbol, node.right, node)
      },
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'store')
          return
        const opening = node.parent
        if (opening?.type !== 'JSXOpeningElement'
          || !hasMarker(getType(opening.name), 'externalStoreProvider')) {
          return
        }
        if (!isRenderRoot(getOwner(node)))
          return
        if (node.value?.type !== 'JSXExpressionContainer'
          || node.value.expression.type === 'JSXEmptyExpression') {
          return
        }

        if (!isStable(node.value.expression))
          context.report({ node: node.value.expression, messageId: 'unstableStore' })
      },
    }
  },
})
