import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const supportedFileCounts = [100, 1_000, 5_000] as const

interface TimedLintResult {
  errorCount: number
  stats?: {
    times: {
      passes: Array<{
        parse: { total: number }
        rules?: Record<string, { total: number }>
      }>
    }
  }
  warningCount: number
}

/** Describe one generated benchmark profile without allocating its sources. */
export function getProfile(files: number) {
  assertSupportedFileCount(files)

  return {
    files,
    generatedStores: files * 2,
  }
}

/** Generate a deterministic typed project with Stores, selectors, Effects and re-exports. */
export function createProjectFiles(count: number) {
  assertSupportedFileCount(count)
  const files = new Map<string, string>()

  for (let index = 0; index < count; index += 1) {
    const previous = index - 1
    const hasDependency = index % 20 !== 0
    const dependencyImport = hasDependency
      ? `import { useStore${previous}A } from './case-${previous}'\n`
      : ''
    const dependencyRead = hasDependency
      ? `const { value: parentValue } = useStore${previous}A()`
      : 'const parentValue = 0'
    const reexport = hasDependency
      ? `export { useStore${previous}A as usePreviousStore${index} } from './case-${previous}'\n`
      : ''

    files.set(`src/case-${index}.tsx`, `${dependencyImport}import type { ReactNode } from 'react'
import { createStore } from '@violetflux/kerros'
import { useEffect, useEffectEvent, useState } from 'react'

${reexport}

function useStore${index}AModel() {
  ${dependencyRead}
  const [value, setValue] = useState(parentValue)
  return { nested: { value }, setValue, value }
}

function useStore${index}BModel() {
  const { value } = useStore${index}A()
  const [enabled, setEnabled] = useState(false)
  return { enabled, setEnabled, value }
}

export const [useStore${index}A, Store${index}AProvider] = createStore(useStore${index}AModel)
export const [useStore${index}B, Store${index}BProvider] = createStore(useStore${index}BModel)

export function Component${index}() {
  const { nested, setValue } = useStore${index}A(s => ({ nested: s.nested, setValue: s.setValue }))
  const { enabled } = useStore${index}B()
  const onTick = useEffectEvent(() => setValue(nested.value + 1))

  useEffect(() => {
    if (enabled)
      onTick()
  }, [enabled])

  return <button onClick={() => setValue(nested.value + 1)}>{nested.value}</button>
}

export function Tree${index}({ children }: { children: ReactNode }) {
  return (
    <Store${index}AProvider>
      <Store${index}BProvider>{children}</Store${index}BProvider>
    </Store${index}AProvider>
  )
}
`)
  }

  return files
}

/** Calculate percentage overhead relative to the typed parser baseline. */
export function calculateOverhead(baseline: number, measured: number) {
  if (baseline <= 0)
    return 0

  return ((measured - baseline) / baseline) * 100
}

/** Return the middle sample so startup and GC outliers do not dominate results. */
export function median(values: number[]) {
  if (values.length === 0)
    return 0

  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

/** Rotate mode order so every mode pays first-run filesystem costs equally. */
export function rotateValues<T>(values: readonly T[], offset: number) {
  if (values.length === 0)
    return []

  const start = ((offset % values.length) + values.length) % values.length
  return [...values.slice(start), ...values.slice(0, start)]
}

/** Sort rule timings by plugin-time share for threshold analysis. */
export function summarizeRuleTimings(
  totalPluginTime: number,
  timings: Record<string, number>,
) {
  return Object.entries(timings)
    .map(([name, timeMs]) => ({
      name,
      percent: totalPluginTime <= 0 ? 0 : (timeMs / totalPluginTime) * 100,
      timeMs,
    }))
    .sort((left, right) => right.timeMs - left.timeMs)
}

/** Aggregate ESLint's per-file stats into one reproducible benchmark sample. */
export function aggregateLintStats(input: unknown[]) {
  const results = input as TimedLintResult[]
  const ruleTimings: Record<string, number> = {}
  let errors = 0
  let parseMs = 0
  let warnings = 0

  for (const result of results) {
    errors += result.errorCount
    warnings += result.warningCount

    for (const pass of result.stats?.times.passes ?? []) {
      parseMs += pass.parse.total

      for (const [name, timing] of Object.entries(pass.rules ?? {}))
        ruleTimings[name] = (ruleTimings[name] ?? 0) + timing.total
    }
  }

  return {
    errors,
    files: results.length,
    parseMs,
    ruleTimings,
    warnings,
  }
}

/** Materialize one generated project under an explicit disposable root. */
export async function writeGeneratedProject(
  root: string,
  count: number,
  kerrosEntry: string,
) {
  const files = createProjectFiles(count)
  const sourceDir = join(root, 'src')
  await mkdir(sourceDir, { recursive: true })

  await Promise.all([...files].map(async ([name, source]) => {
    const destination = join(root, name)
    await writeFile(destination, source)
  }))

  await writeFile(join(root, 'tsconfig.json'), `${JSON.stringify({
    compilerOptions: {
      baseUrl: '.',
      jsx: 'react-jsx',
      lib: ['ES2022', 'DOM'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      noEmit: true,
      paths: {
        '@violetflux/kerros': [kerrosEntry],
      },
      strict: true,
      target: 'ES2022',
    },
    include: ['src/**/*.ts', 'src/**/*.tsx'],
  }, null, 2)}\n`)
}

/** Reject accidental profiles that make checked-in scripts unpredictably expensive. */
function assertSupportedFileCount(count: number) {
  if (!supportedFileCounts.includes(count as typeof supportedFileCounts[number]))
    throw new Error(`Unsupported ESLint benchmark size: ${count}`)
}
