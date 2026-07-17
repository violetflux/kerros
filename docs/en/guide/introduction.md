# Introduction

Kerros is a small bridge between React Hooks, Context ownership, and external-store subscriptions.

You write state as an ordinary Hook:

```tsx
function useCounterStore() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}
```

Kerros turns it into a scoped Store:

```tsx
const [useCounter, CounterProvider] = createStore(useCounterStore)
```

The Provider decides **where the Store exists**. The selector decides **which changes a component observes**.

## The problem it solves

React Context models ownership and dependency injection well, but a changing Context value invalidates every consumer. A module-level external Store offers focused subscriptions, but it is global by default and often introduces another state model.

Kerros keeps both boundaries explicit:

| Concern | Kerros answer |
| --- | --- |
| State model | Ordinary React Hooks |
| Ownership | Provider placement |
| Updates | `useSyncExternalStore` subscriptions |
| Rerenders | Object selector with shallow top-level equality |
| Multiple instances | Mount the Provider more than once |
| Cross-Store data | One-way Provider nesting |

Context carries a stable subscription container rather than the changing Store snapshot. A Store Hook publishes only committed snapshots, and each component subscribes to its selected projection.

## When Kerros fits

Kerros works well when:

- state is naturally scoped to a route, workspace, editor, session, or feature subtree
- the Store already wants to use React or SDK Hooks
- components need focused subscriptions without a large global rerender domain
- Provider props should initialize or configure a Store instance
- tests should create isolated Store instances without clearing a singleton

Use local component state when only one small subtree owns the state. Prefer a framework-specific server cache for remote-data caching. Choose a standalone external Store when state must exist outside React entirely.

## One architectural rule

Store dependencies must be one-way. If Store B selects from Store A, mount A outside B and never make A read B. This keeps the Provider order obvious and prevents circular state ownership.

Continue with [Getting started](./getting-started) or read [Store composition](./composition).
