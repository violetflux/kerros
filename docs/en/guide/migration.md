# Migrating from hox

Replace the hox factory:

```tsx
// Before
export const [useCounter, CounterProvider] = createGlobalStore(useCounterValue)

// After
export const [useCounter, CounterProvider] = createStore(useCounterValue)
```

Then make every consumer select the fields it needs:

```tsx
const { count, setCount } = useCounter(s => ({
  count: s.count,
  setCount: s.setCount,
}))
```

Kerros intentionally has no compatibility export and no aggregated `store` field. Split large global stores into domain stores and nest Providers in dependency order.

`useEffectEvent` is not an action-stability primitive. Use it only for events called by an Effect. Public store actions remain normal functions; React Compiler or ordinary React memoization can stabilize them.
