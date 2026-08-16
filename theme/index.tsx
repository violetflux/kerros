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
import { cta, heroInstall, installCommands, installPrompts } from './home-content'
import './styles.css'

export * from '@rspress/core/theme-original'

type CopyStatus = 'idle' | 'copied' | 'error'

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

function KerrosHome() {
  const lang = useLang()
  const labels = heroInstall[lang] ?? heroInstall.en
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
      </div>
    </main>
  )
}

export function HomeLayout(props: HomeLayoutProps) {
  if (import.meta.env.SSG_MD)
    return <OriginalHomeLayout {...props} />

  return <KerrosHome />
}
