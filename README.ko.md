<p align="center">
  <a href="https://violetflux.github.io/kerros/ko/"><img src="https://raw.githubusercontent.com/violetflux/kerros/main/docs/public/banner.svg" alt="Kerros" width="100%" /></a>
</p>

<p align="center">
  <a href="https://github.com/violetflux/kerros/blob/main/README.md">English</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.zh-CN.md">简体中文</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ja.md">日本語</a> ·
  한국어 ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.de.md">Deutsch</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.fr.md">Français</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.es.md">Español</a>
</p>

Kerros는 React 상태를 Hook 안과 Provider 아래라는 자연스러운 위치에 둡니다. reducer, action, proxy, 전역 singleton을 도입하지 않고 selector 기반의 정밀 구독을 제공합니다.

- Store는 평범한 React Hook
- selector는 필요한 값만 객체로 반환
- 선택 객체의 최상위 필드를 `Object.is`로 얕게 비교
- Provider마다 격리된 Store 인스턴스
- 단방향 의존성을 통한 Store 조합
- React 17, 18, 19 지원

> [!TIP]
> **Coding Agent로 설치**: 아래 문장을 사용 중인 Coding Agent에 붙여넣으면 의존성과 프로젝트 Skill을 함께 설치합니다.

```text
현재 프로젝트의 패키지 매니저로 @violetflux/kerros를 설치한 다음 npx skills add violetflux/kerros --skill kerros --agent '*' -y를 실행해 호환되는 모든 Coding Agent에 Kerros Skill을 설치하세요.
```

## Store 만들기

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

Store Hook 안에서 `useState`, `useReducer`, Context, SDK Hook, 사용자 Hook을 그대로 사용할 수 있습니다.

## Provider를 마운트하고 필요한 값 선택하기

```tsx
function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return <CounterProvider><Counter /></CounterProvider>
}
```

selector는 인라인으로 작성할 수 있습니다. 선택하지 않은 필드가 바뀌어도 `Counter`는 다시 렌더링되지 않습니다.

## 설치

| 패키지 매니저 | 명령 |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

## 작동 방식

Provider는 Store Hook을 실행하고 Context에는 안정적인 구독 컨테이너만 전달합니다. 커밋된 스냅샷은 `subscribe/getSnapshot`으로 게시되며 컴포넌트는 선택 결과가 바뀔 때만 다시 렌더링됩니다.

숨겨진 모듈 singleton이 없으므로 같은 Provider를 여러 번 마운트하고, props로 초기화하고, 테스트에서 격리하거나 특정 하위 트리에만 범위를 지정할 수 있습니다.

## API

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

반환된 Store Hook에는 객체를 반환하는 selector가 필요합니다. 대응하는 Provider 밖에서 호출하면 명확한 오류가 발생합니다. Strict Mode와 서버 렌더링을 지원합니다.

## 문서

- [소개](https://violetflux.github.io/kerros/ko/guide/introduction)
- [시작하기](https://violetflux.github.io/kerros/ko/guide/getting-started)
- [Selector](https://violetflux.github.io/kerros/ko/guide/selectors)
- [Store 조합](https://violetflux.github.io/kerros/ko/guide/composition)
- [API](https://violetflux.github.io/kerros/ko/api/)

[MIT License](https://github.com/violetflux/kerros/blob/main/LICENSE)
