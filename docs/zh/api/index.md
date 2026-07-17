# API 参考

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

传入的 Hook 可以使用 React Hooks，并接收 Provider 除 `children` 以外的全部 props。

返回的 Store Hook 必须传 selector，selector 返回对象并执行顶层浅比较。在匹配的 Provider 外调用时会抛出明确错误。

每个 Provider 都持有一个稳定的外部 Store 容器。Hook 更新只向 selector 订阅者发布快照，不改变 Context value，因此不会通过 Context 让全部后代失效。

Kerros 支持 React `^17`、`^18` 和 `^19`。底层使用 `use-sync-external-store/shim/with-selector`，React 18 和 19 会自动优先使用原生 `useSyncExternalStore`。

服务端渲染通过 `getServerSnapshot` 读取 Provider 初始快照，浏览器更新在提交后发布。
