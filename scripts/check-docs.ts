import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

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
  if (!gettingStarted.includes('useTask()'))
    throw new Error(`${locale} getting-started must show selector-free automatic tracking by default`)
  if (!selectors.includes('useSettings()') && locale !== 'en' && locale !== 'zh')
    throw new Error(`${locale} tracking guide must show selector-free automatic tracking by default`)
  if ((locale === 'en' || locale === 'zh') && !selectors.includes('useUser()'))
    throw new Error(`${locale} tracking guide must show selector-free automatic tracking by default`)
  if (/use(?:Account|Session)\(s =>/.test(`${gettingStarted}\n${composition}`))
    throw new Error(`${locale} default Store composition still requires an explicit selector`)
  if (!migration.includes('useCounter()'))
    throw new Error(`${locale} migration guide must show selector-free automatic tracking by default`)
  if (api.includes('useStream(selector)') || patterns.includes('useStream(selector)'))
    throw new Error(`${locale} bindStore documentation still requires an explicit selector`)
}

const skill = await readFile(path.resolve(docsRoot, '../skills/kerros/SKILL.md'), 'utf8')
if (!skill.includes('const { count, increment } = useCounter()'))
  throw new Error('Kerros Skill must teach selector-free automatic tracking by default')
if (skill.includes('Require every Store read to use an object selector'))
  throw new Error('Kerros Skill still requires selectors for every Store read')

const homepageTheme = await readFile(path.resolve(docsRoot, '../theme/index.tsx'), 'utf8')
if (!homepageTheme.includes("['useCounter', 'function'],\n    ['()'],"))
  throw new Error('Homepage example must show selector-free automatic tracking')
if (homepageTheme.includes("['(s ']"))
  throw new Error('Homepage example still requires an explicit selector')
if (!homepageTheme.includes('createStore · Provider · auto tracking'))
  throw new Error('Homepage positioning must identify automatic tracking as the default')

console.log(`Documentation parity verified for ${locales.length} locales`)
