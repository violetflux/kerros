import { readdir } from 'node:fs/promises'
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

console.log(`Documentation parity verified for ${locales.length} locales`)
