# API 레퍼런스

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useModel: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

```tsx
function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterModel)
```

입력 Hook은 React Hooks를 사용할 수 있으며 Provider의 `children`을 제외한 모든 props를 받습니다.

`useXxxModel` 같은 이름의 모듈 최상위 함수로 정의하세요. 익명 initializer도 런타임에서는 유효하지만 React Compiler의 `infer` 모드에서는 Hook으로 자동 인식되거나 컴파일되지 않습니다.

반환된 Store Hook은 인자 없이 자동 속성 추적을 사용합니다. 명시적 객체 selector는 파생 값과 측정된 핫스팟을 위한 고급 경로이며 최상위 필드를 얕게 비교합니다. Provider 밖에서는 명확한 오류를 던집니다.

각 Provider는 안정적인 외부 Store 컨테이너를 소유합니다. Context 값을 바꾸지 않고 선택된 구독자에게만 스냅샷을 알립니다.

## `ref(value)`

`ref<T extends object>(value: T): T`는 동일성에 민감한 객체를 원자 값으로 표시하고 정확히 같은 객체를 반환합니다. React Element와 Portal은 이미 자동으로 원자 처리되며 표준 `useRef()`와 `createRef()` 컨테이너에는 `ref()`가 필요하지 않습니다. 내부 변경은 반응형이 아닙니다.

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

Context에는 원래 Store 인스턴스만 저장되고 첫 번째 Hook은 기본적으로 자동 추적을 사용합니다. `useStreamInstance`는 명령형 읽기 전용이며 스냅샷을 구독하지 않습니다. 렌더링 상태에는 첫 번째 Hook을 사용하세요.

Kerros는 React `^17`, `^18`, `^19`를 지원하며 `use-sync-external-store/shim/with-selector`를 사용합니다.
