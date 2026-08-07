import { noEffectEventAction } from '../src/rules/no-effect-event-action'
import { noUnstableBoundStore } from '../src/rules/no-unstable-bound-store'
import { preferBindStore } from '../src/rules/prefer-bind-store'
import { requireCachedSnapshot } from '../src/rules/require-cached-snapshot'
import { filename, ruleTester } from './rule-tester'

ruleTester.run('prefer-bind-store', preferBindStore, {
  valid: [
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { return { count: 0 } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useSyncExternalStore() { return { count: 0 } }
        function useCounterModel() { return useSyncExternalStore() }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
    },
    {
      filename,
      code: `
        import { useSyncExternalStore } from 'react'
        const snapshot = { count: 0 }
        function Component() { return useSyncExternalStore(() => () => {}, () => snapshot).count }
      `,
    },
    {
      filename,
      code: `
        import { useSyncExternalStore } from 'react'
        const snapshot = { count: 0 }
        function createStore<T>(model: () => T) { return model() }
        const store = createStore(() => useSyncExternalStore(() => () => {}, () => snapshot))
      `,
    },
  ],
  invalid: [
    {
      filename,
      code: `
        import { useSyncExternalStore } from 'react'
        import { createStore } from '@violetflux/kerros'
        const snapshot = { count: 0 }
        const [useCounter, CounterProvider] = createStore(
          () => useSyncExternalStore(() => () => {}, () => snapshot),
        )
      `,
      errors: [{ messageId: 'bindExternalStore' }],
    },
    {
      filename,
      code: `
        import { useSyncExternalStore as useExternal } from 'react'
        import { createStore } from '@violetflux/kerros'
        const snapshot = { count: 0 }
        function useCounterModel() { return useExternal(() => () => {}, () => snapshot) }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
      errors: [{ messageId: 'bindExternalStore' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        import { useExternalSyncModel } from '@fixtures/external-store'
        const [useExternal, ExternalProvider] = createStore(useExternalSyncModel)
      `,
      errors: [{ messageId: 'bindExternalStore' }],
    },
    {
      filename,
      code: `
        import { useSyncExternalStore } from 'react'
        import { createStore } from '@violetflux/kerros'
        const snapshot = { count: 0 }
        function useCounterModel(): { count: number }
        function useCounterModel() { return useSyncExternalStore(() => () => {}, () => snapshot) }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
      errors: [{ messageId: 'bindExternalStore' }],
    },
  ],
})

ruleTester.run('require-cached-snapshot', requireCachedSnapshot, {
  valid: [
    {
      filename,
      code: `
        import { bindStore } from '@violetflux/kerros'
        import { CachedStore } from '@fixtures/external-store'
        const [useCounter, CounterProvider, useCounterInstance] = bindStore<CachedStore>()
      `,
    },
    {
      filename,
      code: `
        import { bindStore } from '@violetflux/kerros'
        const snapshot = { count: 0 }
        const store = { getSnapshot: () => snapshot, subscribe: (_listener: () => void) => () => {} }
        const [useCounter, CounterProvider, useCounterInstance] = bindStore<typeof store>()
      `,
    },
    {
      filename,
      code: `
        interface Store { getSnapshot(): { count: number }; subscribe(listener: () => void): () => void }
        declare function bindStore<T>(): readonly [unknown, unknown, unknown]
        const bindings = bindStore<Store>()
      `,
    },
  ],
  invalid: [
    {
      filename,
      code: `
        import { bindStore as bind } from '@violetflux/kerros'
        import { UncachedStore } from '@fixtures/external-store'
        const [useCounter, CounterProvider, useCounterInstance] = bind<UncachedStore>()
      `,
      errors: [{ messageId: 'uncachedSnapshot' }],
    },
    {
      filename,
      code: `
        import { bindStore } from '@violetflux/kerros'
        const store = { getSnapshot: () => [], subscribe: (_listener: () => void) => () => {} }
        const [useList, ListProvider, useListInstance] = bindStore<typeof store>()
      `,
      errors: [{ messageId: 'uncachedSnapshot' }],
    },
    {
      filename,
      code: `
        import { bindStore } from '@violetflux/kerros'
        import { PropertyStore } from '@fixtures/external-store'
        const bindings = bindStore<PropertyStore>()
      `,
      errors: [{ messageId: 'uncachedSnapshot' }],
    },
    {
      filename,
      code: `
        import { bindStore } from '@violetflux/kerros'
        function getSnapshot() { return new Map<string, number>() }
        const store = { getSnapshot, subscribe: (_listener: () => void) => () => {} }
        const bindings = bindStore<typeof store>()
      `,
      errors: [{ messageId: 'uncachedSnapshot' }],
    },
    {
      filename,
      code: `
        import { bindStore } from '@violetflux/kerros'
        const store = { getSnapshot() { return () => 1 }, subscribe: (_listener: () => void) => () => {} }
        const bindings = bindStore<typeof store>()
      `,
      errors: [{ messageId: 'uncachedSnapshot' }],
    },
    {
      filename,
      code: `
        import { bindStore } from '@violetflux/kerros'
        const store = { getSnapshot() { return <span /> }, subscribe: (_listener: () => void) => () => {} }
        const bindings = bindStore<typeof store>()
      `,
      errors: [{ messageId: 'uncachedSnapshot' }],
    },
  ],
})

const providerBinding = `
  import { bindStore } from '@violetflux/kerros'
  interface Store { getSnapshot(): { count: number }; subscribe(listener: () => void): () => void }
  const [useCounter, CounterProvider, useCounterInstance] = bindStore<Store>()
  declare const stableStore: Store
`

ruleTester.run('no-unstable-bound-store', noUnstableBoundStore, {
  valid: [
    { filename, code: `${providerBinding}; function App() { return <CounterProvider store={stableStore} /> }` },
    { filename, code: `${providerBinding}; function App(props: { store: Store }) { return <CounterProvider store={props.store} /> }` },
    { filename, code: `${providerBinding}; function App(props: { store: Store }) { const { store } = props; return <CounterProvider store={store} /> }` },
    { filename, code: `${providerBinding}; import { useMemo } from 'react'; function App() { const store = useMemo(() => stableStore, []); return <CounterProvider store={store} /> }` },
    { filename, code: `${providerBinding}; import { useState } from 'react'; function App() { const [store] = useState(() => stableStore); return <CounterProvider store={store} /> }` },
    { filename, code: `${providerBinding}; import { useState } from 'react'; function App() { function createStore() { return stableStore }; const [store] = useState(createStore); return <CounterProvider store={store} /> }` },
    { filename, code: `${providerBinding}; import { useRef } from 'react'; function App() { const store = useRef(stableStore); return <CounterProvider store={store.current} /> }` },
    {
      filename,
      code: `
        import { ExternalProvider } from '@fixtures/external-bindings'
        import type { CachedStore } from '@fixtures/external-store'
        function App({ store }: { store: CachedStore }) { return <ExternalProvider store={store} /> }
      `,
    },
    {
      filename,
      code: `
        interface ProviderProps { store: object }
        function CounterProvider(_props: ProviderProps) { return null }
        function App() { return <CounterProvider store={{}} /> }
      `,
    },
  ],
  invalid: [
    {
      filename,
      code: `${providerBinding}; declare class StoreImpl implements Store { getSnapshot(): { count: number }; subscribe(listener: () => void): () => void }; function App() { return <CounterProvider store={new StoreImpl()} /> }`,
      errors: [{ messageId: 'unstableStore' }],
    },
    {
      filename,
      code: `${providerBinding}; function makeStore(): Store { return stableStore }; function App() { return <CounterProvider store={makeStore()} /> }`,
      errors: [{ messageId: 'unstableStore' }],
    },
    {
      filename,
      code: `${providerBinding}; function App() { return <CounterProvider store={{ getSnapshot: stableStore.getSnapshot, subscribe: stableStore.subscribe }} /> }`,
      errors: [{ messageId: 'unstableStore' }],
    },
    {
      filename,
      code: `${providerBinding}; function App() { return <CounterProvider store={[]} /> }`,
      errors: [{ messageId: 'unstableStore' }],
    },
    {
      filename,
      code: `${providerBinding}; function useMemo(factory: () => Store) { return factory() }; function App() { const store = useMemo(() => stableStore); return <CounterProvider store={store} /> }`,
      errors: [{ messageId: 'unstableStore' }],
    },
  ],
})

ruleTester.run('no-effect-event-action', noEffectEventAction, {
  valid: [
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { const increment = () => {}; return { increment } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
    },
    {
      filename,
      code: `
        import { useEffectEvent } from 'react'
        function Component() { const event = useEffectEvent(() => {}); return <button onClick={event} /> }
      `,
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useEffectEvent<T extends Function>(callback: T): T { return callback }
        function useCounterModel() { const increment = useEffectEvent(() => {}); return { increment } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
    },
    {
      filename,
      code: `
        import { useEffectEvent } from 'react'
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { const event = useEffectEvent(() => {}); event(); return { count: 0 } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
    },
    {
      filename,
      code: `
        import { useEffectEvent } from 'react'
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { let increment = useEffectEvent(() => {}); increment = () => {}; return { increment } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
    },
    {
      filename,
      code: `
        import { useEffectEvent } from 'react'
        function createStore<T>(model: () => T) { return model() }
        function useCounterModel() { const increment = useEffectEvent(() => {}); return { increment } }
        const store = createStore(useCounterModel)
      `,
    },
  ],
  invalid: [
    {
      filename,
      code: `
        import { useEffectEvent } from 'react'
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { const event = useEffectEvent(() => {}); const increment = event; return { increment } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
      errors: [{ messageId: 'effectEventAction' }],
    },
    {
      filename,
      code: `
        import { useEffectEvent as useEvent } from 'react'
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { return { increment: useEvent(() => {}) } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
      errors: [{ messageId: 'effectEventAction' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        import { useExternalEffectModel } from '@fixtures/external-store'
        const [useExternal, ExternalProvider] = createStore(useExternalEffectModel)
      `,
      errors: [{ messageId: 'effectEventAction' }],
    },
    {
      filename,
      code: `
        import { useEffectEvent } from 'react'
        import { createStore } from '@violetflux/kerros'
        function useCounterModel(props: { replace: boolean }) { let increment = useEffectEvent(() => {}); if (props.replace) increment = () => {}; return { increment } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
      errors: [{ messageId: 'effectEventAction' }],
    },
  ],
})
