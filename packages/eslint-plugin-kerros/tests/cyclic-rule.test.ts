import parser from '@typescript-eslint/parser'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { noCyclicStoreDependency } from '../src/rules/no-cyclic-store-dependency'
import { filename, ruleTester } from './rule-tester'

const cyclicModelFilename = fileURLToPath(new URL('./fixtures/cyclic-model.ts', import.meta.url))
const cyclicStoreFilename = fileURLToPath(new URL('./fixtures/cyclic-store-b.ts', import.meta.url))
const cyclicModelCode = readFileSync(cyclicModelFilename, 'utf8')
const cyclicStoreCode = readFileSync(cyclicStoreFilename, 'utf8')

/** Build a large Store graph whose last node optionally closes the cycle. */
function buildLargeGraph(size: number, cyclic: boolean) {
  const models = Array.from({ length: size }, (_, index) => {
    const dependency = index + 1 < size
      ? `useStore${index + 1}()`
      : cyclic
        ? 'useStore0()'
        : ''
    return `
      function useStore${index}Model(): StoreValue {
        ${dependency}
        return { value: ${index} }
      }
    `
  }).join('\n')
  const bindings = Array.from({ length: size }, (_, index) => {
    return `const [useStore${index}, Store${index}Provider] = createStore<StoreValue>(useStore${index}Model)`
  }).join('\n')

  return `
    import { createStore } from '@violetflux/kerros'
    interface StoreValue { value: number }
    ${models}
    ${bindings}
  `
}

const largeDag = buildLargeGraph(100, false)
const largeCycle = buildLargeGraph(100, true)
const largeCycleErrors = Array.from({ length: 100 }, () => ({
  messageId: 'cyclicDependency' as const,
}))

ruleTester.run('no-cyclic-store-dependency', noCyclicStoreDependency, {
  valid: [
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useBModel() { return { value: 1 } }
        const [useB, BProvider] = createStore(useBModel)
        function useAModel() { const { value } = useB(); return { value } }
        const [useA, AProvider] = createStore(useAModel)
      `,
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useOrdinaryHook() { return { value: 1 } }
        function useAModel() { return useOrdinaryHook() }
        const [useA, AProvider] = createStore(useAModel)
      `,
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useAModel() { return { readB: () => useB() } }
        const [useA, AProvider] = createStore(useAModel)
        function useBModel() { const { readB } = useA(); return { readB } }
        const [useB, BProvider] = createStore(useBModel)
      `,
    },
    { filename, code: largeDag },
  ],
  invalid: [
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useAModel() { const { value } = useA(); return { value } }
        const [useA, AProvider] = createStore(useAModel)
      `,
      errors: [{ messageId: 'cyclicDependency' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useAModel() { const { value } = useB(); return { value } }
        const [useA, AProvider] = createStore(useAModel)
        function useBModel() { const { value } = useA(); return { value } }
        const [useB, BProvider] = createStore(useBModel)
      `,
      errors: [
        { messageId: 'cyclicDependency' },
        { messageId: 'cyclicDependency' },
      ],
    },
    {
      filename,
      code: `
        import { createStore as makeStore } from '@violetflux/kerros'
        function useAModel() { useB(); return { value: 1 } }
        const [useA] = makeStore(useAModel)
        function useBModel() { useC(); return { value: 1 } }
        const [useB] = makeStore(useBModel)
        function useCModel() { useA(); return { value: 1 } }
        const [useC] = makeStore(useCModel)
      `,
      errors: [
        { messageId: 'cyclicDependency' },
        { messageId: 'cyclicDependency' },
        { messageId: 'cyclicDependency' },
      ],
    },
    {
      filename: cyclicModelFilename,
      code: cyclicModelCode,
      errors: [{ messageId: 'cyclicDependency' }],
    },
    {
      filename: cyclicStoreFilename,
      code: cyclicStoreCode,
      errors: [{ messageId: 'cyclicDependency' }],
    },
    {
      filename,
      code: `${largeCycle}\n// repeated Program analysis remains deterministic`,
      errors: largeCycleErrors,
    },
    {
      filename,
      code: `${largeCycle}\n// repeated lint keeps the same result`,
      errors: largeCycleErrors,
    },
  ],
})

const isolatedFixturesDir = fileURLToPath(new URL('./isolated-fixtures', import.meta.url))
const isolatedFilename = fileURLToPath(new URL('./isolated-fixtures/case.tsx', import.meta.url))
const isolatedRuleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: isolatedFixturesDir,
    },
  },
})

isolatedRuleTester.run('no-cyclic-store-dependency Program isolation', noCyclicStoreDependency, {
  valid: [{
    filename: isolatedFilename,
    code: `
      import { createStore } from '@violetflux/kerros'
      function useBModel() { return { value: 1 } }
      const [useB] = createStore(useBModel)
      function useAModel() { return useB() }
      const [useA] = createStore(useAModel)
    `,
  }],
  invalid: [{
    filename: isolatedFilename,
    code: `
      import { createStore } from '@violetflux/kerros'
      function useAModel() { return useA() }
      const [useA] = createStore(useAModel)
    `,
    errors: [{ messageId: 'cyclicDependency' }],
  }],
})
