import type { HomeLayoutProps } from '@rspress/core/theme-original'
import {
  IconAlertTriangle,
  IconBook,
  IconBrandGithub,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconRefresh,
} from '@tabler/icons-react'
import { useLang } from '@rspress/core/runtime'
import { HomeLayout as OriginalHomeLayout } from '@rspress/core/theme-original'
import { useState } from 'react'
import { Segmented } from './components/segmented'
import { ShaderBackground } from './components/shader-background'
import { cta, examples, heroInstall, installCommands, installPrompts } from './home-content'
import './styles.css'

export * from '@rspress/core/theme-original'

type CopyStatus = 'idle' | 'copied' | 'error'
type ExampleTokenKind = 'keyword' | 'constant' | 'function' | 'string' | 'punctuation'
type ExampleToken = [content: string, kind?: ExampleTokenKind]

const exampleCodeTokens: ExampleToken[][] = [
  [['import', 'keyword'], [' { createStore } '], ['from', 'keyword'], [' '], ['\'@violetflux/kerros\'', 'string']],
  [['import', 'keyword'], [' { useState } '], ['from', 'keyword'], [' '], ['\'react\'', 'string']],
  [],
  [['function', 'keyword'], [' '], ['useCounterModel', 'function'], ['() {']],
  [
    ['  '], ['const', 'keyword'], [' ['], ['count', 'constant'], [',', 'punctuation'], [' '],
    ['setCount', 'constant'], ['] '], ['=', 'keyword'], [' '], ['useState', 'function'],
    ['('], ['0', 'constant'], [')'],
  ],
  [['  '], ['return', 'keyword'], [' { count'], [',', 'punctuation'], [' setCount }']],
  [['}']],
  [],
  [
    ['const', 'keyword'], [' ['], ['useCounter', 'constant'], [',', 'punctuation'], [' '],
    ['CounterProvider', 'constant'], ['] '], ['=', 'keyword'], [' '], ['createStore', 'function'],
    ['('], ['useCounterModel', 'function'], [')'],
  ],
  [],
  [['function', 'keyword'], [' '], ['Counter', 'function'], ['() {']],
  [
    ['  '], ['const', 'keyword'], [' { '], ['count', 'constant'], [',', 'punctuation'], [' '],
    ['setCount', 'constant'], [' } '], ['=', 'keyword'], [' '], ['useCounter', 'function'],
    ['()'],
  ],
  [],
  [
    ['  '], ['return', 'keyword'], [' <'], ['button', 'string'], [' '], ['onClick', 'function'],
    ['=', 'keyword'], ['{() '], ['=>', 'keyword'], [' '], ['setCount', 'function'], ['(count '],
    ['+', 'keyword'], [' '], ['1', 'constant'], [')}>{count}</'], ['button', 'string'], ['>'],
  ],
  [['}']],
  [],
  [['<'], ['CounterProvider', 'constant'], ['>']],
  [['  <'], ['Counter', 'constant'], [' />']],
  [['</'], ['CounterProvider', 'constant'], ['>']],
]

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

function useCopy(text: string) {
  const [status, setStatus] = useState<CopyStatus>('idle')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    }
    catch {
      setStatus('error')
    }
  }

  return { copy, reset: () => setStatus('idle'), status }
}

function InstallSwitcher({ lang }: { lang: string }) {
  const labels = heroInstall[lang] ?? heroInstall.en
  const prompts = installPrompts[lang] ?? installPrompts.en
  const [manager, setManager] = useState(() => installCommands[0]?.manager ?? '')
  const selectedCommand = installCommands.find(entry => entry.manager === manager)?.command ?? ''
  const { copy, reset, status } = useCopy(selectedCommand)

  const handleManagerChange = (next: string) => {
    setManager(next)
    reset()
  }

  return (
    <section aria-label={labels.switcherLabel} className="kerros-install">
      <Segmented
        ariaLabel={labels.switcherLabel}
        onChange={handleManagerChange}
        options={installCommands.map(entry => ({ label: entry.manager, value: entry.manager }))}
        value={manager}
      />

      <div className="kerros-command">
        <span aria-hidden="true" className="kerros-command__prompt">$</span>
        <code>{selectedCommand}</code>
        <button
          aria-label={status === 'error' ? prompts.retry : prompts.copy}
          className={`kerros-command__copy ${FOCUS_RING}`}
          onClick={copy}
          type="button"
        >
          {status === 'copied'
            ? <IconCheck aria-hidden="true" size={18} />
            : status === 'error'
              ? <IconRefresh aria-hidden="true" size={18} />
              : <IconCopy aria-hidden="true" size={18} />}
          <span>{status === 'copied' ? prompts.copied : status === 'error' ? prompts.retry : prompts.copy}</span>
        </button>
      </div>

      <p aria-live="polite" className="kerros-install__status" role="status">
        {status === 'copied' && <span><IconCheck aria-hidden="true" size={14} />{prompts.copied}</span>}
        {status === 'error' && <span><IconAlertTriangle aria-hidden="true" size={14} />{prompts.error}</span>}
      </p>
    </section>
  )
}

function HighlightedExample() {
  return (
    <pre className="kerros-home-example__code"><code>
      {exampleCodeTokens.map((line, lineIndex) => (
        <span className="kerros-home-example__line" key={lineIndex}>
          {line.map(([content, kind], tokenIndex) => (
            <span className={kind && `kerros-token--${kind}`} key={tokenIndex}>{content}</span>
          ))}
          {lineIndex < exampleCodeTokens.length - 1 && '\n'}
        </span>
      ))}
    </code></pre>
  )
}

function KerrosHome() {
  const lang = useLang()
  const labels = heroInstall[lang] ?? heroInstall.en
  const example = examples[lang] ?? examples.en
  const externalNote = (cta[lang] ?? cta.en).externalNote

  return (
    <main className="kerros-landing">
      <ShaderBackground />
      <div aria-hidden="true" className="kerros-landing__veil" />

      <div className="kerros-landing__content">
        <p className="kerros-landing__eyebrow">KERROS · REACT STATE SHARING</p>
        <h1>{labels.title}</h1>
        <InstallSwitcher lang={lang} />

        <nav aria-label="Kerros resources" className="kerros-actions">
          <a className={`kerros-action kerros-action--primary ${FOCUS_RING}`} href="./guide/getting-started">
            <IconBook aria-hidden="true" size={19} stroke={1.8} />
            {labels.docsLabel}
          </a>
          <a
            className={`kerros-action kerros-action--secondary ${FOCUS_RING}`}
            href="https://github.com/violetflux/kerros"
            rel="noopener noreferrer"
            target="_blank"
          >
            <IconBrandGithub aria-hidden="true" size={20} stroke={1.8} />
            {labels.githubLabel}
            <IconExternalLink aria-hidden="true" size={15} stroke={1.8} />
            <span className="sr-only">{externalNote}</span>
          </a>
        </nav>

        <section aria-label={example.title} className="kerros-home-example">
          <HighlightedExample />
        </section>
      </div>
    </main>
  )
}

export function HomeLayout(props: HomeLayoutProps) {
  if (import.meta.env.SSG_MD)
    return <OriginalHomeLayout {...props} />

  return <KerrosHome />
}
