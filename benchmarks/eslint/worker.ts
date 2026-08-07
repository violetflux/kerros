import type { Linter } from 'eslint'
import { ESLint } from 'eslint'
import { performance } from 'node:perf_hooks'
import tseslint from 'typescript-eslint'
import { configs } from '../../packages/eslint-plugin-kerros/src'
import { aggregateLintStats } from './core'

type BenchmarkMode = 'baseline' | 'fast' | 'strict'

const project = readArgument('project')
const mode = readArgument('mode') as BenchmarkMode

if (!project || (mode !== 'baseline' && mode !== 'fast' && mode !== 'strict'))
  throw new Error('Usage: bun worker.ts --project=<path> --mode=baseline|fast|strict')

const config = createConfig(mode, project)
const eslint = new ESLint({
  concurrency: 'off',
  cwd: project,
  overrideConfig: [config],
  overrideConfigFile: true,
  stats: true,
})

/** Run one cold and one warm lint pass in the same isolated worker. */
async function measure() {
  const coldStarted = performance.now()
  const coldResults = await eslint.lintFiles(['src/**/*.{ts,tsx}'])
  const coldMs = performance.now() - coldStarted
  const warmStarted = performance.now()
  const warmResults = await eslint.lintFiles(['src/**/*.{ts,tsx}'])
  const warmMs = performance.now() - warmStarted
  const cold = aggregateLintStats(coldResults)
  const warm = aggregateLintStats(warmResults)
  return {
    coldRuleTimings: cold.ruleTimings,
    coldMs,
    errors: cold.errors + warm.errors,
    files: cold.files,
    mode,
    parseMs: cold.parseMs + warm.parseMs,
    peakRssMb: process.platform === 'darwin'
      ? process.resourceUsage().maxRSS / 1024 / 1024
      : process.resourceUsage().maxRSS / 1024,
    ruleTimings: warm.ruleTimings,
    totalMs: coldMs + warmMs,
    warmMs,
    warmRuleTimings: warm.ruleTimings,
    warnings: cold.warnings + warm.warnings,
  }
}

/** Build the typed parser baseline or one Kerros flat config for this project. */
function createConfig(mode: BenchmarkMode, tsconfigRootDir: string): Linter.Config {
  const base = mode === 'baseline'
    ? {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: { projectService: true },
        },
      }
    : mode === 'fast'
      ? configs.fastTypeChecked
      : configs.recommendedTypeChecked

  return {
    ...base,
    languageOptions: {
      ...base.languageOptions,
      parserOptions: {
        ...base.languageOptions?.parserOptions,
        projectService: true,
        tsconfigRootDir,
      },
    },
  } as Linter.Config
}

/** Read one equals-form CLI argument. */
function readArgument(name: string) {
  return process.argv.find(value => value.startsWith(`--${name}=`))
    ?.slice(name.length + 3)
}

console.log(JSON.stringify(await measure()))
