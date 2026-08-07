import { existsSync } from 'node:fs'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

interface BenchmarkCore {
  aggregateLintStats: (results: unknown[]) => {
    errors: number
    files: number
    parseMs: number
    ruleTimings: Record<string, number>
    warnings: number
  }
  calculateOverhead: (baseline: number, measured: number) => number
  createProjectFiles: (count: number) => Map<string, string>
  getProfile: (count: number) => { files: number, generatedStores: number }
  median: (values: number[]) => number
  rotateValues: <T>(values: readonly T[], offset: number) => T[]
  summarizeRuleTimings: (
    totalPluginTime: number,
    timings: Record<string, number>,
  ) => Array<{ name: string, percent: number, timeMs: number }>
  writeGeneratedProject: (root: string, count: number, kerrosEntry: string) => Promise<void>
}

const corePath = fileURLToPath(new URL('./core.ts', import.meta.url))

async function loadCore() {
  expect(existsSync(corePath)).toBe(true)
  if (!existsSync(corePath))
    return undefined

  return await import(new URL('./core.ts', import.meta.url).href) as BenchmarkCore
}

describe('ESLint benchmark core', () => {
  it('generates the requested typed TS/TSX project with realistic Kerros patterns', async () => {
    const core = await loadCore()
    if (!core)
      return

    const files = core.createProjectFiles(100)
    const sources = [...files.values()].join('\n')

    expect(files.size).toBe(100)
    expect([...files.keys()].filter(name => name.endsWith('.tsx')).length).toBeGreaterThan(0)
    expect(sources).toContain("from '@violetflux/kerros'")
    expect(sources).toContain('createStore(')
    expect(sources).toContain('useEffect(')
    expect(sources).toContain('useEffectEvent(')
    expect(sources).toContain('export {')
    expect(sources).toMatch(/useStore\d+A\(s => \(\{/)
  })

  it('supports the 100, 1000, and 5000 file profiles without generating them eagerly', async () => {
    const core = await loadCore()
    if (!core)
      return

    expect(core.getProfile(100)).toEqual({ files: 100, generatedStores: 200 })
    expect(core.getProfile(1_000)).toEqual({ files: 1_000, generatedStores: 2_000 })
    expect(core.getProfile(5_000)).toEqual({ files: 5_000, generatedStores: 10_000 })
  })

  it('bounds cross-file type dependency depth while preserving dependency edges', async () => {
    const core = await loadCore()
    if (!core)
      return

    const files = core.createProjectFiles(1_000)

    expect(files.get('src/case-20.tsx')).not.toContain("from './case-19'")
    expect(files.get('src/case-21.tsx')).toContain("from './case-20'")
  })

  it('calculates honest baseline overhead and per-rule shares', async () => {
    const core = await loadCore()
    if (!core)
      return

    expect(core.calculateOverhead(1_000, 1_180)).toBeCloseTo(18)
    expect(core.median([90, 20, 50])).toBe(50)
    expect(core.rotateValues(['baseline', 'fast', 'strict'], 1)).toEqual([
      'fast',
      'strict',
      'baseline',
    ])
    expect(core.summarizeRuleTimings(200, {
      'kerros/local-rule': 30,
      'kerros/program-rule': 50,
    })).toEqual([
      { name: 'kerros/program-rule', percent: 25, timeMs: 50 },
      { name: 'kerros/local-rule', percent: 15, timeMs: 30 },
    ])
  })

  it('aggregates real ESLint timing payloads without losing rule samples', async () => {
    const core = await loadCore()
    if (!core)
      return

    expect(core.aggregateLintStats([
      {
        errorCount: 2,
        stats: {
          times: {
            passes: [{
              parse: { total: 3 },
              rules: {
                'kerros/local': { total: 5 },
                'kerros/program': { total: 7 },
              },
            }],
          },
        },
        warningCount: 1,
      },
      {
        errorCount: 0,
        stats: {
          times: {
            passes: [{
              parse: { total: 4 },
              rules: { 'kerros/local': { total: 6 } },
            }],
          },
        },
        warningCount: 3,
      },
    ])).toEqual({
      errors: 2,
      files: 2,
      parseMs: 7,
      ruleTimings: {
        'kerros/local': 11,
        'kerros/program': 7,
      },
      warnings: 4,
    })
  })

  it('writes a self-contained typed project without extra generated source files', async () => {
    const core = await loadCore()
    if (!core)
      return

    const root = await mkdtemp(join(tmpdir(), 'kerros-eslint-core-'))
    try {
      await core.writeGeneratedProject(root, 100, '/repo/src/index.tsx')
      const sourceNames = await readdir(join(root, 'src'))

      expect(sourceNames).toHaveLength(100)
      expect(existsSync(join(root, 'tsconfig.json'))).toBe(true)
    }
    finally {
      await rm(root, { recursive: true })
    }
  })
})
