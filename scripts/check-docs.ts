import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import {
  boundary,
  capabilities,
  cta,
  evidence,
  examples,
  heroInstall,
  installPrompts,
  stories,
} from '../theme/home-content'

const locales = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es'] as const
const docsRoot = path.resolve(import.meta.dirname, '../docs')

/**
 * Read every Markdown route below a locale directory
 */
async function readRoutes(directory: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const routes: string[] = []

  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name)

    if (entry.isDirectory()) {
      routes.push(...await readRoutes(path.join(directory, entry.name), relativePath))
      continue
    }

    if (/\.(md|mdx)$/.test(entry.name))
      routes.push(relativePath)
  }

  return routes.sort()
}

const canonicalRoutes = await readRoutes(path.join(docsRoot, 'en'))

for (const locale of locales.slice(1)) {
  const routes = await readRoutes(path.join(docsRoot, locale))

  if (JSON.stringify(routes) !== JSON.stringify(canonicalRoutes)) {
    throw new Error(
      `${locale} documentation routes differ from the English source:\n`
      + `expected ${canonicalRoutes.join(', ')}\n`
      + `received ${routes.join(', ')}`,
    )
  }
}

const readmeByLocale = {
  de: 'README.de.md',
  en: 'README.md',
  es: 'README.es.md',
  fr: 'README.fr.md',
  ja: 'README.ja.md',
  ko: 'README.ko.md',
  zh: 'README.zh-CN.md',
} as const

for (const locale of locales) {
  const [readme, gettingStarted, selectors, composition, migration, api, patterns] = await Promise.all([
    readFile(path.resolve(docsRoot, '..', readmeByLocale[locale]), 'utf8'),
    readFile(path.join(docsRoot, locale, 'guide/getting-started.mdx'), 'utf8'),
    readFile(path.join(docsRoot, locale, 'guide/selectors.md'), 'utf8'),
    readFile(path.join(docsRoot, locale, 'guide/composition.md'), 'utf8'),
    readFile(path.join(docsRoot, locale, 'guide/migration.md'), 'utf8'),
    readFile(path.join(docsRoot, locale, 'api/index.md'), 'utf8'),
    readFile(path.join(docsRoot, locale, 'guide/patterns.md'), 'utf8'),
  ])

  if (!readme.includes('useCounter()'))
    throw new Error(`${readmeByLocale[locale]} must show selector-free automatic tracking by default`)
  if (!readme.includes('StoreGetter<TStore>') || !readme.includes('scope?: string | number | symbol'))
    throw new Error(`${readmeByLocale[locale]} must document the createStore getter and Provider scope`)
  if (!gettingStarted.includes('useTask()'))
    throw new Error(`${locale} getting-started must show selector-free automatic tracking by default`)
  if (!gettingStarted.includes('getTask'))
    throw new Error(`${locale} getting-started must introduce the createStore getter`)
  if (!selectors.includes('useSettings()') && locale !== 'en' && locale !== 'zh')
    throw new Error(`${locale} tracking guide must show selector-free automatic tracking by default`)
  if ((locale === 'en' || locale === 'zh') && !selectors.includes('useUser()'))
    throw new Error(`${locale} tracking guide must show selector-free automatic tracking by default`)
  if (!selectors.includes('const snapshot ='))
    throw new Error(`${locale} tracking guide must allow render-local snapshot variables`)
  if (selectors.includes('Do not save, return, spread, serialize, or pass the complete result')
    || selectors.includes('不要保存、返回、展开、序列化或传递完整结果')) {
    throw new Error(`${locale} tracking guide still forbids valid render-chain snapshot use`)
  }
  if (/use(?:Account|Session)\(s =>/.test(`${gettingStarted}\n${composition}`))
    throw new Error(`${locale} default Store composition still requires an explicit selector`)
  if (!migration.includes('useCounter()'))
    throw new Error(`${locale} migration guide must show selector-free automatic tracking by default`)
  if (api.includes('useStream(selector)') || patterns.includes('useStream(selector)'))
    throw new Error(`${locale} bindStore documentation still requires an explicit selector`)
  if (!api.includes('StoreGetter<TStore>')
    || !api.includes('scope="main"')
    || !/get(?:Counter|Theme)\('main'\)/.test(api)
    || !api.includes('Object.is')) {
    throw new Error(`${locale} API reference must document committed scoped Store getter lookup`)
  }
}

const skill = await readFile(path.resolve(docsRoot, '../skills/kerros/SKILL.md'), 'utf8')
if (!skill.includes('const { count, increment } = useCounter()'))
  throw new Error('Kerros Skill must teach selector-free automatic tracking by default')
if (!skill.includes('getCounter(\'main\').increment()') || !skill.includes('does not subscribe'))
  throw new Error('Kerros Skill must teach imperative scoped Store getter boundaries')
if (skill.includes('Require every Store read to use an object selector'))
  throw new Error('Kerros Skill still requires selectors for every Store read')

const homepageTheme = await readFile(path.resolve(docsRoot, '../theme/index.tsx'), 'utf8')
if (!homepageTheme.includes('<ShaderBackground />'))
  throw new Error('Homepage must render the shader background')
if (!homepageTheme.includes('<InstallSwitcher lang={lang} />'))
  throw new Error('Homepage must render the package-manager install switcher')
if (!homepageTheme.includes('labels.docsLabel') || !homepageTheme.includes('labels.githubLabel'))
  throw new Error('Homepage must keep the docs and GitHub entry points')
if (homepageTheme.includes('ExampleSection') || homepageTheme.includes('HomeFooter'))
  throw new Error('Homepage must remain a single-screen install experience without extra sections')

// Homepage content layer: every locale-keyed Record must cover all seven locales.
// Per design.md §13.4 the homepage is now a minimal install-first screen, so
// stories/capabilities/evidence/boundary/cta are no longer rendered there, but
// their data stays in theme/home-content.ts for reuse. The validations below
// are an intentional contract guardrail: they keep the retained copy complete
// and translated so the narrative sections can be restored without rework.
const homeContentSections = {
  boundary,
  capabilities,
  cta,
  evidence,
  examples,
  heroInstall,
  installPrompts,
  stories,
} as const

for (const [name, section] of Object.entries(homeContentSections)) {
  for (const locale of locales) {
    if (!(locale in section))
      throw new Error(`home-content ${name} is missing the ${locale} entry`)
  }
}

// Field-level non-empty checks for the copy rendered on the install-first hero
for (const locale of locales) {
  const hero = heroInstall[locale]
  const heroFields = ['title', 'tagline', 'switcherLabel', 'docsLabel', 'githubLabel'] as const
  for (const field of heroFields) {
    if (!hero[field].trim())
      throw new Error(`${locale} homepage heroInstall must keep its ${field} field filled`)
  }

  const prompts = installPrompts[locale]
  const promptFields = ['label', 'prompt', 'copy', 'copied', 'error', 'retry'] as const
  for (const field of promptFields) {
    if (!prompts[field].trim())
      throw new Error(`${locale} homepage installPrompts must keep its ${field} field filled`)
  }

  const example = examples[locale]
  if (!example.title.trim() || !example.description.trim())
    throw new Error(`${locale} homepage examples must keep title and description filled`)
}

// Capability cards are organised as purpose / trigger / input / output / success
const capabilityFields = ['purpose', 'trigger', 'input', 'output', 'success'] as const

for (const locale of locales) {
  const group = capabilities[locale]

  if (group.cards.length !== 5)
    throw new Error(`${locale} homepage must present exactly five capabilities, received ${group.cards.length}`)

  for (const card of group.cards) {
    const subject = card.title.trim() ? `"${card.title.trim()}"` : 'an untitled card'

    if (!card.title.trim())
      throw new Error(`${locale} homepage capability card must have a title`)

    for (const field of capabilityFields) {
      if (!card[field].trim())
        throw new Error(`${locale} homepage capability ${subject} must fill its ${field} field`)
    }
  }
}

for (const locale of locales) {
  const section = evidence[locale]

  if (!section.title.trim())
    throw new Error(`${locale} homepage evidence section needs a title`)
  if (section.items.length === 0)
    throw new Error(`${locale} homepage evidence must list concrete proof`)
  for (const item of section.items) {
    if (!item.title.trim() || !item.detail.trim())
      throw new Error(`${locale} homepage evidence item must keep title and detail filled`)
  }
  if (!section.benchmarkTitle.trim() || !section.benchmarkDetail.trim()
    || !section.benchmarkSource.trim() || !section.benchmarkHref.trim())
    throw new Error(`${locale} homepage evidence must keep the benchmark description complete`)
  if (!section.note.trim())
    throw new Error(`${locale} homepage evidence must keep the volatility note`)
}

for (const locale of locales) {
  const section = boundary[locale]

  if (!section.title.trim() || !section.fitsTitle.trim() || !section.avoidsTitle.trim())
    throw new Error(`${locale} homepage boundary section needs filled titles`)
  if (section.fits.length === 0 || section.fits.some(fit => !fit.trim()))
    throw new Error(`${locale} homepage boundary must list what Kerros fits`)
  if (section.avoids.length === 0 || section.avoids.some(avoid => !avoid.trim()))
    throw new Error(`${locale} homepage boundary must list what Kerros avoids`)
}

for (const locale of locales) {
  const section = cta[locale]

  if (!section.title.trim() || !section.humanTitle.trim() || !section.humanLead.trim()
    || !section.gettingStarted.trim() || !section.agentTitle.trim()
    || !section.advancedTitle.trim() || !section.externalNote.trim()) {
    throw new Error(`${locale} homepage call-to-action must stay fully translated`)
  }
  if (section.advanced.length === 0
    || section.advanced.some(link => !link.label.trim() || !link.href.trim()))
    throw new Error(`${locale} homepage call-to-action must keep its advanced links filled`)
}

for (const locale of locales) {
  const paragraphs = stories[locale].paragraphs.filter(paragraph => paragraph.trim())

  if (paragraphs.length < 3)
    throw new Error(`${locale} homepage story must keep at least three non-empty paragraphs, received ${paragraphs.length}`)
}

// Site configuration must keep the Hook-native positioning and never regress to selector-first
const siteConfig = await readFile(path.resolve(docsRoot, '../rspress.config.ts'), 'utf8')
const selectorFirstPhrases = [
  'selector-first',
  'selector 중심',
  'centrés sur les sélecteurs',
  'centrados en selectores',
] as const

for (const phrase of selectorFirstPhrases) {
  if (siteConfig.includes(phrase))
    throw new Error(`rspress.config.ts must not revert site positioning to selector-first ("${phrase}")`)
}
if (/セレクタ[^\n]{0,6}ファースト/.test(siteConfig))
  throw new Error('rspress.config.ts must not revert site positioning to selector-first (セレクタファースト)')

console.log(`Documentation parity verified for ${locales.length} locales`)
