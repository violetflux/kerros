import { noBroadStoreAccess } from '../src/rules/no-broad-store-access'
import { filename, ruleTester } from './rule-tester'

const binding = `
  import { bindStore } from '@violetflux/kerros'
  interface Store { getSnapshot(): { count: number; items: string[]; nested: { value: number } }; subscribe(listener: () => void): () => void }
  const [useCounter, CounterProvider, useCounterInstance] = bindStore<Store>()
`

ruleTester.run('no-broad-store-access', noBroadStoreAccess, {
  valid: [
    { filename, code: `${binding}; function Component() { const { count } = useCounter(); return count }` },
    { filename, code: `${binding}; function Component() { const snapshot = useCounter(); return snapshot.count }` },
    { filename, code: `${binding}; function Component() { const snapshot = useCounter(); return <Child snapshot={snapshot} /> }; function Child({ snapshot }: { snapshot: { count: number } }) { return snapshot.count }` },
    { filename, code: `${binding}; function Component() { return <Child snapshot={useCounter()} /> }; function Child({ snapshot }: { snapshot: { count: number } }) { return snapshot.count }` },
    { filename, code: `${binding}; function useCounterSnapshot() { return useCounter() }; function Component() { const snapshot = useCounterSnapshot(); return snapshot.count }` },
    { filename, code: `${binding}; function Component() { const { count } = useCounter(); return JSON.stringify(count) }` },
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
      code: `${binding}; function Component() { const snapshot = useCounter(); return Object.keys(snapshot) }`,
      errors: [{ messageId: 'broadAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { const snapshot = useCounter(); const alias = snapshot; return JSON.stringify(alias) }`,
      errors: [{ messageId: 'broadAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { const snapshot = useCounter(); return { ...snapshot } }`,
      errors: [{ messageId: 'broadAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { const snapshot = useCounter(); const { count, ...rest } = snapshot; return count + Object.keys(rest).length }`,
      errors: [{ messageId: 'broadAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { const { nested } = useCounter(); return Object.keys(nested) }`,
      errors: [{ messageId: 'broadAccess' }],
    },
    {
      filename,
      code: `${binding}; function Component() { return Object.values(useCounter()) }`,
      errors: [{ messageId: 'broadAccess' }],
    },
  ],
})
