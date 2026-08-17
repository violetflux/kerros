# Kerros 项目协作指南

## 项目上下文

Kerros（npm 包 `@violetflux/kerros`）是面向 React 的轻量状态共享方案。核心命题是：**你怎么写 custom Hook，就可以怎么写 Store。** 当局部 Hook 状态需要跨组件共享时，用 `createStore` 提升它；Provider 决定共享范围，自动访问追踪决定组件订阅什么。

本仓库同时维护：

- Kerros 运行时与类型，位于 `src/`；
- `@violetflux/eslint-plugin-kerros`，位于 `packages/eslint-plugin-kerros/`；
- Rspress 官网与七语言文档，位于 `docs/`、`theme/` 和 `rspress.config.ts`；
- 面向 Coding Agent 的 Kerros Skill，位于 `skills/kerros/`；
- runtime、SSR、Strict Mode、tracking、React 兼容性及 ESLint 的测试和 benchmark。

`package.json`、源码、测试和构建输出是版本、兼容性、API 与行为声明的事实来源。`README.zh-CN.md` 与 `docs/zh/` 是中文产品表达的主要参考；英文文档是多语言路由结构的真源。官网内容和视觉建议不能覆盖仓库事实。

## 产品边界

- 把 Kerros 表述为“Hook-native 状态共享”，不是新的全局状态管理 DSL。
- 不宣称全量替代 Redux、Zustand 等状态管理方案。
- 不规定数据结构、异步方案或全局数据流，也不为营销新增运行时 API。
- 不承诺所有场景都比 selector 快。性能结论必须带 fixture、环境、更新类型和限制。
- 默认示例必须是 selector-free 的 `useStore()` 自动追踪；selector 只用于派生值或测量后的热点。

## Kerros 实现规则

- React Hook 拥有状态时默认使用 `createStore`；只有已有权威 headless External Store 且提供稳定 `getSnapshot` / `subscribe` 时才使用 `bindStore`。
- `createStore` initializer 使用同文件模块顶层、以 `useXxxModel` 命名的 Hook，以兼容 React Compiler `infer`。
- Provider 明确共享范围和实例生命周期；消费者必须位于匹配 Provider 内。Store 依赖保持单向，并按依赖顺序挂载 Provider。
- Store 与 External Store 快照保持不可变；每次可观察变化发布新引用。
- selector-free 结果是当前渲染链的只读追踪快照。不要修改它，或把它保存到 state、ref、模块变量、长期缓存中作为实时源。
- 展开、rest、枚举和序列化会形成宽泛订阅。`Map`、`Set` 和类实例按整体引用处理；`ref()` 只用于身份逃生。
- Demo 不得暗示 Kerros 对完整 Store 做深比较。
- 修改 Kerros 用法、ESLint 约束或 Agent 指令时，同时检查 `README*`、`docs/*`、`skills/kerros/`、相关测试和 `scripts/check-docs.ts`，避免心智漂移。

## 官网与设计规则

- 官网由 Rspress 构建。优先复用 `docs/public/` 品牌资产、自定义主题和既有语言路由，不另起站点技术栈。
- 首页为极简安装导向单屏（见 design.md §13.4）：核心命题 + 安装方式切换 + 文档 / GitHub 入口。多段叙事、三步代码和页脚不在首页渲染，内容保留在 `theme/home-content.ts` 供后续复用。
- 五项能力按用户结果组织：Hook 原生共享、Provider 作用域与多实例、精细订阅、External Store 接入、工程护栏。每项说明触发、输入、输出和成功结果。
- 代码示例与核心命题是视觉主角；抽象营销图不能压过用法。已经停止用 AI 生图决定官网样式，除非用户重新明确启用。
- BeUI Motion 是官网动效组件候选基础。实现前必须读取其官方文档，确认包名、许可、React/Rspress 兼容性、导入方式和可用组件；确认前不要提交猜测的 API 或依赖。已核实 MIT、手动复制源码接入，详见 design.md §13。
- 动效必须服务内容层级，支持键盘焦点和 `prefers-reduced-motion`。桌面双栏在窄屏改为单栏。
- 复制、搜索和 Demo 要定义成功、loading、empty、error 与 retry；颜色不能是唯一状态信号。
- 完整设计约束见 `design.md`。

## 多语言与事实维护

- 当前语言路由为 `en`、`zh`、`ja`、`ko`、`de`、`fr`、`es`。新增或删除页面时保持七语言路由同构。
- 英文路径结构是路由真源；中文可先用于内容定稿，但进入发布的产品命题、边界与代码示例必须同步到全部语言。
- 版本、规则数量、React 兼容范围、benchmark 数字、包体和发布状态均为易变事实。发布前从 `package.json`、源码、构建、registry 或对应 benchmark 结果重新校验。
- README 负责仓库入口、安装和紧凑上手；官网负责理解路径、深入指南、证据和可发现性。不要在首页复制完整 README。

## 工作方式

1. 先阅读与任务直接相关的源码、测试、文档与配置，区分仓库事实和设计建议。
2. 只修改任务需要的文件，保留用户已有改动和 `.scatter/` 等工具工作区。
3. 先更新源语言和共享组件，再同步其他语言；避免只修一个 locale 后留下结构或概念漂移。
4. API 或行为变更先补测试，再更新实现与文档。官网视觉改动需要同时验证真实页面，不以静态图或“构建成功”代替视觉验收。
5. 引入依赖前核对官方文档、许可、包体与兼容性；不要根据组件展示页猜测安装方式。
6. 发布相关改动记录证据、人工验收结果和可回滚的上一版静态构建。

## 验证命令

按改动范围先运行最小验证，提交或发布前运行完整门禁：

```sh
# 文档默认用法与七语言路由一致性
bun run docs:check

# 官网生产构建
bun run docs:build

# 代码质量、lint、类型、测试、构建和文档全量门禁
bun run check
```

针对性命令：

```sh
bun run lint
bun run typecheck
bun run test
bun run test:benchmarks
bun run benchmark:tracking
bun run benchmark:eslint
```

benchmark 不是普通改动的默认门禁。只有更新性能声明或相关实现时运行对应 profile，并保存环境、命令、原始结果与限制。

官网人工验收至少覆盖：桌面和窄屏、键盘导航、可见焦点、颜色对比度、复制反馈、语言切换、站内与外链、`prefers-reduced-motion`，以及 loading / empty / error / retry。发布前再核对 npm、GitHub、Changelog 与官网事实一致。

## Git 约定

- 基于当前分支工作，不改写历史，不擅自 push，不使用 `--no-verify`。
- 不覆盖或提交无关的 staged、dirty 或 untracked 文件；提交前检查 `git status`、staged diff 与 `git diff --check`。
- 一个提交只包含一个可说明的结果。提交信息使用 `<type>: <中文说明>`，例如 `docs: 补充官网设计与协作指南`。
- 常用类型：`feat`、`fix`、`refactor`、`perf`、`test`、`docs`、`build`、`ci`、`style`、`chore`、`revert`。
- 正常运行 hooks。若 hook 暴露无关问题，不扩大修改范围；保留未提交改动并明确报告。
