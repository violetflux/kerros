# 从 hox 迁移

替换创建函数：

```tsx
// 迁移前
export const [useCounter, CounterProvider] = createGlobalStore(useCounterValue)

// 迁移后
export const [useCounter, CounterProvider] = createStore(useCounterValue)
```

然后让每个消费者只选择需要的字段：

```tsx
const { count, setCount } = useCounter(s => ({
  count: s.count,
  setCount: s.setCount,
}))
```

Kerros 不提供兼容出口，也不提供聚合的 `store` 字段。大型 global store 应拆成领域 Store，再按照依赖顺序嵌套 Provider。

`useEffectEvent` 不是动作稳定工具，只应由 Effect 内部事件使用。Store 公开动作保持普通函数，由 React Compiler 或常规 React memo 能力负责稳定。
