# Introduction

Kerros is a lightweight way to share state between React components.

There is no new state syntax to learn. Write a Store the same way you write a custom Hook, and use `createStore` only when local state needs to be shared by several components.

## Why Kerros?

- **Reuse the React knowledge you already have** — if you can write a custom Hook, you can write a Store
- **Designed for flexible refactoring** — Stores and components use the same Hook API, so local state can become shared state with very little work
- **Local and application-wide state** — Provider placement determines the Store scope, balancing flexibility with simplicity
- **Avoid Context-wide rerenders** — Context carries a stable Store container, and automatic tracking rerenders only components that read a changed field
- **TypeScript support** — Store and selector types are inferred without duplicate declarations

## From state management to state sharing

Think about Redux, Zustand, and Recoil. They can all share data, but their central job is to organize state, update it, and define how data flows. “State management” is the right name for them.

Kerros does not try to design your data flow, manage every async operation, or put all state into one global container. It focuses on one problem: **sharing state between React components.**

Passing `value` and `onChange` through layer after layer gradually damages component boundaries. Moving every value into a global Store does not automatically give an application better scalability or maintainability either.

Sharing frequently changing state through React Context directly has another cost: every Context value change rerenders all consumers. Kerros keeps Provider scoping, multiple instances, and dependency injection, but Context carries only a stable container. Automatic property tracking observes render-time reads, so unrelated Store updates do not rerender a component.

If you need a simple, lightweight, and reliable state-sharing solution instead of another state-management DSL, Kerros may be a good fit.

## How does it work?

Write ordinary Hook state in a top-level named Hook, then pass it to `createStore`:

```tsx
function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterModel)
```

The Provider decides where the state is shared:

```tsx
<CounterProvider>
  <Counter />
</CounterProvider>
```

Automatic tracking observes what the component reads:

```tsx
const { count, setCount } = useCounter()
```

Context finds the correct Store instance; automatic tracking decides which Store changes affect each component. Explicit selectors remain available for advanced derived values and measured hot spots.

Those are the complete core concepts. Continue with [Quick start](./getting-started) to build a full task Store.
