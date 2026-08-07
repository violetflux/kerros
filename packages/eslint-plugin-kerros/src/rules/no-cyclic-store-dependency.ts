import ts from 'typescript'
import { createRule, getTypeServices } from '../internal/rule'
import { getCyclicStoreDependencies } from '../internal/store-dependency-graph'

export const noCyclicStoreDependency = createRule<[], 'cyclicDependency'>({
  name: 'no-cyclic-store-dependency',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent createStore models from forming Store dependency cycles.',
    },
    schema: [],
    messages: {
      cyclicDependency: 'Store "{{source}}" depends on "{{target}}" in a dependency cycle.',
    },
  },
  defaultOptions: [],
  create(context) {
    const services = getTypeServices(context)
    const program = services.program
    const sourceFile = services.esTreeNodeToTSNodeMap.get(context.sourceCode.ast)

    return {
      'Program:exit'() {
        if (!ts.isSourceFile(sourceFile))
          return

        for (const dependency of getCyclicStoreDependencies(program, sourceFile)) {
          const node = services.tsNodeToESTreeNodeMap.get(dependency.site)
          if (!node)
            continue

          context.report({
            node,
            messageId: 'cyclicDependency',
            data: {
              source: dependency.source,
              target: dependency.target,
            },
          })
        }
      },
    }
  },
})
