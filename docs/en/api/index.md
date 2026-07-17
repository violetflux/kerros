# API reference

Kerros has one public function: `createStore`.

## `createStore(useStoreValue)`

Turn a React Hook into a consumer Hook and Provider:

```tsx
const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

Type signature:

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

### `useStoreValue`

`useStoreValue` is the Store implementation Hook. It may call other React Hooks and return the state and actions that should be shared:

```tsx
const [useTheme, ThemeProvider] = createStore(() => {
  const [dark, setDark] = useState(false)
  const toggle = () => setDark(v => !v)

  return { dark, toggle }
})
```

It must follow the Rules of Hooks.

### Return value

`createStore` returns two values:

```tsx
const [useTheme, ThemeProvider] = createStore(/* ... */)
```

- `useTheme` is the Hook used by components or dependent Stores
- `ThemeProvider` is the React component that creates and owns a Store instance

Domain names such as `useTheme` and `ThemeProvider` are recommended; repeating `Store` is optional.

### Store Hook

The Store Hook requires an object-returning selector:

```tsx
const { dark, toggle } = useTheme(s => ({
  dark: s.dark,
  toggle: s.toggle,
}))
```

Kerros shallowly compares the returned object's top-level fields with `Object.is`. The component does not rerender for other Store updates while those selected fields stay equal.

Calling the Hook outside its matching Provider throws:

```text
Kerros store hook must be used within its matching Provider
```

### Provider props

All Provider props except `children` are passed to the Store Hook:

```tsx
interface CounterProps {
  initialCount: number
}

const [useCounter, CounterProvider] = createStore(
  ({ initialCount }: CounterProps) => {
    const [count, setCount] = useState(initialCount)
    return { count, setCount }
  },
)
```

```tsx
<CounterProvider initialCount={10}>
  <Counter />
</CounterProvider>
```

Every mounted Provider creates an independent Store instance.

## React versions

| React | Subscription implementation |
| --- | --- |
| React 17 | `use-sync-external-store` compatibility shim |
| React 18 | React's native `useSyncExternalStore` when available |
| React 19 | React's native implementation, compatible with React Compiler |

React Compiler is optional.

## Server rendering

Kerros supplies `getServerSnapshot` to `useSyncExternalStore`. The Provider's initial result is used for the server snapshot, and later values are published only after the Provider commits so consumers never observe an abandoned render.
