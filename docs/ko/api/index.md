# API 레퍼런스

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

```tsx
function useCounterStoreValue() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterStoreValue)
```

입력 Hook은 React Hooks를 사용할 수 있으며 Provider의 `children`을 제외한 모든 props를 받습니다.

`useXxxStoreValue` 같은 이름의 모듈 최상위 함수로 정의하세요. 익명 initializer도 런타임에서는 유효하지만 React Compiler의 `infer` 모드에서는 Hook으로 자동 인식되거나 컴파일되지 않습니다.

반환된 Store Hook에는 객체를 반환하는 selector가 필요합니다. 최상위 필드는 얕게 비교되며, 대응하는 Provider 밖에서 호출하면 명확한 오류를 던집니다.

각 Provider는 안정적인 외부 Store 컨테이너를 소유합니다. Context 값을 바꾸지 않고 선택된 구독자에게만 스냅샷을 알립니다.

Kerros는 React `^17`, `^18`, `^19`를 지원하며 `use-sync-external-store/shim/with-selector`를 사용합니다.
