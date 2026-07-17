# 테스트

Kerros Provider는 평범한 React 컴포넌트입니다. 테스트마다 새 Provider를 마운트하면 상태가 자연스럽게 격리됩니다.

```tsx
test('increments', async () => {
  const user = userEvent.setup()
  render(<CounterProvider><Counter /></CounterProvider>)

  await user.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('1')
})
```

테스트 사이에 초기화할 전역 Store가 없습니다.

## 구독 격리 확인하기

구독 동작 자체가 테스트 대상일 때만 렌더 횟수를 세세요. 선택하지 않은 필드를 바꾸고 consumer가 다시 렌더링되지 않는지 확인합니다.

```tsx
const selected = useExample(s => ({
  value: s.value,
  setIgnored: s.setIgnored,
}))
```

`value`와 `setIgnored` 참조가 유지되면 다른 필드의 업데이트는 컴포넌트를 다시 렌더링하지 않습니다.

재사용 가능한 Store 패키지는 다음을 테스트해야 합니다.

- 대응하는 Provider 밖에서의 사용
- Provider props 초기화와 업데이트
- consumer unmount 후 구독 해제
- React Strict Mode
- 서버 렌더링
- 단방향 Store 의존성
- selector 결과가 같을 때 렌더 억제

Kerros는 React 17, 18, 19에서 같은 테스트 스위트를 실행합니다.
