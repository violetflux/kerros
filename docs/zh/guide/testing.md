# 测试

Kerros Provider 就是普通 React 组件。每个测试挂载一个新的 Provider，状态自然相互隔离。

## 测试消费者

```tsx
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

test('increments', async () => {
  const user = userEvent.setup()
  render(<CounterProvider><Counter /></CounterProvider>)

  await user.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('1')
})
```

测试之间没有需要重置的全局 Store。

## 验证订阅隔离

只有在订阅行为本身就是测试目标时才统计渲染次数。修改一个未选择字段，然后断言选中消费者没有再次渲染。

```tsx
const selected = useExample(s => ({
  value: s.value,
  setIgnored: s.setIgnored,
}))
```

在 `value` 和 `setIgnored` 引用保持不变时，调用 `setIgnored` 不应让组件重渲染。

## 测试 Provider props

先使用初始 props 渲染 Provider，再使用新 props rerender。消费者应该读取提交后的更新，而且不会短暂看到其他 Provider 实例的快照。

## 运行时覆盖

可复用 Store 包建议覆盖：

- 在对应 Provider 外调用
- Provider props 初始化与更新
- 消费者卸载后的取消订阅
- React Strict Mode
- 服务端渲染
- 嵌套的单向 Store 依赖
- selector 结果不变时避免重渲染

Kerros 会在 React 17、React 18 和 React 19 上运行同一套测试。
