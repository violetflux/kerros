# hox에서 마이그레이션

생성 함수를 `createStore`로 교체하고 각 컴포넌트가 필요한 필드만 선택하도록 변경합니다.

```tsx
const { count, setCount } = useCounter(s => ({
  count: s.count,
  setCount: s.setCount,
}))
```

Kerros는 호환용 export나 집계된 `store` 필드를 제공하지 않습니다. 큰 global store는 도메인 Store로 나누고 의존 순서대로 Provider를 중첩하세요.

`useEffectEvent`는 액션 안정화 API가 아닙니다. Effect 내부에서 호출되는 이벤트에만 사용하고 공개 액션은 일반 함수로 유지하세요.
