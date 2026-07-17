# API reference

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

The input Hook may use React Hooks and receives all Provider props except `children`.

```tsx
const [useTheme, ThemeProvider] = createStore(
  ({ initialDark }: { initialDark: boolean }) => {
    const [dark, setDark] = useState(initialDark)
    return { dark, setDark }
  },
)
```

## Store Hook

The returned Hook requires a selector whose result is an object. Top-level fields are compared with shallow equality. Calling it outside the matching Provider throws a clear error.

## Provider

Each Provider owns one stable external-store container. Updating its Hook publishes a snapshot to selected subscribers without changing the Context value, so the Provider does not invalidate every descendant through Context.

## React compatibility

Kerros supports React `^17`, `^18`, and `^19`. It uses `use-sync-external-store/shim/with-selector`; React 18 and 19 automatically prefer their native `useSyncExternalStore` implementation.

Server rendering reads the Provider's initial snapshot through `getServerSnapshot`. Browser updates are published after commit.
