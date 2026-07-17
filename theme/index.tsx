import type { HomeLayoutProps } from '@rspress/core/theme-original'
import { useLang } from '@rspress/core/runtime'
import { HomeLayout as OriginalHomeLayout } from '@rspress/core/theme-original'
import { useState } from 'react'
import './styles.css'

export * from '@rspress/core/theme-original'

interface HomeStory {
  /** Section title */
  title: string
  /** Positioning paragraphs */
  paragraphs: string[]
  /** Call-to-action label */
  action: string
}

interface HomeExample {
  /** Section title */
  title: string
  /** Short usage explanation */
  description: string
}

interface HomeInstallPrompt {
  /** Prompt field label */
  label: string
  /** Instruction copied into Codex */
  prompt: string
  /** Copy button label */
  copy: string
  /** Successful copy state */
  copied: string
}

const exampleCode = `const [useCounter, CounterProvider] = createStore(() => {
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

<CounterProvider>
  <Counter />
</CounterProvider>`

const examples: Record<string, HomeExample> = {
  zh: {
    title: '三步就能共享状态',
    description: '把普通 Hook 交给 createStore，挂载 Provider，然后选择组件真正需要的数据。',
  },
  en: {
    title: 'Share state in three steps',
    description: 'Pass an ordinary Hook to createStore, mount its Provider, then select exactly what the component needs.',
  },
  ja: {
    title: '3 ステップで状態を共有',
    description: '通常の Hook を createStore に渡し、Provider を配置して、コンポーネントに必要な値だけを選択します。',
  },
  ko: {
    title: '세 단계로 상태 공유',
    description: '평범한 Hook을 createStore에 전달하고 Provider를 마운트한 다음 컴포넌트에 필요한 값만 선택하세요.',
  },
  de: {
    title: 'State in drei Schritten teilen',
    description: 'Übergib einen normalen Hook an createStore, binde den Provider ein und wähle genau die benötigten Werte aus.',
  },
  fr: {
    title: 'Partager un état en trois étapes',
    description: 'Passez un Hook ordinaire à createStore, montez son Provider, puis sélectionnez uniquement les valeurs nécessaires.',
  },
  es: {
    title: 'Comparte estado en tres pasos',
    description: 'Pasa un Hook normal a createStore, monta su Provider y selecciona exactamente los valores necesarios.',
  },
}

const installPrompts: Record<string, HomeInstallPrompt> = {
  zh: {
    label: '复制给 Codex，一次装好依赖和 Skill',
    prompt: '使用当前项目的包管理器安装 @violetflux/kerros，然后运行 npx skills add violetflux/kerros --skill kerros --agent codex -y。',
    copy: '复制',
    copied: '已复制',
  },
  en: {
    label: 'Paste into Codex to install the package and Skill',
    prompt: 'Install @violetflux/kerros with this project\'s package manager, then run npx skills add violetflux/kerros --skill kerros --agent codex -y.',
    copy: 'Copy',
    copied: 'Copied',
  },
  ja: {
    label: 'Codex に貼り付けてパッケージと Skill をインストール',
    prompt: 'このプロジェクトのパッケージマネージャーで @violetflux/kerros をインストールし、npx skills add violetflux/kerros --skill kerros --agent codex -y を実行してください。',
    copy: 'コピー',
    copied: 'コピー済み',
  },
  ko: {
    label: 'Codex에 붙여넣어 패키지와 Skill 설치',
    prompt: '현재 프로젝트의 패키지 매니저로 @violetflux/kerros를 설치한 다음 npx skills add violetflux/kerros --skill kerros --agent codex -y를 실행하세요.',
    copy: '복사',
    copied: '복사됨',
  },
  de: {
    label: 'In Codex einfügen und Paket plus Skill installieren',
    prompt: 'Installiere @violetflux/kerros mit dem Paketmanager dieses Projekts und führe danach npx skills add violetflux/kerros --skill kerros --agent codex -y aus.',
    copy: 'Kopieren',
    copied: 'Kopiert',
  },
  fr: {
    label: 'Collez dans Codex pour installer le paquet et le Skill',
    prompt: 'Installe @violetflux/kerros avec le gestionnaire de paquets du projet, puis exécute npx skills add violetflux/kerros --skill kerros --agent codex -y.',
    copy: 'Copier',
    copied: 'Copié',
  },
  es: {
    label: 'Pega en Codex para instalar el paquete y el Skill',
    prompt: 'Instala @violetflux/kerros con el gestor de paquetes del proyecto y después ejecuta npx skills add violetflux/kerros --skill kerros --agent codex -y.',
    copy: 'Copiar',
    copied: 'Copiado',
  },
}

const stories: Record<string, HomeStory> = {
  zh: {
    title: '从状态管理到状态共享',
    paragraphs: [
      '不妨回想一下 Redux、Zustand、Recoil 这些状态管理库。它们当然也能解决数据共享问题，但最核心的能力仍然是组织数据、操作数据和约束数据流，因此它们被称作“状态管理”工具。',
      'Kerros 想解决的问题更小，也更直接。它不发明新的数据结构，不规定异步和数据流应该怎么写，只聚焦一个痛点：如何在多个 React 组件间共享一段 Hook 状态。',
      '直接使用 React Context 共享变化频繁的状态时，Context value 每次变化都会让所有消费者重新渲染。Kerros 保留 Provider 的作用域和多实例能力，但让组件通过 selector 只订阅自己真正需要的数据。',
      '如果你已经发现，层层传递 value、onChange 会不断侵蚀组件边界，而把所有数据都塞进一个全局 Store 也不会自然带来可维护性，那么 Kerros 或许正适合你。',
      '它简单、轻量、可靠。先把状态写成普通 Hook，需要共享时再交给 createStore；Provider 决定状态共享到哪里，selector 决定每个组件订阅什么。',
    ],
    action: '开始使用 Kerros',
  },
  en: {
    title: 'From state management to state sharing',
    paragraphs: [
      'Think about libraries such as Redux, Zustand, and Recoil. They can certainly share data, but their central job is still to organize state, update it, and define how data flows. “State management” is the right name for them.',
      'Kerros focuses on a smaller and more direct problem. It does not invent a new data model or prescribe how async logic should work. It answers one question: how can a piece of Hook state be shared between React components?',
      'When frequently changing state is shared through React Context directly, every Context value change rerenders all consumers. Kerros keeps Provider scoping and multiple instances, while selectors let each component subscribe only to the data it needs.',
      'Passing value and onChange through layer after layer damages component boundaries. Moving everything into one global Store does not automatically make an application maintainable either.',
      'Kerros stays simple, lightweight, and reliable. Write local state as an ordinary Hook, pass it to createStore when it needs to be shared, use a Provider to set its scope, and use selectors to choose what each component observes.',
    ],
    action: 'Get started with Kerros',
  },
}

/** Render the one-line Codex installation prompt */
function CodexInstallPrompt({ lang }: { lang: string }) {
  const content = installPrompts[lang] ?? installPrompts.en
  const [copied, setCopied] = useState(false)

  /** Copy the full installation instruction for Codex */
  const copy = async () => {
    await navigator.clipboard.writeText(content.prompt)
    setCopied(true)
  }

  return (
    <div className="kerros-install-prompt">
      <span className="kerros-install-prompt__label">{content.label}</span>
      <div className="kerros-install-prompt__field">
        <code>{content.prompt}</code>
        <button type="button" onClick={copy} aria-live="polite">
          {copied ? content.copied : content.copy}
        </button>
      </div>
    </div>
  )
}

/** Render the default home page with Kerros positioning content */
export function HomeLayout(props: HomeLayoutProps) {
  const lang = useLang()
  const story = stories[lang]
  const example = examples[lang] ?? examples.en

  return (
    <OriginalHomeLayout
      {...props}
      beforeHeroActions={(
        <>
          {props.beforeHeroActions}
          <CodexInstallPrompt lang={lang} />
        </>
      )}
      beforeFeatures={(
        <>
          {props.beforeFeatures}
          <section className="kerros-home-example">
            <div className="kerros-home-example__inner">
              <div className="kerros-home-example__intro">
                <p className="kerros-home-example__eyebrow">createStore · Provider · selector</p>
                <h2>{example.title}</h2>
                <p>{example.description}</p>
              </div>
              <pre className="kerros-home-example__code"><code>{exampleCode}</code></pre>
            </div>
          </section>
        </>
      )}
      afterFeatures={(
        <>
          {props.afterFeatures}
          {story && (
            <section className="kerros-home-story">
              <div className="kerros-home-story__inner">
                <p className="kerros-home-story__eyebrow">Kerros</p>
                <h2>{story.title}</h2>
                <div className="kerros-home-story__content">
                  {story.paragraphs.map(paragraph => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <a className="kerros-home-story__action" href="./guide/getting-started">
                  {story.action}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </section>
          )}
        </>
      )}
    />
  )
}
