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

## 고급 통합: `bindStore`

일반적으로는 `createStore`를 사용합니다. 기존 Headless External Store가 안정적인 `getSnapshot`과 `subscribe`를 제공할 때만 `bindStore`로 스냅샷을 복사하지 않고 직접 바인딩합니다.

```tsx
const [
  useStream,
  StreamProvider,
  useStreamInstance,
] = bindStore<Stream>('Stream')

<StreamProvider store={stream}>
  <App />
</StreamProvider>
```

Context에는 원래 Store 인스턴스만 저장되고 첫 번째 Hook은 selector로 직접 구독합니다. 세 번째 `useStreamInstance`는 고급 명령형 통합을 위해 원래 인스턴스를 반환하지만 스냅샷을 구독하지 않습니다. 상태 렌더링에는 항상 selector Hook을 사용하세요. Store의 생성, 시작, 중지, 해제는 인스턴스를 만든 소유자가 관리합니다.

Kerros는 React `^17`, `^18`, `^19`를 지원하며 `use-sync-external-store/shim/with-selector`를 사용합니다.
