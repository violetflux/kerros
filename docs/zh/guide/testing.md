# 测试

Kerros Provider 是普通 React 组件。测试时直接渲染一个新的 Provider，每个用例都会得到独立状态，不需要手动重置全局 Store。

下面使用 Vitest 和 Testing Library 测试一个计数器。

## 准备测试组件

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)

  return { count, setCount }
})

function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

## 测试组件更新

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

test('点击后增加计数', async () => {
  const user = userEvent.setup()

  render(
    <CounterProvider>
      <Counter />
    </CounterProvider>,
  )

  await user.click(screen.getByRole('button'))

  expect(screen.getByRole('button')).toHaveTextContent('1')
})
```

下一个测试重新渲染 `CounterProvider` 时，`count` 会重新从 `0` 开始。

## 测试 Provider props

Provider props 会传给 Store Hook，可以通过 `rerender` 验证 props 更新：

```tsx
interface GreetingProps {
  name: string
}

const [useGreeting, GreetingProvider] = createStore(
  ({ name }: GreetingProps) => ({ message: `你好，${name}` }),
)

function Greeting() {
  const { message } = useGreeting(s => ({ message: s.message }))
  return <p>{message}</p>
}

test('Provider props 更新后发布新值', () => {
  const view = render(
    <GreetingProvider name="Violet">
      <Greeting />
    </GreetingProvider>,
  )

  expect(screen.getByText('你好，Violet')).toBeInTheDocument()

  view.rerender(
    <GreetingProvider name="Kerros">
      <Greeting />
    </GreetingProvider>,
  )

  expect(screen.getByText('你好，Kerros')).toBeInTheDocument()
})
```

## 测试 Provider 外调用

Store Hook 必须在对应 Provider 内使用。公共 Store 包最好固定测试这个错误边界：

```tsx
function Consumer() {
  useCounter(s => ({ count: s.count }))
  return null
}

expect(() => render(<Consumer />)).toThrow(
  'Kerros store hook must be used within its matching Provider',
)
```

## 测试 selector 隔离

只有在订阅行为本身是测试目标时，才需要统计渲染次数。创建两个字段，让组件只订阅其中一个，然后更新另一个字段：

```tsx
const [useExample, ExampleProvider] = createStore(() => {
  const [selected, setSelected] = useState(0)
  const [ignored, setIgnored] = useState(0)

  return { selected, setSelected, ignored, setIgnored }
})
```

只要 selector 返回的顶层字段引用没有变化，未选择字段的更新就不应让消费者重新渲染。

如果你在维护一个基于 Kerros 的公共 Store 包，建议再覆盖 Strict Mode、消费者卸载、服务端渲染和多 Provider 实例。
