import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const sourceExtensions = new Set(['.md', '.mdx', '.ts', '.tsx'])
const ignoredDirectories = new Set([
  '.git',
  '.vscode',
  'coverage',
  'dist',
  'doc_build',
  'node_modules',
])
const storeHookDeclarationPattern
  = /\bconst\s*\[\s*(use[A-Z]\w*)\s*,[\s\S]{0,300}?\]\s*=\s*(?:bindStore|createStore)\b/g

/**
 * Read source and documentation files that can contain Store selectors
 */
async function readSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name))
        files.push(...await readSourceFiles(path.join(directory, entry.name)))

      continue
    }

    if (sourceExtensions.has(path.extname(entry.name)))
      files.push(path.join(directory, entry.name))
  }

  return files
}

const files = await readSourceFiles(root)
const sources = await Promise.all(files.map(async file => ({
  content: await readFile(file, 'utf8'),
  file,
})))
const storeHooks = new Set<string>()

for (const { content } of sources) {
  for (const match of content.matchAll(storeHookDeclarationPattern))
    storeHooks.add(match[1])
}

const diagnostics: string[] = []

for (const hook of storeHooks) {
  const selectorPattern = new RegExp(
    `\\b${hook}\\(\\s*(?:\\(\\s*([A-Za-z_$][\\w$]*)[^)]*\\)|([A-Za-z_$][\\w$]*))\\s*=>`,
    'g',
  )

  for (const { content, file } of sources) {
    for (const match of content.matchAll(selectorPattern)) {
      const parameter = match[1] ?? match[2]

      if (parameter === 's')
        continue

      const line = content.slice(0, match.index).split('\n').length
      diagnostics.push(`${path.relative(root, file)}:${line} ${hook} selector 参数应命名为 s`)
    }
  }
}

if (diagnostics.length > 0)
  throw new Error(`Store selector 命名检查失败：\n${diagnostics.join('\n')}`)

console.log(`Store selector naming verified across ${sources.length} files`)
