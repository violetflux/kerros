import { noBroadStoreAccess } from '../src/rules/no-broad-store-access'
import { requireImmediateStoreAccess } from '../src/rules/require-immediate-store-access'
import { filename, ruleTester } from './rule-tester'

const binding = `
  import { bindStore } from '@violetflux/kerros'
  interface Store { getSnapshot(): { count: number; items: string[]; nested: { value: number } }; subscribe(listener: () => void): () => void }
  const [useCounter, CounterProvider, useCounterInstance] = bindStore<Store>()
`

ruleTester.run('require-immediate-store-access', requireImmediateStoreAccess, {
  valid: [
    { filename, code: `${binding}; function Component() { const { count } = useCounter(); return count }` },
    { filename, code: `function useCounter() { return { count: 0 } }; Object.values(useCounter())` },
    { filename, code: `${binding}; function Component() { return useCounter().count }` },
    { filename, code: `function useCounter() { return { count: 0 } }; function Component() { const state = useCounter(); return state.count }` },
    { filename, code: `${binding}; function Component() { return useCounter(s => ({ count: s.count })) }` },
  ],
  invalid: [
    {
      filename,
      code: `${binding}; function Component() { const state = useCounter(); return state.count }`,
      errors: [{ messageId: 'immediateAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { return consume(useCounter()) }; function consume(value: object) { return value }`,
      errors: [{ messageId: 'immediateAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { const read = useCounter; const state = read(); return state.count }`,
      errors: [{ messageId: 'immediateAccess' }],
    },
    {
      filename,
      code: `import { useShared as readShared } from '@fixtures/bindings'; function Component() { return readShared() }`,
      errors: [{ messageId: 'immediateAccess' }],
    },
  ],
})

ruleTester.run('no-broad-store-access', noBroadStoreAccess, {
  valid: [
    { filename, code: `${binding}; function Component() { const { count } = useCounter(); return count }` },
  ],
  invalid: [
    {
      filename,
      code: `${binding}; function Component() { const { count, ...rest } = useCounter(); return rest }`,
      errors: [{ messageId: 'broadAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { return Object.keys(useCounter()) }`,
      errors: [{ messageId: 'broadAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { return JSON.stringify(useCounter()) }`,
      errors: [{ messageId: 'broadAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { return { ...useCounter() } }`,
      errors: [{ messageId: 'broadAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { return Object.entries(useCounter()) }`,
      errors: [{ messageId: 'broadAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { return Object.values(useCounter()) }`,
      errors: [{ messageId: 'broadAccess' }],
    },
  ],
})
