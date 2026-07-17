# Migrating from hox

Kerros has a familiar `createStore` API, with two important differences: a Kerros Store always has an explicit Provider, and every read requires a selector.

## Migrate a scoped Store

A regular hox Store:

```tsx
import { createStore } from 'hox'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

The definition stays almost identical; replace the import:

```tsx
import { createStore } from '@violetflux/kerros'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

Replace whole-Store reads:

```tsx
const { count, setCount } = useCounter()
```

with explicit selectors:

```tsx
const { count, setCount } = useCounter(s => ({
  count: s.count,
  setCount: s.setCount,
}))
```

## Migrate a global Store

hox can register a hidden global Store with `createGlobalStore` and `HoxRoot`:

```tsx
import { createGlobalStore } from 'hox'

export const [useAccount, getAccount] = createGlobalStore(() => {
  const [user, setUser] = useState<User | null>(null)
  return { user, setUser }
})
```

Kerros does not provide hidden global Stores. Replace it with `createStore`:

```tsx
import { createStore } from '@violetflux/kerros'

export const [useAccount, AccountProvider] = createStore(() => {
  const [user, setUser] = useState<User | null>(null)
  return { user, setUser }
})
```

Then mount the Provider at the application root:

```tsx
createRoot(document.getElementById('root')!).render(
  <AccountProvider>
    <App />
  </AccountProvider>,
)
```

Mount several root Stores in dependency order:

```tsx
<AccountProvider>
  <TaskProvider>
    <App />
  </TaskProvider>
</AccountProvider>
```

## Replace `getXxxStore`

Kerros does not expose a static read such as `getAccount()`. Components and dependent Stores use selectors:

```tsx
const { user } = useAccount(s => ({ user: s.user }))
```

For logging, request interceptors, or other non-React code, pass the required value as an argument or move that state into a genuinely React-independent external Store. Avoid maintaining a second mirrored copy just for static reads.

## Split a large global Store

You do not have to move every field into one new root Store. Split by responsibility and mount dependencies in order:

```text
Account → Task → Editor
```

High-frequency local state, such as drafts and dialog flags, can live in Providers closer to the feature that owns it.

## `useMemoizedFn` and `useEffectEvent`

Public Store actions can be ordinary functions. React Compiler may stabilize values it can prove safe; without Compiler, follow normal React function-identity rules.

React 19's `useEffectEvent` is only for events called from Effects. Do not use it to wrap button handlers, submit actions, or other public Store methods.

After migrating, search the repository for remaining references to `hox`, `HoxRoot`, `createGlobalStore`, static `getXxxStore` calls, and `useMemoizedFn`.
