# 소개

Kerros는 React Hook, Context 소유권, 외부 Store의 정밀 구독을 연결하는 작은 라이브러리입니다.

상태는 평범한 Hook으로 작성합니다.

```tsx
function useCounterStore() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterStore)
```

Provider는 **Store가 존재하는 범위**를 정하고 selector는 **컴포넌트가 관찰할 변경**을 정합니다.

## 해결하는 문제

React Context는 소유권과 의존성 주입에 적합하지만 Context value가 바뀌면 모든 consumer가 무효화됩니다. 모듈 수준 외부 Store는 정밀 구독을 제공하지만 기본적으로 전역이며 별도의 상태 모델을 도입하는 경우가 많습니다.

Kerros는 두 경계를 모두 명시적으로 유지합니다.

| 관심사 | Kerros |
| --- | --- |
| 상태 모델 | 평범한 React Hook |
| 소유권 | Provider 위치 |
| 업데이트 | `useSyncExternalStore` 구독 |
| 재렌더링 | 객체 selector의 최상위 얕은 비교 |
| 여러 인스턴스 | Provider를 여러 번 마운트 |
| Store 간 데이터 | 단방향 Provider 중첩 |

Context는 변경되는 스냅샷 대신 안정적인 구독 컨테이너만 전달합니다. Store Hook은 커밋된 스냅샷을 게시하고 각 컴포넌트는 selector 결과만 구독합니다.

## 적합한 경우

- route, workspace, editor, session, 기능 하위 트리에 속한 상태
- Store 안에서 React Hook 또는 SDK Hook을 사용해야 하는 경우
- 거대한 전역 재렌더 영역 없이 정밀 구독이 필요한 경우
- Provider props로 Store를 초기화해야 하는 경우
- 테스트마다 Store 인스턴스를 격리해야 하는 경우

Store 의존성은 단방향이어야 합니다. B가 A를 읽으면 A의 Provider를 바깥에 두고 A가 다시 B를 읽지 않게 하세요.

다음으로 [시작하기](./getting-started) 또는 [Store 조합](./composition)을 읽어보세요.
