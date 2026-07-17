# API 레퍼런스

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

입력 Hook은 React Hooks를 사용할 수 있으며 Provider의 `children`을 제외한 모든 props를 받습니다.

반환된 Store Hook에는 객체를 반환하는 selector가 필요합니다. 최상위 필드는 얕게 비교되며, 대응하는 Provider 밖에서 호출하면 명확한 오류를 던집니다.

각 Provider는 안정적인 외부 Store 컨테이너를 소유합니다. Context 값을 바꾸지 않고 선택된 구독자에게만 스냅샷을 알립니다.

Kerros는 React `^17`, `^18`, `^19`를 지원하며 `use-sync-external-store/shim/with-selector`를 사용합니다.
