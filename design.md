# Kerros 官网设计纲要

## 1. 设计目标

Kerros 官网要让熟悉 React 的开发者在首屏回答三个问题：

1. **它是什么？** 面向 React 的 Hook-native 状态共享方案。
2. **它为什么不同？** 不引入新的状态 DSL；Provider 决定共享范围，自动访问追踪缩小订阅。
3. **下一步怎么试？** 看懂三步代码并复制安装命令，在五分钟内完成最小 Store。

核心命题是：**你怎么写 custom Hook，就可以怎么写 Store。** 官网不是把 README 放大，也不是用抽象视觉包装一个“全局状态管理库”。它负责建立从理解、验证到采用的最短路径。

## 2. 受众与采用窗口

核心受众包括：

- 熟悉 custom Hook、Context 和 TypeScript 的 React 开发者；
- 维护大型组件树、需要明确模块边界的前端团队和库作者；
- 需要把 headless Store 或 SDK 权威状态接入 React 的集成开发者。

采用通常发生在以下情境：兄弟组件或深层后代开始共用局部状态；多个实例需要隔离；props 层层传递侵蚀组件边界；变化频繁的 Context 引发无关重渲染；全局 Store 对当前问题过重。

## 3. 产品表达

### 语气

- 开发者对开发者：具体、克制、可验证。
- 先展示正确代码，再解释机制；优先说结果和边界，避免营销形容词堆叠。
- 把“状态共享”与“状态管理”区分清楚，但不贬低 Redux、Zustand 或 Context。
- 所有性能、兼容性与数量声明附带仓库或构建证据，并标明易变性。

### 禁用承诺

- “替代所有状态管理库”或同义表达；
- “零重渲染”“永远更快”“所有场景不需要 selector”；
- 没有 fixture 和环境的 benchmark 倍数；
- 未由源码、测试、构建或 registry 验证的版本、规则数量、包体和兼容性；
- 暗示自动追踪会深比较整个 Store。

## 4. 信息架构

一级表面按用户阶段组织，而不是按仓库目录组织：

| 表面 | 用户问题 | 主要内容 |
| --- | --- | --- |
| 主页 | 这是什么，适合我吗？ | 定位、三步体验、能力、边界、证据、CTA |
| 指南 | 如何正确开始并扩展？ | 介绍、快速上手、自动追踪与 selector、组合、测试、迁移 |
| API | 精确签名和类型行为是什么？ | `createStore`、`bindStore`、`ref`、类型与错误行为 |
| 工程护栏 | 团队和 Agent 如何保持正确用法？ | ESLint 配置、规则索引、Kerros Skill |
| 证据 | 性能与兼容性声明可靠吗？ | benchmark 方法、环境、结果、限制、更新日期 |
| 项目入口 | 在哪里安装、反馈和看变化？ | npm、GitHub、Changelog、Issue |

导航标签应对应“理解 → 开始 → 深入 → 验证”，而不是塞满每个文档页。GitHub、npm 等外链提供清晰的外部打开提示。

## 5. 主页内容顺序

### 5.1 首屏：命题与可运行心智

桌面使用双栏：左侧是核心命题、边界说明和主 CTA；右侧是正确的 selector-free 三步代码。代码不是装饰，它必须同时出现：

1. 顶层命名的 `useXxxModel`；
2. `createStore(useXxxModel)` 返回 Hook 与 Provider；
3. Provider 内调用 `useXxx()` 并直接读取字段。

主 CTA 是“快速上手”，次 CTA 是“查看 GitHub”或“查看工作原理”。安装命令放在首屏可见范围内，但不压过产品命题；复制后给出明确的成功状态。

### 5.2 问题与差异

用一段短路径对比三种压力：props 传递、频繁 Context 更新、过重的全局 Store。结论回到 Kerros 的有限目标：只把一段 Hook 状态共享给需要它的组件。

不要制作虚假的逐项“胜负表”。适用边界必须与优势同屏可达。

### 5.3 五项能力

能力卡使用统一结构：目的、触发、输入、输出、成功结果。

| 能力 | 触发 | 输入 → 输出 | 成功结果 |
| --- | --- | --- | --- |
| Hook 原生共享 | 局部状态开始被多个组件使用 | `useXxxModel` → `useXxx` + `XxxProvider` | 保留 React Hook 心智，不新增状态 DSL |
| Provider 作用域与多实例 | 需要隔离实例或组合 Store | 挂载位置、props、依赖顺序 → 就近实例 | 状态不被迫全局化，依赖保持单向 |
| 自动访问追踪与可选 selector | 对象、数组、深层字段或测量后的热点 | 默认 `useStore()`，必要时对象 selector → 精细订阅 | 未读取字段更新不触发该组件重渲染 |
| External Store 接入 | 外部实例已持有权威快照 | 稳定 `getSnapshot` / `subscribe` + `bindStore` → React 绑定 | 原 Store 保持唯一所有者，不复制快照 |
| ESLint 与 Agent 护栏 | 团队协作、迁移或 AI 辅助编码 | ESLint 配置 + Kerros Skill → 诊断和约定 | 常见误用在提交前被发现 |

### 5.4 可信证据

证据区分“仓库当前事实”和“发布后持续承诺”。可展示 API、模块格式、React 矩阵、语言覆盖、测试类型和 ESLint 能力，但版本与数量在发布前动态校验。

benchmark 卡必须包含：测试场景、数据规模、更新是“无关路径”还是“命中观察路径”、运行环境、命令、结果日期和限制。首页只给结论摘要，完整方法链接到证据页。

### 5.5 转化与深入

末段提供两条清晰路径：

- 人工采用：复制包管理器命令，进入快速上手；
- Agent 采用：复制完整提示词，同时安装包与项目 Skill。

高级入口指向 selector、Store 组合、`bindStore`、迁移、API 和 benchmark，不在首页展开成长文。

## 6. 布局规则

### 桌面骨架

```text
┌────────────────── 顶部导航：Logo / 指南 / API / 护栏 / 证据 / 语言 / GitHub ──────────────────┐
│ 核心命题 + 边界 + CTA + 安装反馈             │ selector-free 三步代码                         │
├─────────────────────────────────────────────┴──────────────────────────────────────────────┤
│ 问题与差异：props / Context / 过重全局 Store → 有限的状态共享目标                              │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ 五项能力：响应式卡片网格，每卡均有触发、输入、输出、结果                                         │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ 可信证据摘要 + 适用边界 + benchmark 方法入口                                                    │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ 安装 CTA / Agent CTA / 高级文档入口                                                             │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 窄屏骨架

```text
导航（可展开）
核心命题
边界说明
主 / 次 CTA
安装与复制反馈
三步代码（横向滚动，不裁切）
问题与差异
能力卡 × 5（单列）
证据与边界
安装 / 深入 CTA
```

内容最大宽度保持稳定，正文行长以易读为准。首屏在窄屏不强求满屏高度，保证命题、CTA 和代码按自然顺序出现。标题层级连续，不为视觉尺寸跳过语义级别。

## 7. 组件语言

### 基础组件

- **CodeStage**：高对比等宽代码、复制反馈、可键盘切换的代码 tab；默认展示自动追踪，不把 selector 放在首个 tab。
- **CapabilityCard**：固定五字段的信息组件，不用模糊图标替代标题。
- **EvidenceCard**：声明、来源、环境/日期、限制、深入链接；易变数字必须可更新。
- **BoundaryCallout**：同时说明“适合”和“不负责”，使用文字与图标双重信号。
- **InstallPrompt**：包管理器命令与 Agent 提示词分开，复制成功可被辅助技术感知，失败时允许重试。
- **ExternalLink**：视觉与可访问名称都表明将离开站点。

### 视觉语义

- 保留 `docs/public/logo.svg`、紫蓝品牌色和现有 Rspress 明暗主题能力。
- 正文以高可读性和安静背景为主；高饱和品牌色用于操作、焦点和关键关系，不铺满长文。
- 代码是核心视觉资产。营销插画不能取代真实 API、Provider 作用域或订阅结果。
- 圆角、阴影和渐变用于分组与层级，不作为装饰密度目标。
- 颜色不是状态、能力差异或 benchmark 结论的唯一载体。

## 8. 动效与 BeUI Motion 决策

已停止用 AI 生图决定官网样式。除非用户重新明确启用，不生成新的静态风格方案，也不把历史图片作为实现基线。

BeUI Motion Components 是官网动效与可复用交互组件的候选基础，但当前只确认方向，不确认任何包名或 API。进入实现前必须从官方文档核对：

- 安装包与许可；
- React 版本和 Rspress/SSR 兼容性；
- 样式和组件导入方式；
- 可用于入场、切换、反馈或布局过渡的具体 Motion 组件；
- tree-shaking、hydration、客户端边界和包体影响。

核对后只引入能服务内容层级的最小集合。动效原则：短、可中断、不阻塞阅读；不通过连续漂浮或视差转移代码注意力；在 `prefers-reduced-motion: reduce` 下移除非必要位移和缩放，同时保留状态变化结果。

## 9. 交互状态与无障碍

| 交互 | 必备状态 |
| --- | --- |
| 复制安装命令 / Agent 提示词 | idle、success、error、retry；成功信息使用 `aria-live` |
| 代码 tab | selected、hover、focus-visible；支持键盘方向键或标准 tab 模式 |
| 搜索 | loading、results、empty、error、retry |
| 交互 Demo（后续） | initial、updating、unrelated update、observed update、error/reset |
| 外链 | 默认、hover、focus-visible，并在名称或图标说明外部打开 |

所有控件有可见焦点、足够触控目标和可访问名称。文本与背景满足 WCAG AA 对比度目标。动态结果不能只靠颜色或动画表达。Demo 的计数或渲染变化应提供文本结果，不依赖用户“看出”闪烁。

## 10. 多语言策略

- 路由结构以英文目录为真源，七种语言保持页面同构。
- 产品命题、三步代码、API 名称、边界和证据字段形成共享内容契约；翻译不能把默认用法改回 selector-first。
- 代码跨语言尽量保持一致，只翻译注释、可见文案和领域示例中的自然语言。
- 多语言入口不改变布局逻辑；较长德语、法语等文案必须在真实页面验证换行与控件宽度。
- 发布检查要搜索历史表述。非中英文 description 曾残留 selector-first 旧定位，已于 2026-08-16 统一修正为 Hook-native 状态共享口径（见 §13 决策记录）。

## 11. MVP、后续与非目标

### MVP

- 主页内容重构与阶段化导航；
- selector-free 三步代码；
- 五项能力、适用边界和可信证据摘要；
- 包管理器与 Agent 安装 CTA；
- 桌面/窄屏、键盘、焦点、复制、语言切换和错误恢复验证；
- 复用现有 Rspress、多语言结构与品牌资产。

### 后续

- 可操作的无关重渲染 Demo；
- 对比页和迁移故事；
- ESLint 规则浏览器；
- 带环境和更新类型的 benchmark 可视化；
- 经验证的案例。

### 非目标

- 不改造 Kerros 运行时来配合营销；
- 不宣称全量替代 Redux/Zustand；
- 不承诺 selector 或自动追踪在所有 fixture 中绝对更快；
- 不在本设计阶段发布站点或根据静态生图重做视觉。

## 12. 成功标准与发布门禁

首次访问者应能在首屏说清“是什么、与 Context/全局 Store 的差异、下一步怎么试”。熟悉 React 的开发者应能在五分钟内完成最小 Store；高级用户应能找到 selector、`bindStore`、使用边界和 benchmark。

实现验收：

- 主示例仍是 selector-free，且 `scripts/check-docs.ts` 能阻止回退；
- 每项能力都有触发、输入、输出和成功结果；
- 兼容性、性能和数量声明都有可追溯证据；
- CTA、复制、语言、键盘、窄屏、loading/error/retry 可验证；
- `bun run check` 通过；
- 发布前校验 npm、GitHub、Changelog、构建产物和官网事实；
- 保留上一版静态构建，导航、语言路由或关键 CTA 失败时可回滚。

发布后的可观测指标包括：文档到达率、安装复制率、快速上手完成率和主要跳失位置。指标用于发现理解障碍，不用来替代可用性验证。

## 13. 后续设计决策记录

进入实现前仍需确认但不阻塞内容架构的事项：

1. BeUI Motion 的官方安装、许可、兼容性与具体组件选型（**已全部核实并落地**，见下方决策记录 13.1 与 13.2）；
2. 交互式重渲染 Demo 的技术边界及如何准确区分无关/命中路径更新；
3. 证据页的数据来源、生成脚本和发布日期更新机制；
4. 案例来源及公开授权；
5. 七语言内容真源和翻译审阅责任人。

每项决策应记录日期、依据、影响范围、替代方案和回滚方式；未确认事项不得写成产品事实。

### 13.1 BeUI Motion 初步调研与本轮动效方案

- **日期**：2026-08-16
- **决策**：本轮不引入 BeUI Motion 源码、不引入 Tailwind；官网入场动效用纯 CSS 实现并尊重 `prefers-reduced-motion`。
- **依据**（调研结论）：
  - BeUI Motion（https://beui.dev/components/motion）是 shadcn 式源码复制分发，不是可安装的 npm 组件包；
  - 每个组件依赖 clsx、tailwind-merge、motion 与 Tailwind CSS v4，且组件带 "use client" 指令（Next.js 约定），接入 Rspress 需自行处理客户端边界；
  - 许可**未核实**：官网自称 free & open source，但未能定位其 GitHub 仓库与 LICENSE 文本；按 AGENTS.md 规则，许可核实前不得复制源码入库；
  - `motion@^13.1.0` 已在 devDependencies 但全仓库未使用，保留待后续决策；其 peer 仅 React 18/19（不影响官网构建——官网使用 React 19，但与 Kerros 库的 React 17 兼容承诺是两套上下文）。
- **影响范围**：theme/ 样式与动效实现、后续动效组件选型。
- **替代方案**：引入 Tailwind v4 + vendoring BeUI 源码（被否：双样式体系并存、许可风险）；直接使用已安装的 motion 包做最小动效（保留为后续选项）。
- **回滚方式**：本决策记录保留于此；后续若核实许可并确认收益，可在本节追加新决策覆盖本条。

### 13.2 启用 BeUI Motion（覆盖 13.1 结论）

- **日期**：2026-08-16
- **决策**：用户明确启用 BeUI Motion 重建官网首页视觉层。许可已核实为 **MIT**（仓库 github.com/starc007/ui-components，Copyright (c) 2026 Saurabh Chauhan）；最终仅采用其 Segmented 控件模式并手动适配到 `theme/components/segmented.tsx`（shadcn registry 分发，无 npm 包），配 Tailwind CSS v4 经 `@rsbuild/plugin-tailwindcss` 接入 Rspress。13.1 的“本轮不引入”结论作废。
- **依据**：许可核实完成，满足 AGENTS.md 源码入库前置条件；包管理器切换需要明确的单选语义、键盘导航和 reduced-motion 降级；Tailwind v4 preflight 对 Rspress 文档页排版的风险通过部分导入缓解（`tailwind.css` 仅导入 `tailwindcss/theme.css` 与 `tailwindcss/utilities.css`，完全跳过 `preflight.css`，缓解策略写入该文件注释）。未被最终单屏使用的 TextReveal、TextScramble 与 ExpandingArrowButton 不入库。
- **影响范围**：`theme/components/segmented.tsx`、`theme/lib/utils.ts`、根目录 `tailwind.css`、`rspress.config.ts`（globalStyles + builderConfig）、devDependencies（@rsbuild/plugin-tailwindcss、tailwindcss、motion、clsx、tailwind-merge）。
- **替代方案**：继续纯 CSS 动效（被否：用户明确启用 BeUI Motion）；只装 motion 包自行实现动效（被否：重复造轮子且缺少已验证的 reduced-motion 降级）。
- **回滚方式**：删除 `theme/components/segmented.tsx`、`theme/lib/utils.ts` 与 `tailwind.css`，从 `rspress.config.ts` 移除 `globalStyles` 与 `builderConfig`，还原 `theme/index.tsx` 与 `theme/styles.css` 至本决策前版本（git 历史可查），并移除上述五个 devDependencies。

### 13.3 首页定为极简安装导向首屏（覆盖 §5 多段主页顺序）

- **日期**：2026-08-16
- **决策**：用户连续否决两版设计后，将首页定为极简安装导向首屏：主标题 + 一行短 tagline → Segmented 控件切换包管理器（npm / pnpm / yarn / bun，以 `installCommands` 为准）→ 当前命令一键复制（成功/失败/重试，aria-live 播报）→ 查看文档与前往 GitHub 两个按钮；首屏之下仅保留三步代码示例。图标统一使用 Tabler Icons（`@tabler/icons-react`，已核实 npm 包名与 **MIT** 许可，以 devDependency 按需导入）。§5 中的多段主页顺序（story → 五能力 → 证据 → 边界 → 双 CTA）在首页渲染层作废。
- **依据**：用户原话明确不要“全是字”的长页面，只需安装方式切换 + 复制即走的首屏；长文案与能力/证据数据对安装转化无直接帮助，保留在数据层供文档页与后续决策复用。
- **影响范围**：仅首页渲染层 `theme/index.tsx`（新增 `theme/components/segmented.tsx`）与七个语言 `docs/<lang>/index.mdx` 的 hero image 精简；`theme/home-content.ts` 的 stories/capabilities/evidence/boundary/cta 数据全部保留不删，并新增 `heroInstall` 七语言文案（check-docs.ts 同步纳入七语言校验）。
- **回滚方式**：还原 `theme/index.tsx` 与七个 `index.mdx` 至本决策前版本（git 历史可查），移除 `segmented.tsx` 与 `@tabler/icons-react` 依赖；`heroInstall` 数据可保留不影响回滚后渲染。

### 13.4 首页收敛为单屏安装入口并启用 WebGL shader（覆盖 13.3 的三步代码与 tagline）

- **日期**：2026-08-16
- **决策**：用户以明确参考图要求首页只保留安装方式、文档和 GitHub 入口，并删除其余信息。首页因此收敛为单屏：短品牌眉题与核心命题 → 包管理器切换 → 安装命令与复制反馈 → 文档 / GitHub；不再渲染 tagline、三步代码示例或页脚。背景使用自有 WebGL2 fragment shader 生成深蓝流体光幕与细网格，不引入图片或新的运行时依赖。
- **无障碍与性能**：复制继续保留 idle、success、error、retry 和 `aria-live`；包管理器切换保留键盘方向键、Home / End；所有入口保留可见焦点。shader 限制 devicePixelRatio、使用低功耗上下文、在 `prefers-reduced-motion: reduce` 下冻结，并以纯深蓝背景作为 WebGL 不可用时的静态降级。
- **影响范围**：`theme/index.tsx`、`theme/components/shader-background.tsx`、`theme/components/segmented.tsx`、`theme/styles.css` 与 `scripts/check-docs.ts`。`theme/home-content.ts` 的三步示例和叙事数据继续保留，供文档或后续复用。
- **回滚方式**：恢复 13.3 的 `theme/index.tsx` 渲染结构与旧的 `scripts/check-docs.ts` 首页示例守卫，删除 shader 组件和对应首页样式。
