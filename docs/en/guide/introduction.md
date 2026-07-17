# Introduction

Kerros is a lightweight way to share state between React components.

There is no new state syntax to learn. Write a Store the same way you write a custom Hook, and use `createStore` only when local state needs to be shared by several components.

## Why Kerros?

- **Reuse the React knowledge you already have** — if you can write a custom Hook, you can write a Store
- **Designed for flexible refactoring** — Stores and components use the same Hook API, so local state can become shared state with very little work
- **Local and application-wide state** — Provider placement determines the Store scope, balancing flexibility with simplicity
- **Performance and TypeScript support** — selector subscriptions avoid unrelated rerenders and Store types are inferred automatically

## From state management to state sharing

Think about Redux, Zustand, and Recoil. They can all share data, but their central job is to organize state, update it, and define how data flows. “State management” is the right name for them.

Kerros does not try to design your data flow, manage every async operation, or put all state into one global container. It focuses on one problem: **sharing state between React components.**

Passing `value` and `onChange` through layer after layer gradually damages component boundaries. Moving every value into a global Store does not automatically give an application better scalability or maintainability either.

If you need a simple, lightweight, and reliable state-sharing solution instead of another state-management DSL, Kerros may be a good fit.

## How does it work?

Write ordinary Hook state directly inside `createStore`:

```tsx
const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

The Provider decides where the state is shared:

```tsx
<CounterProvider>
  <Counter />
</CounterProvider>
```

The selector decides what a component observes:

```tsx
const { count, setCount } = useCounter(s => ({
  count: s.count,
  setCount: s.setCount,
}))
```

Those are the complete core concepts. Continue with [Quick start](./getting-started) to build a full task Store.
