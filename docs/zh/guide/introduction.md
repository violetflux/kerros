# 介绍

Kerros 是一个在 React 组件间共享状态的轻量方案。

它不要求你学习新的状态语法。你怎么写 React Hook，就可以怎么写 Store；只有当一段局部状态需要被多个组件使用时，再用 `createStore` 把它共享出去。

## 为什么要用 Kerros？

- **直接复用已有的 React 知识**：几乎没有学习成本，你怎么写 custom Hook，就可以怎么写 Store
- **为灵活重构而设计**：Store 和组件使用同一套 Hook API，可以近乎零成本地把组件局部状态转换成组件间共享状态
- **同时支持局部状态和全局状态**：Provider 决定 Store 的作用域，在灵活和简单之间取得平衡
- **优秀的性能和 TypeScript 支持**：selector 精确订阅，选择结果不变的组件不会重渲染，Store 类型可以自动推断

## 从状态管理到状态共享

不妨回想一下 Redux、Zustand、Recoil 这些状态管理库。它们虽然也可以解决数据共享问题，但最本质的能力仍然是组织数据、操作数据和约束数据流，因此它们应该被称为“状态管理”工具。

Kerros 想解决的不是如何设计数据流，不是如何管理异步，也不是如何把所有状态装进一个全局容器。Kerros 只聚焦一个痛点：**在多个 React 组件间共享状态。**

层层传递 `value`、`onChange` 会逐渐破坏组件边界；粗暴地把数据全部塞进一个全局 Store，也不会自动让应用获得更好的扩展性和可维护性。

如果你需要的是一个简单、轻量、可靠的状态共享方案，而不是另一套状态管理 DSL，那么 Kerros 或许正适合你的项目。

## 它是怎么工作的？

把普通 Hook 状态直接写进 `createStore`：

```tsx
const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

Provider 决定这段状态共享到哪里：

```tsx
<CounterProvider>
  <Counter />
</CounterProvider>
```

selector 决定组件订阅什么：

```tsx
const { count, setCount } = useCounter(s => ({
  count: s.count,
  setCount: s.setCount,
}))
```

这就是 Kerros 的全部核心概念。接下来阅读[快速上手](./getting-started)，从一个完整的任务 Store 开始使用。
