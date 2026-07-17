<p align="center">
  <a href="https://violetflux.github.io/kerros/">
    <img src="https://raw.githubusercontent.com/violetflux/kerros/main/docs/public/banner.svg" alt="Kerros — selector-first React stores" width="100%" />
  </a>
</p>

<p align="center">
  English ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.zh-CN.md">简体中文</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ja.md">日本語</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ko.md">한국어</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.de.md">Deutsch</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.fr.md">Français</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.es.md">Español</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@violetflux/kerros"><img src="https://img.shields.io/npm/v/@violetflux/kerros?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/violetflux/kerros/actions/workflows/ci.yml"><img src="https://github.com/violetflux/kerros/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://bundlephobia.com/package/@violetflux/kerros"><img src="https://img.shields.io/bundlephobia/minzip/@violetflux/kerros?label=gzip&color=2563eb" alt="minified gzip size" /></a>
  <a href="https://github.com/violetflux/kerros/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@violetflux/kerros" alt="MIT license" /></a>
</p>

Kerros keeps React state where it naturally belongs: inside Hooks and below Providers. It adds focused selector subscriptions without introducing reducers, actions, proxies, or a global singleton.

- **Hook-native** — a Store is an ordinary React Hook
- **Selector-first** — every consumer explicitly selects an object
- **Focused rerenders** — selected top-level fields use shallow `Object.is` equality
- **Provider-scoped** — each mounted Provider owns an isolated Store instance
- **Composable** — nested Stores may consume outer Stores through one-way dependencies
- **React 17–19** — built on the official `useSyncExternalStore` compatibility shim

## Install

| Package manager | Command |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

## Create a Store

Pass a Hook to `createStore`. It returns the consumer Hook and its matching Provider.

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)

  return { count, setCount }
})
```

This is still normal React. The Store Hook may use `useState`, `useReducer`, other context, SDK Hooks, or your own Hooks.

## Mount it, then select what you need

```tsx
function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return (
    <CounterProvider>
      <Counter />
    </CounterProvider>
  )
}
```

The selector can stay inline. Kerros compares its returned object's top-level fields, so changing an unselected field does not rerender `Counter`.

## Why another Store library?

Context is excellent for ownership and dependency injection, but changing a Context value normally invalidates every consumer. External Stores offer focused subscriptions, but they are often global and introduce a separate state model.

Kerros combines the useful boundary from Context with external-store subscriptions:

1. The Provider runs your Store Hook.
2. Context carries only a stable subscription container.
3. Committed Hook snapshots are published through `subscribe/getSnapshot`.
4. Each component rerenders only when its selected fields change.

No hidden module singleton means the same Provider can be mounted more than once, initialized from props, isolated in tests, or scoped to a subtree.

## Recipes

### Select nested values

Selectors can project any shape. Equality applies to the returned object's top-level fields.

```tsx
const { name, save } = useProfile(s => ({
  name: s.user.profile.name,
  save: s.actions.save,
}))
```

### Initialize from Provider props

```tsx
const [useTheme, ThemeProvider] = createStore(
  ({ initialDark }: { initialDark: boolean }) => {
    const [dark, setDark] = useState(initialDark)
    return { dark, setDark }
  },
)

<ThemeProvider initialDark={true}>...</ThemeProvider>
```

### Compose Stores

An inner Store may select from an outer Store. Keep dependencies one-way and mount Providers in dependency order.

```tsx
const [useSession, SessionProvider] = createStore(() => {
  const [user, setUser] = useState<User | null>(null)
  return { user, setUser }
})

const [usePermissions, PermissionsProvider] = createStore(() => {
  const { user } = useSession(s => ({ user: s.user }))
  return { canEdit: user?.role === 'editor' }
})

function Providers({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <PermissionsProvider>{children}</PermissionsProvider>
    </SessionProvider>
  )
}
```

### Split a large Store

Split by ownership and update frequency, not by file size. A practical dependency chain might look like:

```text
Stream → Thread → Sender
   ↑         Navigation
```

The lower-level Store never reads back from its dependents. This preserves explicit data flow and prevents circular Provider requirements.

## API

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

- `useStoreValue` must follow the Rules of Hooks
- Provider props are forwarded to `useStoreValue`, excluding `children`
- the returned Store Hook requires an object-returning selector
- calling the Store Hook outside its matching Provider throws a clear error
- Provider snapshots support client rendering, Strict Mode, and server rendering

## React compatibility

| React | Support |
| --- | --- |
| 17 | `use-sync-external-store` shim |
| 18 | Native `useSyncExternalStore` when available |
| 19 | Native `useSyncExternalStore`; works with React Compiler |

Kerros does not require React Compiler. Public actions are ordinary function values; use normal React identity rules when their stability matters.

## Documentation

- [Introduction](https://violetflux.github.io/kerros/guide/introduction)
- [Getting started](https://violetflux.github.io/kerros/guide/getting-started)
- [Selectors](https://violetflux.github.io/kerros/guide/selectors)
- [Store composition](https://violetflux.github.io/kerros/guide/composition)
- [Migration from hox](https://violetflux.github.io/kerros/guide/migration)
- [API reference](https://violetflux.github.io/kerros/api/)

## License

[MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
