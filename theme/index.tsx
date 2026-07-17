import type { HomeLayoutProps } from '@rspress/core/theme-original'
import { useLang } from '@rspress/core/runtime'
import { HomeLayout as OriginalHomeLayout } from '@rspress/core/theme-original'
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

const stories: Record<string, HomeStory> = {
  zh: {
    title: '从状态管理到状态共享',
    paragraphs: [
      '不妨回想一下 Redux、Zustand、Recoil 这些状态管理库。它们当然也能解决数据共享问题，但最核心的能力仍然是组织数据、操作数据和约束数据流，因此它们被称作“状态管理”工具。',
      'Kerros 想解决的问题更小，也更直接。它不发明新的数据结构，不规定异步和数据流应该怎么写，只聚焦一个痛点：如何在多个 React 组件间共享一段 Hook 状态。',
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
      'Passing value and onChange through layer after layer damages component boundaries. Moving everything into one global Store does not automatically make an application maintainable either.',
      'Kerros stays simple, lightweight, and reliable. Write local state as an ordinary Hook, pass it to createStore when it needs to be shared, use a Provider to set its scope, and use selectors to choose what each component observes.',
    ],
    action: 'Get started with Kerros',
  },
}

/** Render the default home page with Kerros positioning content */
export function HomeLayout(props: HomeLayoutProps) {
  const lang = useLang()
  const story = stories[lang]

  return (
    <OriginalHomeLayout
      {...props}
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
