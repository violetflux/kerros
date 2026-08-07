import type { TSESTree } from '@typescript-eslint/utils'
import { unwrapExpression } from '../internal/ast'
import { createKerrosTypeTools } from '../internal/kerros-types'
import { createRule } from '../internal/rule'
import {
  getInlineSelector,
  getMemberName,
  isMutableCollectionCall,
  visitSubtree,
} from '../internal/semantic'

const globalPureFunctions = new Set([
  'BigInt',
  'Boolean',
  'Number',
  'String',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
])
const pureStaticMethods = {
  Array: new Set(['isArray']),
  JSON: new Set(['parse', 'stringify']),
  Number: new Set(['isFinite', 'isInteger', 'isNaN', 'isSafeInteger', 'parseFloat', 'parseInt']),
  Object: new Set([
    'entries',
    'getOwnPropertyDescriptor',
    'getOwnPropertyDescriptors',
    'getOwnPropertyNames',
    'getOwnPropertySymbols',
    'getPrototypeOf',
    'hasOwn',
    'is',
    'isExtensible',
    'isFrozen',
    'isSealed',
    'keys',
    'values',
  ]),
  Promise: new Set(['all', 'allSettled', 'any', 'race', 'reject', 'resolve']),
  String: new Set(['fromCharCode', 'fromCodePoint', 'raw']),
} as const
const readonlyMethods = new Set([
  'at',
  'concat',
  'endsWith',
  'entries',
  'every',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'flat',
  'flatMap',
  'forEach',
  'get',
  'has',
  'includes',
  'indexOf',
  'join',
  'keys',
  'lastIndexOf',
  'map',
  'match',
  'matchAll',
  'reduce',
  'reduceRight',
  'replace',
  'replaceAll',
  'search',
  'slice',
  'some',
  'split',
  'startsWith',
  'substring',
  'substr',
  'toLocaleLowerCase',
  'toLocaleUpperCase',
  'toLowerCase',
  'toReversed',
  'toSorted',
  'toSpliced',
  'toString',
  'toUpperCase',
  'trim',
  'trimEnd',
  'trimStart',
  'valueOf',
  'values',
  'with',
])

export const pureSelector = createRule<[], 'impureSelector'>({
  name: 'pure-selector',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent side effects and mutable operations inside selectors.',
    },
    schema: [],
    messages: {
      impureSelector: 'Selectors must be pure.',
    },
  },
  defaultOptions: [],
  create(context) {
    const {
      checker,
      getIdentifierSymbol,
      getType,
      isStoreHookCall,
      services,
    } = createKerrosTypeTools(context)

    /** Test whether an identifier is the matching JavaScript global declaration. */
    const isGlobal = (node: TSESTree.Identifier, names: ReadonlySet<string>) => {
      if (!names.has(node.name))
        return false

      const symbol = getIdentifierSymbol(node)
      return symbol?.declarations?.some(declaration => {
        return services.program.isSourceFileDefaultLibrary(declaration.getSourceFile())
      }) === true
    }

    /** Test whether a call belongs to a small, side-effect-free built-in surface. */
    const isKnownPureCall = (node: TSESTree.CallExpression) => {
      const callee = unwrapExpression(node.callee)
      if (callee.type === 'Identifier')
        return isGlobal(callee, globalPureFunctions)
      if (callee.type !== 'MemberExpression')
        return false

      const name = getMemberName(callee)
      if (!name)
        return false

      const object = unwrapExpression(callee.object)
      if (object.type === 'Identifier' && object.name in pureStaticMethods) {
        const objectName = object.name as keyof typeof pureStaticMethods
        const methods = pureStaticMethods[objectName] as ReadonlySet<string>
        return methods.has(name) && isGlobal(object, new Set([objectName]))
      }
      if (object.type === 'Identifier' && object.name === 'Math')
        return name !== 'random' && isGlobal(object, new Set(['Math']))

      const type = checker.getBaseConstraintOfType(getType(callee.object)) ?? getType(callee.object)
      const symbolName = type.aliasSymbol?.getName() ?? type.getSymbol()?.getName()
      return readonlyMethods.has(name) && (
        checker.isArrayType(type)
        || checker.isTupleType(type)
        || symbolName === 'ReadonlyArray'
        || symbolName === 'Map'
        || symbolName === 'ReadonlyMap'
        || symbolName === 'Set'
        || symbolName === 'ReadonlySet'
        || symbolName === 'String'
      )
    }

    return {
      CallExpression(node) {
        const selector = getInlineSelector(node, isStoreHookCall)
        if (!selector)
          return

        if (selector.async || selector.generator)
          context.report({ node: selector, messageId: 'impureSelector' })

        /** Report one syntax node that executes as part of the selector call. */
        const checkNode = (child: TSESTree.Node) => {
          if (child.type === 'AssignmentExpression'
            || child.type === 'UpdateExpression'
            || child.type === 'AwaitExpression'
            || child.type === 'YieldExpression'
            || child.type === 'ThrowStatement'
            || (child.type === 'UnaryExpression' && child.operator === 'delete')) {
            context.report({ node: child, messageId: 'impureSelector' })
            return
          }

          if (child.type !== 'CallExpression')
            return

          const pure = !isMutableCollectionCall(child, checker, getType) && isKnownPureCall(child)
          if (!pure) {
            context.report({ node: child, messageId: 'impureSelector' })
            return
          }

          for (const argument of child.arguments) {
            if (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
              visitSubtree(argument.body, checkNode, true)
          }
        }

        visitSubtree(selector.body, checkNode, true)
      },
    }
  },
})
