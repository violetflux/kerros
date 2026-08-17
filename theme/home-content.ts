/**
 * Seven-language single source of truth for the Kerros homepage content layer.
 * The English entry is the routing/content canonical source; other locales
 * are faithful translations and must never revert the default usage to
 * selector-first examples.
 */

export interface HomeExample {
  /** Section title */
  title: string
  /** Short usage explanation */
  description: string
}

export interface HomeInstallPrompt {
  /** Prompt field label */
  label: string
  /** Instruction copied into a coding agent */
  prompt: string
  /** Copy button label */
  copy: string
  /** Successful copy state */
  copied: string
  /** Failed copy state */
  error: string
  /** Retry button label */
  retry: string
}

export interface HomeStory {
  /** Section title */
  title: string
  /** Positioning paragraphs */
  paragraphs: string[]
  /** Call-to-action label */
  action: string
}

export interface HomeCapability {
  title: string
  /** Why this capability exists */
  purpose: string
  /** When to reach for it */
  trigger: string
  /** What the developer provides */
  input: string
  /** What Kerros returns */
  output: string
  /** Observable success result */
  success: string
  /** Optional relative link to the matching guide */
  link?: string
}

export interface HomeCapabilityLabels {
  purpose: string
  trigger: string
  input: string
  output: string
  success: string
  readMore: string
}

export interface HomeCapabilityGroup {
  /** Section title */
  title: string
  /** Fixed five-field labels */
  labels: HomeCapabilityLabels
  cards: HomeCapability[]
}

export interface HomeEvidenceItem {
  title: string
  detail: string
  /** Optional relative site link to the underlying evidence */
  href?: string
}

export interface HomeEvidence {
  /** Section title */
  title: string
  items: HomeEvidenceItem[]
  benchmarkTitle: string
  /** Qualitative benchmark conclusion only — never hard-coded multiples */
  benchmarkDetail: string
  benchmarkSource: string
  benchmarkHref: string
  /** Volatility disclaimer for versions and counts */
  note: string
}

export interface HomeBoundary {
  /** Section title */
  title: string
  fitsTitle: string
  fits: string[]
  avoidsTitle: string
  avoids: string[]
}

export interface HomeCtaLink {
  label: string
  href: string
  /** Marks links that leave the site */
  external?: boolean
}

export interface HomeCta {
  /** Section title */
  title: string
  humanTitle: string
  humanLead: string
  gettingStarted: string
  agentTitle: string
  advancedTitle: string
  advanced: HomeCtaLink[]
  /** Screen-reader suffix for external links */
  externalNote: string
}

export interface HomeInstallCommand {
  manager: string
  command: string
}

export interface HomeHeroInstall {
  /** Short hero headline stating the core proposition */
  title: string
  /** One-line tagline under the headline */
  tagline: string
  /** Accessible label for the package manager switcher */
  switcherLabel: string
  /** Primary button that opens the getting-started guide */
  docsLabel: string
  /** Secondary button that opens the GitHub repository */
  githubLabel: string
}

/** Package manager commands shown in the install switcher */
export const installCommands: HomeInstallCommand[] = [
  { manager: 'npm', command: 'npm install @violetflux/kerros' },
  { manager: 'pnpm', command: 'pnpm add @violetflux/kerros' },
  { manager: 'yarn', command: 'yarn add @violetflux/kerros' },
  { manager: 'bun', command: 'bun add @violetflux/kerros' },
]

/** Copy for the minimal install-first hero shown on the homepage */
export const heroInstall: Record<string, HomeHeroInstall> = {
  zh: {
    title: '在 React 组件间共享状态',
    tagline: '像写 Hook 一样写 Store，Provider 决定共享范围。',
    switcherLabel: '切换包管理器',
    docsLabel: '查看文档',
    githubLabel: '前往 GitHub',
  },
  en: {
    title: 'Share state between React components',
    tagline: 'Write Stores like Hooks — the Provider sets the scope.',
    switcherLabel: 'Choose a package manager',
    docsLabel: 'Read the docs',
    githubLabel: 'Go to GitHub',
  },
  ja: {
    title: 'React コンポーネント間で状態を共有',
    tagline: 'Hook のように Store を書き、Provider が共有範囲を決めます。',
    switcherLabel: 'パッケージマネージャーを切り替え',
    docsLabel: 'ドキュメントを見る',
    githubLabel: 'GitHub へ',
  },
  ko: {
    title: 'React 컴포넌트 간 상태 공유',
    tagline: 'Hook처럼 Store를 작성하고, Provider가 공유 범위를 정합니다.',
    switcherLabel: '패키지 매니저 선택',
    docsLabel: '문서 보기',
    githubLabel: 'GitHub로 이동',
  },
  de: {
    title: 'State zwischen React-Komponenten teilen',
    tagline: 'Stores wie Hooks schreiben — der Provider bestimmt den Umfang.',
    switcherLabel: 'Paketmanager wählen',
    docsLabel: 'Zur Dokumentation',
    githubLabel: 'Zu GitHub',
  },
  fr: {
    title: 'Partagez un état entre composants React',
    tagline: 'Écrivez des Stores comme des Hooks — le Provider définit la portée.',
    switcherLabel: 'Choisir un gestionnaire de paquets',
    docsLabel: 'Voir la documentation',
    githubLabel: 'Aller sur GitHub',
  },
  es: {
    title: 'Comparte estado entre componentes de React',
    tagline: 'Escribe Stores como Hooks — el Provider define el alcance.',
    switcherLabel: 'Elegir un gestor de paquetes',
    docsLabel: 'Ver la documentación',
    githubLabel: 'Ir a GitHub',
  },
}

export const examples: Record<string, HomeExample> = {
  zh: {
    title: '三步就能共享状态',
    description: '把普通 Hook 交给 createStore，挂载 Provider，直接解构需要的数据，Kerros 会自动追踪访问。',
  },
  en: {
    title: 'Share state in three steps',
    description: 'Pass an ordinary Hook to createStore, mount its Provider, and destructure the fields you need. Kerros tracks access automatically.',
  },
  ja: {
    title: '3 ステップで状態を共有',
    description: '通常の Hook を createStore に渡し、Provider を配置して、必要な値を分割代入します。Kerros がアクセスを自動追跡します。',
  },
  ko: {
    title: '세 단계로 상태 공유',
    description: '평범한 Hook을 createStore에 전달하고 Provider를 마운트한 다음 필요한 값을 구조 분해하세요. Kerros가 접근을 자동 추적합니다.',
  },
  de: {
    title: 'State in drei Schritten teilen',
    description: 'Übergib einen normalen Hook an createStore, binde den Provider ein und destrukturiere die benötigten Werte. Kerros verfolgt Zugriffe automatisch.',
  },
  fr: {
    title: 'Partager un état en trois étapes',
    description: 'Passez un Hook ordinaire à createStore, montez son Provider, puis déstructurez les valeurs nécessaires. Kerros suit automatiquement les accès.',
  },
  es: {
    title: 'Comparte estado en tres pasos',
    description: 'Pasa un Hook normal a createStore, monta su Provider y desestructura los valores necesarios. Kerros rastrea los accesos automáticamente.',
  },
}

export const installPrompts: Record<string, HomeInstallPrompt> = {
  zh: {
    label: '复制给你的 Coding Agent，一次装好依赖和 Skill',
    prompt: '使用当前项目的包管理器安装 @violetflux/kerros，然后运行 npx skills add violetflux/kerros --skill kerros --agent \'*\' -y，为当前项目中所有兼容的 Coding Agent 安装 Kerros Skill。',
    copy: '复制',
    copied: '已复制',
    error: '复制失败，请检查浏览器剪贴板权限',
    retry: '重试',
  },
  en: {
    label: 'Paste into your coding agent to install the package and Skill',
    prompt: 'Install @violetflux/kerros with this project\'s package manager, then run npx skills add violetflux/kerros --skill kerros --agent \'*\' -y to install the Kerros Skill for every compatible coding agent in this project.',
    copy: 'Copy',
    copied: 'Copied',
    error: 'Copy failed. Check your browser clipboard permissions.',
    retry: 'Retry',
  },
  ja: {
    label: 'Coding Agent に貼り付けてパッケージと Skill をインストール',
    prompt: 'このプロジェクトのパッケージマネージャーで @violetflux/kerros をインストールし、npx skills add violetflux/kerros --skill kerros --agent \'*\' -y を実行して、互換性のあるすべての Coding Agent に Kerros Skill をインストールしてください。',
    copy: 'コピー',
    copied: 'コピー済み',
    error: 'コピーに失敗しました。ブラウザーのクリップボード権限を確認してください。',
    retry: '再試行',
  },
  ko: {
    label: 'Coding Agent에 붙여넣어 패키지와 Skill 설치',
    prompt: '현재 프로젝트의 패키지 매니저로 @violetflux/kerros를 설치한 다음 npx skills add violetflux/kerros --skill kerros --agent \'*\' -y를 실행해 호환되는 모든 Coding Agent에 Kerros Skill을 설치하세요.',
    copy: '복사',
    copied: '복사됨',
    error: '복사에 실패했습니다. 브라우저 클립보드 권한을 확인하세요.',
    retry: '다시 시도',
  },
  de: {
    label: 'In deinen Coding Agent einfügen und Paket plus Skill installieren',
    prompt: 'Installiere @violetflux/kerros mit dem Paketmanager dieses Projekts und führe danach npx skills add violetflux/kerros --skill kerros --agent \'*\' -y aus, um den Kerros Skill für alle kompatiblen Coding Agents zu installieren.',
    copy: 'Kopieren',
    copied: 'Kopiert',
    error: 'Kopieren fehlgeschlagen. Bitte die Clipboard-Berechtigungen des Browsers prüfen.',
    retry: 'Erneut versuchen',
  },
  fr: {
    label: 'Collez dans votre Coding Agent pour installer le paquet et le Skill',
    prompt: 'Installe @violetflux/kerros avec le gestionnaire de paquets du projet, puis exécute npx skills add violetflux/kerros --skill kerros --agent \'*\' -y afin d\'installer le Skill Kerros pour tous les Coding Agents compatibles.',
    copy: 'Copier',
    copied: 'Copié',
    error: 'Échec de la copie. Vérifiez les autorisations du presse-papiers du navigateur.',
    retry: 'Réessayer',
  },
  es: {
    label: 'Pega en tu Coding Agent para instalar el paquete y el Skill',
    prompt: 'Instala @violetflux/kerros con el gestor de paquetes del proyecto y después ejecuta npx skills add violetflux/kerros --skill kerros --agent \'*\' -y para instalar el Skill de Kerros en todos los Coding Agents compatibles.',
    copy: 'Copiar',
    copied: 'Copiado',
    error: 'No se pudo copiar. Revisa los permisos del portapapeles del navegador.',
    retry: 'Reintentar',
  },
}

export const stories: Record<string, HomeStory> = {
  zh: {
    title: '从状态管理到状态共享',
    paragraphs: [
      '不妨回想一下 Redux、Zustand、Recoil 这些状态管理库。它们当然也能解决数据共享问题，但最核心的能力仍然是组织数据、操作数据和约束数据流，因此它们被称作“状态管理”工具。',
      'Kerros 想解决的问题更小，也更直接。它不发明新的数据结构，不规定异步和数据流应该怎么写，只聚焦一个痛点：如何在多个 React 组件间共享一段 Hook 状态。',
      '直接使用 React Context 共享变化频繁的状态时，Context value 每次变化都会让所有消费者重新渲染。Kerros 保留 Provider 的作用域和多实例能力，并自动追踪组件渲染期间实际访问的属性。',
      '如果你已经发现，层层传递 value、onChange 会不断侵蚀组件边界，而把所有数据都塞进一个全局 Store 也不会自然带来可维护性，那么 Kerros 或许正适合你。',
      '它简单、轻量、可靠。先把状态写成普通 Hook，需要共享时再交给 createStore；Provider 决定状态共享到哪里，自动追踪决定哪些更新会影响每个组件。',
    ],
    action: '开始使用 Kerros',
  },
  en: {
    title: 'From state management to state sharing',
    paragraphs: [
      'Think about libraries such as Redux, Zustand, and Recoil. They can certainly share data, but their central job is still to organize state, update it, and define how data flows. “State management” is the right name for them.',
      'Kerros focuses on a smaller and more direct problem. It does not invent a new data model or prescribe how async logic should work. It answers one question: how can a piece of Hook state be shared between React components?',
      'When frequently changing state is shared through React Context directly, every Context value change rerenders all consumers. Kerros keeps Provider scoping and multiple instances while automatically tracking the properties each component reads during render.',
      'Passing value and onChange through layer after layer damages component boundaries. Moving everything into one global Store does not automatically make an application maintainable either.',
      'Kerros stays simple, lightweight, and reliable. Write local state as an ordinary Hook, pass it to createStore when it needs to be shared, use a Provider to set its scope, and let automatic tracking focus each component on the properties it reads.',
    ],
    action: 'Get started with Kerros',
  },
  ja: {
    title: '状態管理から状態共有へ',
    paragraphs: [
      'Redux、Zustand、Recoil といった状態管理ライブラリを思い浮かべてください。データの共有はもちろん解決できますが、それらの中核はあくまでデータの整理、更新、データフローの制約であり、だからこそ「状態管理」ツールと呼ばれています。',
      'Kerros が解く問題はもっと小さく、直接的です。新しいデータ構造を発明せず、非同期やデータフローの書き方も規定しません。焦点はただ一つ：複数の React コンポーネント間で Hook の状態をどう共有するか、です。',
      '変化の多い状態を React Context で直接共有すると、Context の値が変わるたびにすべてのコンシューマーが再レンダリングされます。Kerros は Provider のスコープと複数インスタンスの能力を保ちつつ、レンダリング中に実際にアクセスされたプロパティを自動で追跡します。',
      'value や onChange を何層も渡すことがコンポーネントの境界を蝕み、すべてのデータを一つのグローバル Store に詰め込んでも保守性が自然に手に入るわけではないと感じているなら、Kerros はきっと合っています。',
      'シンプルで軽量、信頼できます。まず状態を普通の Hook として書き、共有が必要になったら createStore に渡します。Provider が状態の共有範囲を決め、自動追跡が各コンポーネントに影響する更新を決めます。',
    ],
    action: 'Kerros を始める',
  },
  ko: {
    title: '상태 관리에서 상태 공유로',
    paragraphs: [
      'Redux, Zustand, Recoil 같은 상태 관리 라이브러리를 떠올려 보세요. 데이터 공유 문제를 해결할 수는 있지만, 핵심 역량은 여전히 데이터를 조직하고 변경하며 데이터 흐름을 제약하는 데 있습니다. 그래서 이들은 "상태 관리" 도구라 불립니다.',
      'Kerros가 풀려는 문제는 더 작고 직접적입니다. 새로운 자료 구조를 발명하지 않고, 비동기와 데이터 흐름을 어떻게 작성할지 규정하지도 않습니다. 오직 하나의 페인 포인트에만 집중합니다: 여러 React 컴포넌트 사이에서 Hook 상태를 어떻게 공유할 것인가.',
      '자주 변하는 상태를 React Context로 직접 공유하면 Context 값이 바뀔 때마다 모든 소비자(consumer)가 다시 렌더링됩니다. Kerros는 Provider 스코프와 다중 인스턴스 능력을 유지하면서, 렌더링 중에 실제로 접근한 속성을 자동으로 추적합니다.',
      'value와 onChange을 층층이 전달하며 컴포넌트 경계가 무너지는 것을 경험했고, 모든 데이터를 하나의 전역 Store에 넣는다고 유지보수성이 저절로 좋아지지 않는다는 것도 알고 있다면, Kerros가 잘 맞을 수 있습니다.',
      '단순하고 가볍고 신뢰할 수 있습니다. 먼저 상태를 평범한 Hook으로 작성하고, 공유가 필요할 때 createStore에 전달하세요. Provider는 상태가 어디까지 공유되는지 정하고, 자동 추적은 어떤 업데이트가 각 컴포넌트에 영향을 주는지 정합니다.',
    ],
    action: 'Kerros 시작하기',
  },
  de: {
    title: 'Von State-Verwaltung zu State-Sharing',
    paragraphs: [
      'Denk an Bibliotheken wie Redux, Zustand oder Recoil. Sie können Daten natürlich ebenfalls teilen, aber ihre Kernaufgabe bleibt, Daten zu organisieren, zu verändern und Datenflüsse zu beschränken – deshalb heißen sie „State-Management“-Tools.',
      'Kerros löst ein kleineres und direkteres Problem. Es erfindet keine neuen Datenstrukturen und schreibt nicht vor, wie Async-Logik oder Datenflüsse aussehen sollen. Es konzentriert sich auf einen Schmerzpunkt: Wie teilt man einen Hook-State zwischen mehreren React-Komponenten?',
      'Wenn sich häufig ändernder State direkt über React Context geteilt wird, führt jede Änderung des Context-Werts dazu, dass alle Konsumenten neu rendern. Kerros behält Provider-Scoping und mehrere Instanzen bei und verfolgt automatisch die Eigenschaften, auf die während des Renderns tatsächlich zugegriffen wird.',
      'Wenn du merkst, dass das Weiterreichen von value und onChange Komponentengrenzen aushöhlt und alles in einen globalen Store zu stecken nicht automatisch Wartbarkeit bringt, passt Kerros vielleicht gut zu dir.',
      'Einfach, leicht, zuverlässig. Schreib State zuerst als normalen Hook und übergib ihn an createStore, wenn er geteilt werden soll. Der Provider bestimmt, wohin der State geteilt wird, und das automatische Tracking entscheidet, welche Updates jede Komponente betreffen.',
    ],
    action: 'Mit Kerros starten',
  },
  fr: {
    title: 'De la gestion d’état au partage d’état',
    paragraphs: [
      'Pensez à des bibliothèques comme Redux, Zustand ou Recoil. Elles peuvent bien sûr partager des données, mais leur cœur reste d’organiser les données, de les modifier et de contraindre les flux : ce sont des outils de « gestion d’état ».',
      'Kerros s’attaque à un problème plus petit et plus direct. Il n’invente pas de nouvelles structures de données et ne prescrit ni l’asynchrone ni les flux de données. Il se concentre sur un seul point de friction : comment partager un état de Hook entre plusieurs composants React.',
      'Partager un état changeant souvent via React Context directement provoque un re-rendu de tous les consommateurs à chaque changement de valeur. Kerros conserve la portée des Providers et les instances multiples, tout en suivant automatiquement les propriétés réellement lues pendant le rendu.',
      'Si vous constatez que passer value et onChange de couche en couche érode les frontières des composants, et que tout mettre dans un Store global n’apporte pas naturellement de la maintenabilité, Kerros est peut-être fait pour vous.',
      'Simple, léger, fiable. Écrivez d’abord l’état comme un Hook ordinaire, puis confiez-le à createStore quand il doit être partagé. Le Provider décide où l’état est partagé, et le suivi automatique décide quelles mises à jour concernent chaque composant.',
    ],
    action: 'Commencer avec Kerros',
  },
  es: {
    title: 'De la gestión de estado al estado compartido',
    paragraphs: [
      'Piensa en bibliotecas como Redux, Zustand o Recoil. Claro que también pueden compartir datos, pero su capacidad central sigue siendo organizar los datos, modificarlos y restringir el flujo de datos; por eso se llaman herramientas de «gestión de estado».',
      'Kerros resuelve un problema más pequeño y directo. No inventa nuevas estructuras de datos ni prescribe cómo escribir la lógica asíncrona o los flujos de datos; se centra en un único punto de dolor: cómo compartir el estado de un Hook entre varios componentes de React.',
      'Cuando un estado que cambia con frecuencia se comparte directamente con React Context, cada cambio del valor del Context hace que todos los consumidores se vuelvan a renderizar. Kerros conserva el alcance del Provider y las instancias múltiples, y rastrea automáticamente las propiedades a las que se accede durante el render.',
      'Si ya has notado que pasar value y onChange capa tras capa erosiona los límites de los componentes, y que meterlo todo en un Store global no trae mantenibilidad por sí solo, Kerros quizá sea para ti.',
      'Simple, ligero y fiable. Primero escribe el estado como un Hook normal y, cuando necesites compartirlo, pásalo a createStore. El Provider decide hasta dónde se comparte el estado y el rastreo automático decide qué actualizaciones afectan a cada componente.',
    ],
    action: 'Empieza con Kerros',
  },
}

export const capabilities: Record<string, HomeCapabilityGroup> = {
  zh: {
    title: '五项能力',
    labels: { purpose: '目的', trigger: '触发', input: '输入', output: '输出', success: '成功结果', readMore: '阅读指南' },
    cards: [
      {
        title: 'Hook 原生状态共享',
        purpose: '把现有 Hook 状态提升为跨组件共享状态。',
        trigger: '同一段局部状态开始被多个组件使用。',
        input: '顶层命名的 useXxxModel Hook。',
        output: 'useXxx Store Hook 与 XxxProvider。',
        success: '继续使用 useState、useReducer 与其他 Hook，不新增状态 DSL。',
        link: './guide/getting-started',
      },
      {
        title: 'Provider 作用域与多实例',
        purpose: '让共享范围显式、可隔离、可组合。',
        trigger: '需要多个独立实例，或 Store 存在单向依赖。',
        input: 'Provider 挂载位置、props 与依赖顺序。',
        output: '就近读取的独立实例和清晰组合。',
        success: '局部状态不被迫全局化，实例互不污染，依赖保持单向。',
        link: './guide/composition',
      },
      {
        title: '自动访问追踪与可选 selector',
        purpose: '避免无关 Store 更新触发组件重渲染。',
        trigger: '组件读取对象、数组或深层字段；或出现测量后的派生值热点。',
        input: '默认 useStore()，必要时使用对象 selector。',
        output: '按本次渲染访问路径建立的只读快照订阅。',
        success: '未读取字段更新时不重渲染；热点仍可用 selector 精调。',
        link: './guide/selectors',
      },
      {
        title: '绑定已有 External Store',
        purpose: '把已有 headless Store/SDK 权威快照接入 React。',
        trigger: '外部实例提供稳定 getSnapshot 与 subscribe。',
        input: '原实例和 bindStore 生成的 Provider/Hook。',
        output: 'Provider 作用域、自动追踪与 selector，但不复制快照。',
        success: '原 Store 仍是唯一状态所有者，生命周期和订阅不重复。',
        link: './guide/patterns',
      },
      {
        title: 'ESLint 与 Coding Agent 护栏',
        purpose: '固化 Provider、selector、快照与依赖边界。',
        trigger: '多人协作、迁移或 AI 辅助编码。',
        input: 'Kerros ESLint 配置与项目 Kerros Skill。',
        output: '类型感知诊断、推荐配置与 Agent 实现约定。',
        success: '常见误用在提交前被发现。',
        link: './guide/testing',
      },
    ],
  },
  en: {
    title: 'Five capabilities',
    labels: { purpose: 'Purpose', trigger: 'Trigger', input: 'Input', output: 'Output', success: 'Success', readMore: 'Read the guide' },
    cards: [
      {
        title: 'Hook-native state sharing',
        purpose: 'Lift existing Hook state into state shared across components.',
        trigger: 'The same local state starts being used by multiple components.',
        input: 'A top-level named useXxxModel Hook.',
        output: 'A useXxx Store Hook and XxxProvider.',
        success: 'Keep using useState, useReducer, and other Hooks — no new state DSL.',
        link: './guide/getting-started',
      },
      {
        title: 'Provider scoping and multiple instances',
        purpose: 'Make the sharing scope explicit, isolatable, and composable.',
        trigger: 'You need multiple independent instances, or Stores have one-way dependencies.',
        input: 'Provider mount positions, props, and dependency order.',
        output: 'Independent instances resolved nearby and clear composition.',
        success: 'Local state is not forced global; instances stay isolated; dependencies stay one-way.',
        link: './guide/composition',
      },
      {
        title: 'Automatic access tracking with optional selectors',
        purpose: 'Avoid unrelated Store updates rerendering components.',
        trigger: 'A component reads objects, arrays, or deep fields; or a measured derived-value hotspot appears.',
        input: 'useStore() by default; an object selector when necessary.',
        output: 'A read-only snapshot subscription built from this render’s access paths.',
        success: 'Updates to unread fields do not rerender the component; hotspots can still be tuned with selectors.',
        link: './guide/selectors',
      },
      {
        title: 'Binding an existing External Store',
        purpose: 'Connect an authoritative snapshot from an existing headless Store/SDK into React.',
        trigger: 'The external instance provides stable getSnapshot and subscribe.',
        input: 'The original instance plus the Provider/Hook generated by bindStore.',
        output: 'Provider scoping, automatic tracking, and selectors — without copying the snapshot.',
        success: 'The original Store stays the single owner of state; lifecycles and subscriptions are not duplicated.',
        link: './guide/patterns',
      },
      {
        title: 'ESLint and Coding Agent guardrails',
        purpose: 'Lock down Provider, selector, snapshot, and dependency boundaries.',
        trigger: 'Team collaboration, migrations, or AI-assisted coding.',
        input: 'Kerros ESLint config and the project Kerros Skill.',
        output: 'Type-aware diagnostics, recommended configs, and Agent implementation conventions.',
        success: 'Common misuse is caught before commit.',
        link: './guide/testing',
      },
    ],
  },
  ja: {
    title: '5 つの能力',
    labels: { purpose: '目的', trigger: 'トリガー', input: '入力', output: '出力', success: '成功結果', readMore: 'ガイドを読む' },
    cards: [
      {
        title: 'Hook ネイティブな状態共有',
        purpose: '既存の Hook 状態をコンポーネント間で共有される状態へ引き上げます。',
        trigger: '同じローカル状態を複数のコンポーネントが使い始めたとき。',
        input: 'モジュールトップレベルで命名された useXxxModel Hook。',
        output: 'useXxx Store Hook と XxxProvider。',
        success: 'useState や useReducer などの Hook をそのまま継続利用でき、新しい状態 DSL は増えません。',
        link: './guide/getting-started',
      },
      {
        title: 'Provider スコープと複数インスタンス',
        purpose: '共有範囲を明示的・隔離可能・組み合わせ可能にします。',
        trigger: '独立した複数インスタンスが必要なとき、または Store 間に一方向の依存があるとき。',
        input: 'Provider の配置場所、props、依存の順序。',
        output: '最も近い Provider から読む独立インスタンスと明確な構成。',
        success: 'ローカル状態をグローバル化せず、インスタンス同士は汚染し合わず、依存は一方向のままです。',
        link: './guide/composition',
      },
      {
        title: '自動アクセス追跡と任意の selector',
        purpose: '無関係な Store 更新によるコンポーネント再レンダーを避けます。',
        trigger: 'コンポーネントがオブジェクト・配列・深いフィールドを読むとき、または測定済みの派生値ホットスポットがあるとき。',
        input: '既定では useStore()、必要な場合のみオブジェクト selector。',
        output: '今回のレンダーでアクセスしたパスに基づいた読み取り専用スナップショット購読。',
        success: '読んでいないフィールドの更新では再レンダーせず、ホットスポットは selector で調整できます。',
        link: './guide/selectors',
      },
      {
        title: '既存 External Store のバインド',
        purpose: '既存の headless Store/SDK が持つ権威スナップショットを React に接続します。',
        trigger: '外部インスタンスが安定した getSnapshot と subscribe を提供するとき。',
        input: '元のインスタンスと bindStore が生成する Provider/Hook。',
        output: 'Provider スコープ、自動追跡、selector。スナップショットは複製しません。',
        success: '元の Store が唯一の状態所有者のまま、ライフサイクルと購読は重複しません。',
        link: './guide/patterns',
      },
      {
        title: 'ESLint と Coding Agent のガードレール',
        purpose: 'Provider、selector、スナップショット、依存の境界を固定します。',
        trigger: 'チーム協業、移行、または AI 支援コーディングのとき。',
        input: 'Kerros ESLint 設定とプロジェクトの Kerros Skill。',
        output: '型対応の診断、推奨設定、Agent 実装規約。',
        success: 'よくある誤用をコミット前に発見できます。',
        link: './guide/testing',
      },
    ],
  },
  ko: {
    title: '다섯 가지 능력',
    labels: { purpose: '목적', trigger: '트리거', input: '입력', output: '출력', success: '성공 결과', readMore: '가이드 읽기' },
    cards: [
      {
        title: 'Hook 네이티브 상태 공유',
        purpose: '기존 Hook 상태를 컴포넌트 간 공유 상태로 끌어올립니다.',
        trigger: '같은 로컬 상태를 여러 컴포넌트가 사용하기 시작할 때.',
        input: '모듈 최상위에서 이름 붙인 useXxxModel Hook.',
        output: 'useXxx Store Hook과 XxxProvider.',
        success: 'useState, useReducer 등 기존 Hook을 그대로 사용하며 새로운 상태 DSL은 없습니다.',
        link: './guide/getting-started',
      },
      {
        title: 'Provider 스코프와 다중 인스턴스',
        purpose: '공유 범위를 명시적이고 격리 가능하며 조합 가능하게 만듭니다.',
        trigger: '독립 인스턴스가 여러 개 필요하거나 Store 간 단방향 의존이 있을 때.',
        input: 'Provider 마운트 위치, props, 의존 순서.',
        output: '가장 가까운 Provider에서 읽는 독립 인스턴스와 명확한 조합.',
        success: '로컬 상태를 전역화하지 않고, 인스턴스는 서로 오염시키지 않으며, 의존은 단방향으로 유지됩니다.',
        link: './guide/composition',
      },
      {
        title: '자동 접근 추적과 선택적 selector',
        purpose: '무관한 Store 업데이트가 컴포넌트를 다시 렌더링하지 않게 합니다.',
        trigger: '컴포넌트가 객체, 배열, 깊은 필드를 읽을 때, 또는 측정한 파생값 핫스팟이 있을 때.',
        input: '기본은 useStore(), 필요할 때만 객체 selector.',
        output: '이번 렌더링의 접근 경로로 만든 읽기 전용 스냅샷 구독.',
        success: '읽지 않은 필드의 업데이트는 다시 렌더링하지 않고, 핫스팟은 selector로 조정할 수 있습니다.',
        link: './guide/selectors',
      },
      {
        title: '기존 External Store 연결',
        purpose: '기존 headless Store/SDK의 권위 스냅샷을 React에 연결합니다.',
        trigger: '외부 인스턴스가 안정적 getSnapshot과 subscribe를 제공할 때.',
        input: '원본 인스턴스와 bindStore가 만드는 Provider/Hook.',
        output: 'Provider 스코프, 자동 추적, selector를 제공하되 스냅샷은 복제하지 않습니다.',
        success: '원본 Store가 유일한 상태 소유자로 남고, 라이프사이클과 구독이 중복되지 않습니다.',
        link: './guide/patterns',
      },
      {
        title: 'ESLint와 Coding Agent 가드레일',
        purpose: 'Provider, selector, 스냅샷, 의존 경계를 고정합니다.',
        trigger: '협업, 마이그레이션, AI 보조 코딩 시.',
        input: 'Kerros ESLint 설정과 프로젝트 Kerros Skill.',
        output: '타입 인식 진단, 권장 설정, Agent 구현 규칙.',
        success: '흔한 오용을 커밋 전에 잡아냅니다.',
        link: './guide/testing',
      },
    ],
  },
  de: {
    title: 'Fünf Fähigkeiten',
    labels: { purpose: 'Zweck', trigger: 'Auslöser', input: 'Eingabe', output: 'Ausgabe', success: 'Ergebnis', readMore: 'Zum Guide' },
    cards: [
      {
        title: 'Hook-native State-Sharing',
        purpose: 'Hebt bestehenden Hook-State in komponentenübergreifend geteilten State.',
        trigger: 'Derselbe lokale State wird von mehreren Komponenten genutzt.',
        input: 'Ein auf Modulebene benannter useXxxModel-Hook.',
        output: 'Ein useXxx-Store-Hook und XxxProvider.',
        success: 'useState, useReducer und andere Hooks bleiben nutzbar – kein neues State-DSL.',
        link: './guide/getting-started',
      },
      {
        title: 'Provider-Scoping und mehrere Instanzen',
        purpose: 'Macht den Geltungsbereich explizit, isolierbar und komponierbar.',
        trigger: 'Mehrere unabhängige Instanzen oder einseitige Store-Abhängigkeiten.',
        input: 'Provider-Einbindungsorte, Props und Abhängigkeitsreihenfolge.',
        output: 'Unabhängige Instanzen über den nächsten Provider und klare Komposition.',
        success: 'Lokaler State wird nicht globalisiert, Instanzen bleiben isoliert, Abhängigkeiten einseitig.',
        link: './guide/composition',
      },
      {
        title: 'Automatisches Zugriffstracking mit optionalen Selektoren',
        purpose: 'Verhindert, dass unzusammenhängende Store-Updates Komponenten neu rendern.',
        trigger: 'Komponenten lesen Objekte, Arrays oder tiefe Felder; oder ein gemessener Hotspot abgeleiteter Werte.',
        input: 'Standardmäßig useStore(), bei Bedarf ein Objekt-Selektor.',
        output: 'Ein Nur-Lese-Snapshot-Abo entlang der in diesem Render gelesenen Pfade.',
        success: 'Updates ungelesener Felder rendern die Komponente nicht neu; Hotspots lassen sich per Selektor verfeinern.',
        link: './guide/selectors',
      },
      {
        title: 'Bestehende External Stores anbinden',
        purpose: 'Bindet das autoritative Snapshot eines bestehenden headless Store/SDK in React ein.',
        trigger: 'Die externe Instanz bietet stabiles getSnapshot und subscribe.',
        input: 'Die Originalinstanz plus Provider/Hook aus bindStore.',
        output: 'Provider-Scope, automatisches Tracking und Selektoren – ohne das Snapshot zu kopieren.',
        success: 'Der Original-Store bleibt alleiniger Eigentümer; Lifecycle und Subscriptions werden nicht dupliziert.',
        link: './guide/patterns',
      },
      {
        title: 'ESLint- und Coding-Agent-Guardrails',
        purpose: 'Zementiert Grenzen für Provider, Selektoren, Snapshots und Abhängigkeiten.',
        trigger: 'Teamarbeit, Migrationen oder KI-gestütztes Coding.',
        input: 'Kerros-ESLint-Konfiguration und der Kerros Skill des Projekts.',
        output: 'Typbewusste Diagnosen, empfohlene Konfigurationen und Agent-Konventionen.',
        success: 'Häufige Fehlverwendungen fallen vor dem Commit auf.',
        link: './guide/testing',
      },
    ],
  },
  fr: {
    title: 'Cinq capacités',
    labels: { purpose: 'Objectif', trigger: 'Déclencheur', input: 'Entrée', output: 'Sortie', success: 'Résultat', readMore: 'Lire le guide' },
    cards: [
      {
        title: 'Partage d’état natif des Hooks',
        purpose: 'Fait passer un état de Hook local à un état partagé entre composants.',
        trigger: 'Le même état local commence à être utilisé par plusieurs composants.',
        input: 'Un Hook useXxxModel nommé au niveau du module.',
        output: 'Un Hook de Store useXxx et un XxxProvider.',
        success: 'useState, useReducer et les autres Hooks restent utilisables, sans nouveau DSL d’état.',
        link: './guide/getting-started',
      },
      {
        title: 'Portée des Providers et instances multiples',
        purpose: 'Rend la portée du partage explicite, isolable et composable.',
        trigger: 'Plusieurs instances indépendantes, ou des Stores à dépendances unidirectionnelles.',
        input: 'Emplacements de montage des Providers, props et ordre des dépendances.',
        output: 'Des instances indépendantes lues au plus près et une composition claire.',
        success: 'L’état local n’est pas forcé en global, les instances restent isolées, les dépendances unidirectionnelles.',
        link: './guide/composition',
      },
      {
        title: 'Suivi automatique des accès et sélecteurs optionnels',
        purpose: 'Évite que des mises à jour sans rapport re-rendent des composants.',
        trigger: 'Un composant lit des objets, des tableaux ou des champs profonds ; ou un hotspot mesuré de valeurs dérivées.',
        input: 'useStore() par défaut, un sélecteur objet si nécessaire.',
        output: 'Un abonnement snapshot en lecture seule construit sur les accès du rendu courant.',
        success: 'Les champs non lus ne provoquent pas de re-rendu ; les hotspots restent réglables par sélecteur.',
        link: './guide/selectors',
      },
      {
        title: 'Brancher un External Store existant',
        purpose: 'Connecte à React le snapshot faisant autorité d’un Store/SDK headless existant.',
        trigger: 'L’instance externe fournit getSnapshot et subscribe stables.',
        input: 'L’instance d’origine et le Provider/Hook générés par bindStore.',
        output: 'Portée Provider, suivi automatique et sélecteurs, sans copier le snapshot.',
        success: 'Le Store d’origine reste l’unique propriétaire de l’état ; cycles de vie et abonnements non dupliqués.',
        link: './guide/patterns',
      },
      {
        title: 'Garde-fous ESLint et Coding Agent',
        purpose: 'Verrouille les frontières de Provider, sélecteurs, snapshots et dépendances.',
        trigger: 'Collaboration, migrations ou codage assisté par IA.',
        input: 'Configuration ESLint Kerros et Skill Kerros du projet.',
        output: 'Diagnostics typés, configurations recommandées et conventions d’implémentation Agent.',
        success: 'Les erreurs courantes sont détectées avant le commit.',
        link: './guide/testing',
      },
    ],
  },
  es: {
    title: 'Cinco capacidades',
    labels: { purpose: 'Propósito', trigger: 'Desencadenante', input: 'Entrada', output: 'Salida', success: 'Resultado', readMore: 'Leer la guía' },
    cards: [
      {
        title: 'Estado compartido nativo de Hooks',
        purpose: 'Eleva el estado de un Hook existente a estado compartido entre componentes.',
        trigger: 'El mismo estado local empieza a usarse en varios componentes.',
        input: 'Un Hook useXxxModel con nombre en el nivel superior del módulo.',
        output: 'Un Hook de Store useXxx y un XxxProvider.',
        success: 'Sigues usando useState, useReducer y otros Hooks; sin un nuevo DSL de estado.',
        link: './guide/getting-started',
      },
      {
        title: 'Alcance del Provider y múltiples instancias',
        purpose: 'Hace explícito, aislable y componible el alcance del estado compartido.',
        trigger: 'Se necesitan varias instancias independientes o los Stores tienen dependencias unidireccionales.',
        input: 'Posiciones de montaje del Provider, props y orden de dependencias.',
        output: 'Instancias independientes leídas en el Provider más cercano y composición clara.',
        success: 'El estado local no se globaliza a la fuerza, las instancias no se contaminan y las dependencias siguen siendo unidireccionales.',
        link: './guide/composition',
      },
      {
        title: 'Rastreo automático de accesos y selectores opcionales',
        purpose: 'Evita que actualizaciones no relacionadas hagan re-renderizar componentes.',
        trigger: 'Un componente lee objetos, arrays o campos profundos, o hay un hotspot medido de valores derivados.',
        input: 'useStore() por defecto y un selector de objeto cuando haga falta.',
        output: 'Una suscripción de snapshot de solo lectura construida con los accesos de este render.',
        success: 'Los campos no leídos no provocan re-render; los hotspots aún pueden ajustarse con selectores.',
        link: './guide/selectors',
      },
      {
        title: 'Vincular un External Store existente',
        purpose: 'Conecta a React el snapshot autorizado de un Store/SDK headless existente.',
        trigger: 'La instancia externa ofrece getSnapshot y subscribe estables.',
        input: 'La instancia original y el Provider/Hook generados por bindStore.',
        output: 'Alcance de Provider, rastreo automático y selectores, sin copiar el snapshot.',
        success: 'El Store original sigue siendo el único dueño del estado; el ciclo de vida y las suscripciones no se duplican.',
        link: './guide/patterns',
      },
      {
        title: 'Guardarraíles de ESLint y Coding Agent',
        purpose: 'Fija las fronteras de Provider, selectores, snapshots y dependencias.',
        trigger: 'Colaboración en equipo, migraciones o codificación asistida por IA.',
        input: 'Configuración ESLint de Kerros y el Skill de Kerros del proyecto.',
        output: 'Diagnósticos con tipos, configuraciones recomendadas y convenciones de implementación para Agents.',
        success: 'Los errores comunes se detectan antes del commit.',
        link: './guide/testing',
      },
    ],
  },
}

/** Benchmark source of evidence; results depend on fixture and environment */
const TRACKING_RESULTS_URL = 'https://github.com/violetflux/kerros/blob/main/benchmarks/tracking/RESULTS.md'

export const evidence: Record<string, HomeEvidence> = {
  zh: {
    title: '可信证据',
    items: [
      { title: '版本与 React 兼容', detail: '当前版本 0.2.4，peerDependencies 覆盖 React ^17.0.0 || ^18.0.0 || ^19.0.0。' },
      { title: 'ESLint 护栏', detail: 'ESLint 插件内置 16 条规则，覆盖 Provider、selector、快照与 Store 依赖边界。', href: './guide/testing' },
      { title: '发布产物', detail: 'MIT 许可，同时发布 ESM、CJS 与 TypeScript 类型声明。', href: './api/' },
      { title: '核心 API', detail: '运行时只暴露 createStore、bindStore、ref 等最小 API，没有隐藏的全局注册。', href: './api/' },
      { title: '七语言文档', detail: '指南与 API 文档覆盖 7 种语言，路由结构保持同构。' },
      { title: '测试覆盖', detail: '测试覆盖 runtime、SSR、Strict Mode、访问追踪、React 兼容矩阵与 ESLint 规则。' },
    ],
    benchmarkTitle: '更新行为 benchmark',
    benchmarkDetail: '在无关路径更新的场景中，未读取该路径的订阅组件不会重渲染；命中观察路径的更新会按订阅关系正常传播。这里只给定性结论，具体数字依赖 fixture 与运行环境，详见证据文件。',
    benchmarkSource: '查看完整方法与结果',
    benchmarkHref: TRACKING_RESULTS_URL,
    note: '版本号与规则数量会随发布变化，以 npm registry 和构建产物为准。',
  },
  en: {
    title: 'Trustworthy evidence',
    items: [
      { title: 'Version and React compatibility', detail: 'Current version 0.2.4; peerDependencies cover React ^17.0.0 || ^18.0.0 || ^19.0.0.' },
      { title: 'ESLint guardrails', detail: 'The ESLint plugin ships 16 rules covering Provider, selector, snapshot, and Store dependency boundaries.', href: './guide/testing' },
      { title: 'Published artifacts', detail: 'MIT licensed, published as ESM, CJS, and TypeScript type declarations.', href: './api/' },
      { title: 'Core API', detail: 'The runtime only exposes a minimal API such as createStore, bindStore, and ref — no hidden global registry.', href: './api/' },
      { title: 'Seven-language docs', detail: 'Guides and API docs cover 7 languages with an isomorphic route structure.' },
      { title: 'Test coverage', detail: 'Tests cover the runtime, SSR, Strict Mode, access tracking, the React compatibility matrix, and ESLint rules.' },
    ],
    benchmarkTitle: 'Update-behavior benchmarks',
    benchmarkDetail: 'For updates on unrelated paths, subscribed components that never read that path do not rerender; updates hitting an observed path propagate through subscriptions as expected. This is a qualitative conclusion only — concrete numbers depend on the fixture and environment, see the evidence files.',
    benchmarkSource: 'See the full method and results',
    benchmarkHref: TRACKING_RESULTS_URL,
    note: 'Version and rule counts change with releases; trust the npm registry and build artifacts.',
  },
  ja: {
    title: '信頼できる証拠',
    items: [
      { title: 'バージョンと React 互換性', detail: '現在のバージョンは 0.2.4、peerDependencies は React ^17.0.0 || ^18.0.0 || ^19.0.0 をカバーします。' },
      { title: 'ESLint ガードレール', detail: 'ESLint プラグインは 16 条のルールを内蔵し、Provider、selector、スナップショット、Store 依存の境界をカバーします。', href: './guide/testing' },
      { title: '公開成果物', detail: 'MIT ライセンスで、ESM、CJS、TypeScript 型宣言を同時に公開しています。', href: './api/' },
      { title: 'コア API', detail: 'ランタイムは createStore、bindStore、ref などの最小 API のみを公開し、隠れたグローバル登録はありません。', href: './api/' },
      { title: '7 言語ドキュメント', detail: 'ガイドと API ドキュメントは 7 言語をカバーし、ルート構造は同型を保ちます。' },
      { title: 'テストカバレッジ', detail: 'テストは runtime、SSR、Strict Mode、アクセス追跡、React 互換マトリクス、ESLint ルールをカバーします。' },
    ],
    benchmarkTitle: '更新挙動のベンチマーク',
    benchmarkDetail: '無関係なパスの更新シナリオでは、そのパスを読んでいない購読コンポーネントは再レンダリングされません。観察パスに命中する更新は購読関係どおりに伝わります。ここでは定性結論のみを示し、具体的な数値は fixture と実行環境に依存します。詳しくは証拠ファイルをご覧ください。',
    benchmarkSource: '完全な手法と結果を見る',
    benchmarkHref: TRACKING_RESULTS_URL,
    note: 'バージョンとルール数はリリースごとに変化します。npm registry とビルド成果物を正としてください。',
  },
  ko: {
    title: '신뢰할 수 있는 증거',
    items: [
      { title: '버전과 React 호환성', detail: '현재 버전은 0.2.4이며 peerDependencies는 React ^17.0.0 || ^18.0.0 || ^19.0.0을 지원합니다.' },
      { title: 'ESLint 가드레일', detail: 'ESLint 플러그인은 Provider, selector, 스냅샷, Store 의존 경계를 다루는 16개의 규칙을 제공합니다.', href: './guide/testing' },
      { title: '배포 산출물', detail: 'MIT 라이선스로 ESM, CJS, TypeScript 타입 선언을 함께 배포합니다.', href: './api/' },
      { title: '핵심 API', detail: '런타임은 createStore, bindStore, ref 같은 최소 API만 노출하며 숨겨진 전역 레지스트리는 없습니다.', href: './api/' },
      { title: '7개 언어 문서', detail: '가이드와 API 문서는 7개 언어를 지원하며 라우트 구조는 동형을 유지합니다.' },
      { title: '테스트 커버리지', detail: '테스트는 runtime, SSR, Strict Mode, 접근 추적, React 호환 매트릭스, ESLint 규칙을 다룹니다.' },
    ],
    benchmarkTitle: '업데이트 동작 벤치마크',
    benchmarkDetail: '무관한 경로 업데이트 시나리오에서 그 경로를 읽지 않은 구독 컴포넌트는 다시 렌더링하지 않습니다. 관찰 경로에 해당하는 업데이트는 구독 관계대로 전파됩니다. 여기서는 정성적 결론만 제시하며, 구체적 수치는 fixture와 실행 환경에 따라 달라지므로 증거 파일을 참고하세요.',
    benchmarkSource: '전체 방법과 결과 보기',
    benchmarkHref: TRACKING_RESULTS_URL,
    note: '버전과 규칙 수는 릴리스마다 달라질 수 있으며 npm registry와 빌드 산출물을 기준으로 하세요.',
  },
  de: {
    title: 'Belastbare Nachweise',
    items: [
      { title: 'Version und React-Kompatibilität', detail: 'Aktuelle Version 0.2.4; die peerDependencies decken React ^17.0.0 || ^18.0.0 || ^19.0.0 ab.' },
      { title: 'ESLint-Guardrails', detail: 'Das ESLint-Plugin enthält 16 Regeln für Provider-, Selektor-, Snapshot- und Store-Abhängigkeitsgrenzen.', href: './guide/testing' },
      { title: 'Veröffentlichte Artefakte', detail: 'MIT-lizenziert, veröffentlicht als ESM, CJS und TypeScript-Typdeklarationen.', href: './api/' },
      { title: 'Kern-API', detail: 'Die Runtime exposeiert nur eine minimale API wie createStore, bindStore und ref – ohne versteckte globale Registrierung.', href: './api/' },
      { title: 'Dokumentation in sieben Sprachen', detail: 'Guides und API-Dokumentation decken 7 Sprachen ab, die Routenstruktur bleibt isomorph.' },
      { title: 'Testabdeckung', detail: 'Tests decken Runtime, SSR, Strict Mode, Zugriffstracking, die React-Kompatibilitätsmatrix und ESLint-Regeln ab.' },
    ],
    benchmarkTitle: 'Update-Verhaltens-Benchmarks',
    benchmarkDetail: 'Bei Updates auf nicht zusammenhängenden Pfaden rendern abonnierte Komponenten, die diesen Pfad nie gelesen haben, nicht neu; Updates, die einen beobachteten Pfad treffen, verbreiten sich gemäß den Abonnements. Hier steht nur die qualitative Aussage – konkrete Zahlen hängen von Fixture und Umgebung ab, siehe Nachweisdateien.',
    benchmarkSource: 'Vollständige Methode und Ergebnisse ansehen',
    benchmarkHref: TRACKING_RESULTS_URL,
    note: 'Version und Regelanzahl ändern sich mit Releases; maßgeblich sind npm-Registry und Build-Artefakte.',
  },
  fr: {
    title: 'Preuves vérifiables',
    items: [
      { title: 'Version et compatibilité React', detail: 'Version actuelle 0.2.4 ; les peerDependencies couvrent React ^17.0.0 || ^18.0.0 || ^19.0.0.' },
      { title: 'Garde-fous ESLint', detail: 'Le plugin ESLint embarque 16 règles couvrant les frontières de Provider, sélecteurs, snapshots et dépendances de Store.', href: './guide/testing' },
      { title: 'Artefacts publiés', detail: 'Sous licence MIT, publié en ESM, CJS et déclarations de types TypeScript.', href: './api/' },
      { title: 'API minimale', detail: 'La runtime n’expose qu’une API minimale : createStore, bindStore, ref — aucun registre global caché.', href: './api/' },
      { title: 'Documentation en sept langues', detail: 'Les guides et la documentation API couvrent 7 langues avec une structure de routes isomorphe.' },
      { title: 'Couverture de tests', detail: 'Les tests couvrent la runtime, le SSR, le Strict Mode, le suivi des accès, la matrice de compatibilité React et les règles ESLint.' },
    ],
    benchmarkTitle: 'Benchmarks du comportement de mise à jour',
    benchmarkDetail: 'Pour des mises à jour sur des chemins sans rapport, les composants abonnés qui n’ont jamais lu ce chemin ne re-rendent pas ; les mises à jour touchant un chemin observé se propagent selon les abonnements. Il s’agit ici d’une conclusion qualitative : les chiffres dépendent du fixture et de l’environnement, voir les fichiers de preuve.',
    benchmarkSource: 'Voir la méthode et les résultats complets',
    benchmarkHref: TRACKING_RESULTS_URL,
    note: 'Version et nombre de règles évoluent à chaque release ; fiez-vous au registry npm et aux artefacts de build.',
  },
  es: {
    title: 'Evidencia verificable',
    items: [
      { title: 'Versión y compatibilidad con React', detail: 'Versión actual 0.2.4; las peerDependencies cubren React ^17.0.0 || ^18.0.0 || ^19.0.0.' },
      { title: 'Guardarraíles de ESLint', detail: 'El plugin de ESLint incluye 16 reglas que cubren las fronteras de Provider, selectores, snapshots y dependencias de Store.', href: './guide/testing' },
      { title: 'Artefactos publicados', detail: 'Con licencia MIT, publicado como ESM, CJS y declaraciones de tipos de TypeScript.', href: './api/' },
      { title: 'API esencial', detail: 'La runtime solo expone una API mínima como createStore, bindStore y ref, sin registro global oculto.', href: './api/' },
      { title: 'Documentación en siete idiomas', detail: 'Las guías y la documentación de API cubren 7 idiomas con una estructura de rutas isomorfa.' },
      { title: 'Cobertura de pruebas', detail: 'Las pruebas cubren la runtime, SSR, Strict Mode, el rastreo de accesos, la matriz de compatibilidad de React y las reglas de ESLint.' },
    ],
    benchmarkTitle: 'Benchmarks del comportamiento de actualización',
    benchmarkDetail: 'En escenarios de actualización de rutas no relacionadas, los componentes suscritos que nunca leyeron esa ruta no se vuelven a renderizar; las actualizaciones que tocan una ruta observada se propagan según las suscripciones. Aquí solo se da una conclusión cualitativa: las cifras dependen del fixture y del entorno, consulta los archivos de evidencia.',
    benchmarkSource: 'Ver el método y los resultados completos',
    benchmarkHref: TRACKING_RESULTS_URL,
    note: 'La versión y el número de reglas cambian con cada release; confía en el registry de npm y en los artefactos de build.',
  },
}

export const boundary: Record<string, HomeBoundary> = {
  zh: {
    title: '适用边界',
    fitsTitle: '适合',
    fits: [
      '局部状态需要跨组件共享时，把 Hook 提升为 Store 即可',
      '需要多个互不干扰的实例时，用 Provider 挂载位置决定作用域',
      '已有权威 External Store 时，用 bindStore 直接接入而不复制快照',
    ],
    avoidsTitle: '不负责',
    avoids: [
      '不规定数据结构、异步方案或全局数据流',
      '不宣称全量替代 Redux、Zustand 等状态管理方案',
    ],
  },
  en: {
    title: 'Where it fits',
    fitsTitle: 'A good fit',
    fits: [
      'When local state must be shared across components, lift the Hook into a Store',
      'When several isolated instances are needed, Provider mount positions set the scope',
      'When an authoritative External Store already exists, bind it with bindStore instead of copying its snapshot',
    ],
    avoidsTitle: 'Out of scope',
    avoids: [
      'Does not prescribe data structures, async strategies, or global data flow',
      'Does not claim to wholesale replace Redux, Zustand, or similar state solutions',
    ],
  },
  ja: {
    title: '適用範囲',
    fitsTitle: '向いている場面',
    fits: [
      'ローカル状態をコンポーネント間で共有したいときは、Hook を Store に引き上げるだけ',
      '干渉しない複数インスタンスが必要なときは、Provider の配置場所でスコープを決める',
      '権威ある External Store が既にあるときは、bindStore で接続しスナップショットを複製しない',
    ],
    avoidsTitle: '守備範囲外',
    avoids: [
      'データ構造、非同期の方式、グローバルなデータフローは規定しない',
      'Redux や Zustand などの状態管理手法を全面的に置き換えると主張しない',
    ],
  },
  ko: {
    title: '적용 범위',
    fitsTitle: '잘 맞는 경우',
    fits: [
      '로컬 상태를 컴포넌트 간에 공유해야 할 때 Hook을 Store로 끌어올리면 됩니다',
      '서로 간섭하지 않는 여러 인스턴스가 필요할 때 Provider 마운트 위치로 스코프를 정합니다',
      '권위 있는 External Store가 이미 있다면 bindStore로 연결하되 스냅샷을 복제하지 않습니다',
    ],
    avoidsTitle: '책임지지 않는 것',
    avoids: [
      '자료 구조, 비동기 방식, 전역 데이터 흐름을 규정하지 않습니다',
      'Redux, Zustand 같은 상태 관리 방안을 전면 대체한다고 주장하지 않습니다',
    ],
  },
  de: {
    title: 'Einsatzgrenzen',
    fitsTitle: 'Gut geeignet',
    fits: [
      'Wenn lokaler State komponentenübergreifend geteilt werden muss, heb den Hook in einen Store',
      'Wenn mehrere isolierte Instanzen nötig sind, bestimmen Provider-Einbindungsorte den Geltungsbereich',
      'Wenn bereits ein autoritativer External Store existiert, binde ihn mit bindStore ein, statt seinen Snapshot zu kopieren',
    ],
    avoidsTitle: 'Nicht zuständig',
    avoids: [
      'Schreibt keine Datenstrukturen, Async-Strategien oder globalen Datenflüsse vor',
      'Behauptet nicht, Redux, Zustand oder ähnliche Lösungen vollständig zu ersetzen',
    ],
  },
  fr: {
    title: 'Périmètre d’application',
    fitsTitle: 'Bonnes situations',
    fits: [
      'Quand un état local doit être partagé entre composants, faites passer le Hook en Store',
      'Quand plusieurs instances isolées sont nécessaires, l’emplacement des Providers fixe la portée',
      'Quand un External Store faisant autorité existe déjà, branchez-le avec bindStore sans copier son snapshot',
    ],
    avoidsTitle: 'Hors périmètre',
    avoids: [
      'Ne prescrit ni structures de données, ni stratégies asynchrones, ni flux de données global',
      'Ne prétend pas remplacer intégralement Redux, Zustand ou des solutions équivalentes',
    ],
  },
  es: {
    title: 'Límites de uso',
    fitsTitle: 'Buen encaje',
    fits: [
      'Cuando el estado local debe compartirse entre componentes, eleva el Hook a un Store',
      'Cuando se necesitan varias instancias aisladas, la posición de montaje del Provider define el alcance',
      'Cuando ya existe un External Store autorizado, conéctalo con bindStore sin copiar su snapshot',
    ],
    avoidsTitle: 'Fuera de alcance',
    avoids: [
      'No prescribe estructuras de datos, estrategias asíncronas ni flujos de datos globales',
      'No afirma reemplazar por completo a Redux, Zustand u otras soluciones de estado',
    ],
  },
}

export const cta: Record<string, HomeCta> = {
  zh: {
    title: '两条采用路径',
    humanTitle: '人工采用',
    humanLead: '用你的包管理器安装，然后跟着快速上手写出第一个 Store。',
    gettingStarted: '进入快速上手',
    agentTitle: 'Agent 采用',
    advancedTitle: '继续深入',
    advanced: [
      { label: '自动追踪与 selector', href: './guide/selectors' },
      { label: 'Store 组合', href: './guide/composition' },
      { label: 'bindStore', href: './guide/patterns' },
      { label: '迁移指南', href: './guide/migration' },
      { label: 'API 参考', href: './api/' },
      { label: 'Benchmark', href: 'https://github.com/violetflux/kerros/tree/main/benchmarks', external: true },
    ],
    externalNote: '（外部链接，将离开本站）',
  },
  en: {
    title: 'Two adoption paths',
    humanTitle: 'Human adoption',
    humanLead: 'Install with your package manager, then follow the quick start to build your first Store.',
    gettingStarted: 'Go to the quick start',
    agentTitle: 'Agent adoption',
    advancedTitle: 'Go deeper',
    advanced: [
      { label: 'Automatic tracking and selectors', href: './guide/selectors' },
      { label: 'Store composition', href: './guide/composition' },
      { label: 'bindStore', href: './guide/patterns' },
      { label: 'Migration guide', href: './guide/migration' },
      { label: 'API reference', href: './api/' },
      { label: 'Benchmarks', href: 'https://github.com/violetflux/kerros/tree/main/benchmarks', external: true },
    ],
    externalNote: ' (external link, leaves this site)',
  },
  ja: {
    title: '2 つの導入経路',
    humanTitle: '人が導入する',
    humanLead: 'パッケージマネージャーでインストールし、クイックスタートに従って最初の Store を作りましょう。',
    gettingStarted: 'クイックスタートへ',
    agentTitle: 'Agent に導入させる',
    advancedTitle: 'さらに詳しく',
    advanced: [
      { label: '自動追跡と selector', href: './guide/selectors' },
      { label: 'Store 構成', href: './guide/composition' },
      { label: 'bindStore', href: './guide/patterns' },
      { label: '移行ガイド', href: './guide/migration' },
      { label: 'API リファレンス', href: './api/' },
      { label: 'ベンチマーク', href: 'https://github.com/violetflux/kerros/tree/main/benchmarks', external: true },
    ],
    externalNote: '（外部リンク、サイトから離れます）',
  },
  ko: {
    title: '두 가지 도입 경로',
    humanTitle: '직접 도입',
    humanLead: '패키지 매니저로 설치한 다음 빠른 시작을 따라 첫 Store를 만들어 보세요.',
    gettingStarted: '빠른 시작으로 이동',
    agentTitle: 'Agent 도입',
    advancedTitle: '더 깊이 보기',
    advanced: [
      { label: '자동 추적과 selector', href: './guide/selectors' },
      { label: 'Store 조합', href: './guide/composition' },
      { label: 'bindStore', href: './guide/patterns' },
      { label: '마이그레이션 가이드', href: './guide/migration' },
      { label: 'API 레퍼런스', href: './api/' },
      { label: '벤치마크', href: 'https://github.com/violetflux/kerros/tree/main/benchmarks', external: true },
    ],
    externalNote: ' (외부 링크, 사이트를 떠납니다)',
  },
  de: {
    title: 'Zwei Einführungswege',
    humanTitle: 'Manuelle Einführung',
    humanLead: 'Mit deinem Paketmanager installieren und im Schnellstart den ersten Store bauen.',
    gettingStarted: 'Zum Schnellstart',
    agentTitle: 'Agent-Einführung',
    advancedTitle: 'Mehr Tiefe',
    advanced: [
      { label: 'Automatisches Tracking und Selektoren', href: './guide/selectors' },
      { label: 'Store-Komposition', href: './guide/composition' },
      { label: 'bindStore', href: './guide/patterns' },
      { label: 'Migrationsleitfaden', href: './guide/migration' },
      { label: 'API-Referenz', href: './api/' },
      { label: 'Benchmarks', href: 'https://github.com/violetflux/kerros/tree/main/benchmarks', external: true },
    ],
    externalNote: ' (externer Link, verlässt die Website)',
  },
  fr: {
    title: 'Deux voies d’adoption',
    humanTitle: 'Adoption manuelle',
    humanLead: 'Installez avec votre gestionnaire de paquets, puis suivez le démarrage rapide pour créer votre premier Store.',
    gettingStarted: 'Aller au démarrage rapide',
    agentTitle: 'Adoption par Agent',
    advancedTitle: 'Aller plus loin',
    advanced: [
      { label: 'Suivi automatique et sélecteurs', href: './guide/selectors' },
      { label: 'Composition de Stores', href: './guide/composition' },
      { label: 'bindStore', href: './guide/patterns' },
      { label: 'Guide de migration', href: './guide/migration' },
      { label: 'Référence API', href: './api/' },
      { label: 'Benchmarks', href: 'https://github.com/violetflux/kerros/tree/main/benchmarks', external: true },
    ],
    externalNote: ' (lien externe, quitte le site)',
  },
  es: {
    title: 'Dos vías de adopción',
    humanTitle: 'Adopción manual',
    humanLead: 'Instala con tu gestor de paquetes y sigue la guía de inicio para crear tu primer Store.',
    gettingStarted: 'Ir a la guía de inicio',
    agentTitle: 'Adopción por Agent',
    advancedTitle: 'Profundizar',
    advanced: [
      { label: 'Rastreo automático y selectores', href: './guide/selectors' },
      { label: 'Composición de Stores', href: './guide/composition' },
      { label: 'bindStore', href: './guide/patterns' },
      { label: 'Guía de migración', href: './guide/migration' },
      { label: 'Referencia de API', href: './api/' },
      { label: 'Benchmarks', href: 'https://github.com/violetflux/kerros/tree/main/benchmarks', external: true },
    ],
    externalNote: ' (enlace externo, sale del sitio)',
  },
}
