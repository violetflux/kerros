# 介绍

Kerros 是 React Hook、Context 所有权和外部 Store 精确订阅之间的一座小桥。

状态仍然写成普通 Hook：

```tsx
function useCounterStore() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}
```

Kerros 把它变成有明确作用域的 Store：

```tsx
const [useCounter, CounterProvider] = createStore(useCounterStore)
```

Provider 决定 **Store 存在于哪里**，selector 决定 **组件观察哪些变化**。

## 它解决什么问题

React Context 很适合表达所有权和依赖注入，但变化的 Context value 会让全部消费者失效。模块级外部 Store 可以精确订阅，却默认是全局的，而且经常要求应用接受另一套状态模型。

Kerros 让两类边界都保持显式：

| 关注点 | Kerros 的选择 |
| --- | --- |
| 状态模型 | 普通 React Hook |
| 所有权 | Provider 的挂载位置 |
| 更新机制 | `useSyncExternalStore` 订阅 |
| 重渲染 | 对象 selector + 顶层浅比较 |
| 多实例 | 多次挂载 Provider |
| 跨 Store 数据 | 单向 Provider 嵌套 |

Context 只传递稳定订阅容器，不传递持续变化的 Store 快照。Store Hook 只发布已经提交的快照，每个组件订阅自己的 selector 投影。

## 适用场景

Kerros 适合以下状态：

- 天然属于路由、工作区、编辑器、会话或某个功能子树
- Store 内部需要直接使用 React Hook 或 SDK Hook
- 组件需要精确订阅，又不希望形成巨大的全局重渲染域
- 需要通过 Provider props 初始化或配置 Store 实例
- 测试需要创建相互隔离的 Store，而不是重置全局单例

只有一个小组件树使用的状态继续留在局部。远程数据缓存优先使用框架或请求库提供的缓存。如果状态必须完全脱离 React 存在，则更适合独立外部 Store。

## 一条架构规则

跨 Store 依赖必须保持单向。如果 Store B 读取 Store A，就把 A 的 Provider 挂在 B 外面，而且不要让 A 反向读取 B。这样 Provider 顺序始终清楚，也不会形成循环所有权。

接下来阅读[开始使用](./getting-started)或[Store 组合](./composition)。
