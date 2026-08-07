# Kerros 自动追踪性能优化设计

## 状态

已于 2026-08-08 实现，运行时改动见提交 `0d24e52`。

## 目标

在不改变公共 API、不可变 snapshot 语义、`bindStore` 生命周期边界和并发渲染正确性的前提下，降低默认自动追踪在“宽对象 × 大量消费者”场景中的首次挂载成本，并用可复现基准验证收益。

## 根因

优化前，Kerros 调用 `proxy-compare.createProxy(snapshot, affected, proxyCache)` 时没有传入 `targetCache`。`proxy-compare` 因而会在每个 Hook 消费者首次包装同一个 snapshot 时重复读取全部属性描述符，以判断代理目标是否需要复制。

在 1000 个顶层字段、1000 个消费者的单变量微基准中：

- 不传 `targetCache`：中位数 311.64ms
- 共享 `targetCache`：中位数 0.72ms

这也解释了优化前跨库基准中 Kerros 默认追踪在 1000 条不同访问路径下挂载约 87ms，而只有一个字段的广播场景挂载约 5ms：成本随 snapshot 宽度和消费者数量相乘增长。

## 参考实现结论

### Valtio

Valtio 2.3.2 在模块级维护 `targetCache: WeakMap`，并将其作为 `createProxy` 的第四个参数。缓存只保存 snapshot 到安全代理目标的转换，不保存组件访问路径，因此可以跨 Hook 共享。

Valtio 还会在同一个 Hook 生命周期中复用 `affected`。Kerros 不采用这一点：Kerros 继续为每次 render 创建独立访问集合，并只在提交后替换已提交集合，以避免 Strict Mode、Suspense 和被放弃的并发 render 污染有效依赖。

### MobX

MobX 为每个 observable 属性建立 Atom/Reaction 依赖边。字段写入时，它已经知道变化来源，只调度依赖该字段的 Reaction，因此稀疏更新明显快于基于完整 immutable snapshot 的 Kerros 和 Valtio。

Kerros 的 `bindStore` 只接收 `subscribe/getSnapshot`，发布时不知道具体变化路径。照搬 MobX 需要新的变更协议、中央依赖图或全 snapshot diff，会扩大 API 和生命周期职责，不属于本轮无损优化。

## 实现设计

### 运行时

- 在追踪模块中增加模块级 `WeakMap<object, unknown>` 目标缓存。
- 自动追踪路径调用 `createProxy` 时传入该缓存。
- 每个 Hook 仍独立维护 `affected` 和 `proxyCache`。
- 显式 Selector、`tracking: false`、基础类型、类实例、Map 和 Set 的路径不变。
- 保持提交后访问集合校准语义，并在 snapshot 引用相同时跳过无效比较缓存分配。

模块级缓存使用 WeakMap，不持有 snapshot 强引用；相同 snapshot 的描述符检查只执行一次，不同 snapshot 仍分别校验。

### 测试

- 增加回归测试，证明同一 snapshot 被多个消费者代理时只检查一次目标。
- 保留并运行现有自动追踪生命周期测试，重点覆盖 Strict Mode、条件访问、Provider Store 切换和 React 19 被放弃 render。
- 验证循环对象、Getter、数组、属性枚举、类实例、Map 和 Set 行为没有变化。

### 基准

- 使用生产 Kerros API，不以简化版 Hook 代替运行库。
- 记录 5 次中位数、挂载时间、更新均值和渲染次数。
- 临时复测 Kerros 默认追踪、Kerros Selector、Zustand、Valtio 和 MobX；依赖使用 pnpm 安装和锁定。
- 所有方案以相同渲染次数为有效性前提；Valtio 使用同步订阅选项，避免异步批处理干扰结果。

## 最终结果

1000 个消费者下的 5 次中位数如下：

| 场景 | Kerros Tracking | Valtio | MobX |
| --- | ---: | ---: | ---: |
| 1000 字段稀疏挂载 | 7.11ms | 6.86ms | 6.87ms |
| 1000 字段稀疏更新 | 0.857ms | 1.604ms | 0.091ms |
| 单字段全量更新 | 4.013ms | 4.276ms | 3.291ms |

Kerros 默认追踪的极端挂载从优化前约 87.18ms 降至 7.11ms，降低约 92%，并与 Valtio、MobX 的挂载时间进入同一档位。MobX 在稀疏更新中仍有属性级依赖图优势。

## 后续决策

共享 `targetCache` 已消除主要挂载异常，本轮停止，不增加低收益复杂度。

如果后续更新路径成为主要瓶颈，再单独设计中央订阅路由或带变更元数据的可选 Store 协议。该方案需要重新验证 `createStore`、`bindStore`、SSR 和 React 并发生命周期，不与本次缓存修复捆绑。

## 验收结果

- 公共 API 和类型声明无变化。
- 运行库测试、类型检查、Lint 和构建通过。
- React 17、18、19 兼容 CI 通过。
- 1000 字段 × 1000 消费者的默认追踪挂载时间不再随重复目标描述符扫描呈乘法增长。
- 现有正确性测试无回退。
- 临时压测目录和生成文件已清理。
