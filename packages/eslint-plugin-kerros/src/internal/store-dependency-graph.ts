import ts from 'typescript'
import type { FactoryKind, ModelFunction } from './kerros-types'
import { createKerrosProgramTools } from './kerros-types'

interface StoreNode {
  call: ts.CallExpression
  hook: ts.Symbol
  id: number
  kind: FactoryKind
  model?: ModelFunction
  name: string
}

interface StoreDependency {
  site: ts.CallExpression
  source: StoreNode
  target: StoreNode
}

interface ProgramStoreGraph {
  cyclicDependencies: readonly StoreDependency[]
}

export interface CyclicStoreDependency {
  site: ts.CallExpression
  source: string
  target: string
}

const programGraphCache = new WeakMap<ts.Program, ProgramStoreGraph>()
const sourceDependencyCache = new WeakMap<
  ts.Program,
  WeakMap<ts.SourceFile, readonly CyclicStoreDependency[]>
>()

/** Visit a TypeScript tree iteratively so large source files do not consume the call stack. */
function forEachTsNode(root: ts.Node, visit: (node: ts.Node) => void) {
  const stack = [root]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node)
      continue

    visit(node)
    const children: ts.Node[] = []
    ts.forEachChild(node, child => {
      children.push(child)
    })
    for (let index = children.length - 1; index >= 0; index -= 1)
      stack.push(children[index])
  }
}

/** Resolve the first tuple binding that owns a direct factory result. */
function getFactoryHookBinding(call: ts.CallExpression) {
  let expression: ts.Expression = call
  let parent = expression.parent

  while ((ts.isParenthesizedExpression(parent)
    || ts.isAsExpression(parent)
    || ts.isTypeAssertionExpression(parent)
    || ts.isNonNullExpression(parent)
    || ts.isSatisfiesExpression(parent))
  && parent.expression === expression) {
    expression = parent
    parent = expression.parent
  }

  if (!ts.isVariableDeclaration(parent)
    || parent.initializer !== expression
    || !ts.isArrayBindingPattern(parent.name)) {
    return undefined
  }

  const first = parent.name.elements[0]
  return first && ts.isBindingElement(first) && ts.isIdentifier(first.name)
    ? first.name
    : undefined
}

/** Collect real Kerros Store bindings from all user source files in one Program. */
function collectStoreNodes(program: ts.Program) {
  const tools = createKerrosProgramTools(program)
  const nodes: StoreNode[] = []

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile
      || program.isSourceFileDefaultLibrary(sourceFile)
      || program.isSourceFileFromExternalLibrary(sourceFile)) {
      continue
    }

    forEachTsNode(sourceFile, node => {
      if (!ts.isCallExpression(node))
        return

      const kind = tools.getFactoryKind(node)
      const binding = kind ? getFactoryHookBinding(node) : undefined
      const hook = binding ? tools.getTsSymbol(binding) : undefined
      if (!kind || !hook)
        return

      const modelInput = kind === 'createStore' ? node.arguments[0] : undefined
      const model = modelInput ? tools.getModelFunction(modelInput) : undefined
      nodes.push({ call: node, hook, id: nodes.length, kind, model, name: hook.getName() })
    })
  }

  return { nodes, tools }
}

/** Collect Store Hook calls reached synchronously from one createStore model. */
function collectModelDependencies(
  source: StoreNode,
  storesByHook: ReadonlyMap<ts.Symbol, StoreNode>,
  tools: ReturnType<typeof createKerrosProgramTools>,
) {
  const dependencies: StoreDependency[] = []
  const visitedFunctions = new Set<ModelFunction>()
  const pendingFunctions = source.model ? [source.model] : []

  while (pendingFunctions.length > 0) {
    const fn = pendingFunctions.pop()
    if (!fn || visitedFunctions.has(fn))
      continue
    visitedFunctions.add(fn)

    const root = fn.body
    if (!root)
      continue
    const stack: ts.Node[] = [root]
    while (stack.length > 0) {
      const node = stack.pop()
      if (!node)
        continue
      if (node !== root && ts.isFunctionLike(node))
        continue

      if (ts.isCallExpression(node)) {
        const hook = tools.getTsSymbol(node.expression)
        const target = hook ? storesByHook.get(hook) : undefined
        if (target) {
          dependencies.push({ site: node, source, target })
        }
        else {
          const calledFunction = tools.getModelFunction(node.expression)
          if (calledFunction && !visitedFunctions.has(calledFunction))
            pendingFunctions.push(calledFunction)
        }
      }

      const children: ts.Node[] = []
      ts.forEachChild(node, child => {
        children.push(child)
      })
      for (let index = children.length - 1; index >= 0; index -= 1)
        stack.push(children[index])
    }
  }

  return dependencies
}

/** Find strongly connected components with iterative Kosaraju passes. */
function getStronglyConnectedComponents(adjacency: readonly number[][]) {
  const visited = new Uint8Array(adjacency.length)
  const finishOrder: number[] = []

  for (let start = 0; start < adjacency.length; start += 1) {
    if (visited[start] === 1)
      continue

    visited[start] = 1
    const stack = [{ index: 0, node: start }]
    while (stack.length > 0) {
      const frame = stack.at(-1)
      if (!frame)
        break

      const neighbors = adjacency[frame.node]
      const neighbor = neighbors[frame.index]
      if (neighbor !== undefined) {
        frame.index += 1
        if (visited[neighbor] === 0) {
          visited[neighbor] = 1
          stack.push({ index: 0, node: neighbor })
        }
        continue
      }

      finishOrder.push(frame.node)
      stack.pop()
    }
  }

  const reverse = Array.from({ length: adjacency.length }, () => [] as number[])
  for (let source = 0; source < adjacency.length; source += 1) {
    for (const target of adjacency[source])
      reverse[target].push(source)
  }

  visited.fill(0)
  const components: number[][] = []
  for (let index = finishOrder.length - 1; index >= 0; index -= 1) {
    const start = finishOrder[index]
    if (visited[start] === 1)
      continue

    const component: number[] = []
    const stack = [start]
    visited[start] = 1
    while (stack.length > 0) {
      const node = stack.pop()
      if (node === undefined)
        continue
      component.push(node)

      for (const neighbor of reverse[node]) {
        if (visited[neighbor] === 0) {
          visited[neighbor] = 1
          stack.push(neighbor)
        }
      }
    }
    components.push(component)
  }

  return components
}

/** Compare dependency sites by file and source position for stable diagnostics. */
function compareDependencies(left: StoreDependency, right: StoreDependency) {
  const leftFile = left.site.getSourceFile().fileName
  const rightFile = right.site.getSourceFile().fileName
  return leftFile.localeCompare(rightFile)
    || left.site.getStart() - right.site.getStart()
    || left.target.id - right.target.id
}

/** Select bounded, deterministic diagnostics from cyclic graph components. */
function collectCyclicDependencies(nodes: readonly StoreNode[], dependencies: readonly StoreDependency[]) {
  const adjacencySets = Array.from({ length: nodes.length }, () => new Set<number>())
  const dependenciesBySource = new Map<number, StoreDependency[]>()
  for (const dependency of dependencies) {
    adjacencySets[dependency.source.id].add(dependency.target.id)
    const existing = dependenciesBySource.get(dependency.source.id) ?? []
    existing.push(dependency)
    dependenciesBySource.set(dependency.source.id, existing)
  }

  const adjacency = adjacencySets.map(targets => [...targets])
  const components = getStronglyConnectedComponents(adjacency)
  const cyclicDependencies: StoreDependency[] = []

  for (const component of components) {
    const cyclic = component.length > 1
      || (component[0] !== undefined && adjacencySets[component[0]].has(component[0]))
    if (!cyclic)
      continue

    const members = new Set(component)
    component.sort((left, right) => left - right)
    for (const source of component) {
      const dependency = (dependenciesBySource.get(source) ?? [])
        .filter(candidate => members.has(candidate.target.id))
        .sort(compareDependencies)[0]
      if (dependency)
        cyclicDependencies.push(dependency)
    }
  }

  return cyclicDependencies.sort(compareDependencies)
}

/** Build and cache the complete Store graph once for a TypeScript Program. */
function getProgramStoreGraph(program: ts.Program) {
  const cached = programGraphCache.get(program)
  if (cached)
    return cached

  const { nodes, tools } = collectStoreNodes(program)
  const storesByHook = new Map(nodes.map(node => [node.hook, node] as const))
  const dependencies = nodes.flatMap(node => {
    return node.kind === 'createStore'
      ? collectModelDependencies(node, storesByHook, tools)
      : []
  })
  const graph = { cyclicDependencies: collectCyclicDependencies(nodes, dependencies) }
  programGraphCache.set(program, graph)
  return graph
}

/** Read cached cyclic dependency sites belonging to one current source file. */
export function getCyclicStoreDependencies(program: ts.Program, sourceFile: ts.SourceFile) {
  let sourceFiles = sourceDependencyCache.get(program)
  if (!sourceFiles) {
    sourceFiles = new WeakMap()
    sourceDependencyCache.set(program, sourceFiles)
  }

  const cached = sourceFiles.get(sourceFile)
  if (cached)
    return cached

  const dependencies = getProgramStoreGraph(program).cyclicDependencies
    .filter(dependency => dependency.site.getSourceFile() === sourceFile)
    .map(dependency => ({
      site: dependency.site,
      source: dependency.source.name,
      target: dependency.target.name,
    }))
  sourceFiles.set(sourceFile, dependencies)
  return dependencies
}
