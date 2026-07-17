# Selector

모든 Kerros 소비자는 객체를 명시적으로 선택합니다.

```tsx
const { name, save } = useSettings(s => ({
  name: s.profile.name,
  save: s.save,
}))
```

`s.profile.name` 같은 중첩 읽기도 사용할 수 있습니다. 선택한 최상위 값이 `Object.is` 기준으로 변경될 때만 컴포넌트가 다시 렌더링됩니다.

selector가 매번 새 객체를 반환해도 필드의 동일성이 유지되면 얕은 비교 결과는 같습니다. 모든 필드가 필요한 경우가 아니라면 Store 전체를 선택하지 마세요.

액션은 일반 React 값입니다. React Compiler를 사용하지 않는다면 동일성이 중요한 곳에서 일반적인 memo 도구를 사용할 수 있습니다.
