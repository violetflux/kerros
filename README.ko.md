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

Kerros는 React 상태를 Hook 안과 Provider 아래라는 자연스러운 위치에 둡니다. 기본 자동 속성 추적이 불필요한 렌더링을 막고, 명시적 selector는 파생 값과 측정된 핫스팟에 사용할 수 있습니다.

- Store는 평범한 React Hook
- `useStore()`는 읽은 속성을 자동으로 추적
- 명시적 selector는 고급 최적화에 사용
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

function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

export const [useCounter, CounterProvider] = createStore(useCounterModel)
```

Store Hook 안에서 `useState`, `useReducer`, Context, SDK Hook, 사용자 Hook을 그대로 사용할 수 있습니다.

initializer는 `useCounterModel`처럼 모듈 최상위의 이름 있는 Hook으로 정의하세요. 익명 initializer도 런타임에서는 동작하지만 React Compiler의 `infer` 모드에서는 Hook으로 자동 컴파일되지 않습니다.

## Provider를 마운트하고 값 읽기

```tsx
function Counter() {
  const { count, setCount } = useCounter()

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return <CounterProvider><Counter /></CounterProvider>
}
```

Kerros는 렌더링 중 읽은 속성을 추적합니다. 읽지 않은 필드가 바뀌어도 `Counter`는 다시 렌더링되지 않으며 전체 Store를 깊게 비교하지 않습니다.

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
  useModel: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>, StoreGetter<TStore>]

const [useStream, StreamProvider] = bindStore<Stream>('Stream')
```

반환된 Store Hook은 인자 없이 자동 추적을 사용합니다. 명시적 객체 selector는 파생 값과 측정된 핫스팟을 위한 고급 경로입니다. Provider 밖에서 호출하면 명확한 오류가 발생합니다.

세 번째 getter는 React 밖에서 마지막으로 커밋된 Provider를 읽습니다. Provider의 `scope?: string | number | symbol`을 전달하면 정확히 일치하는 최신 인스턴스를 선택합니다. getter는 구독하지 않으며 사용 가능한 Provider가 없으면 오류를 던집니다.

React Element와 Portal은 자동으로 원자 값이 됩니다. `useRef()`와 `createRef()`는 그대로 반환할 수 있으며 `ref(value)`는 Proxy 비호환 값이나 엄격한 동일성이 필요할 때만 사용합니다.

고급 통합이 필요한 기존 Headless External Store에만 `bindStore`를 사용하세요. 일반 Hook 상태에는 `createStore`를 사용합니다. Context는 원래 Store 인스턴스만 보관하고 소비자는 `getSnapshot`과 `subscribe`를 직접 사용합니다.

## 문서

- [소개](https://violetflux.github.io/kerros/ko/guide/introduction)
- [시작하기](https://violetflux.github.io/kerros/ko/guide/getting-started)
- [Selector](https://violetflux.github.io/kerros/ko/guide/selectors)
- [Store 조합](https://violetflux.github.io/kerros/ko/guide/composition)
- [API](https://violetflux.github.io/kerros/ko/api/)

[MIT License](https://github.com/violetflux/kerros/blob/main/LICENSE)
