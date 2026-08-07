import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { cpus, platform, release, totalmem } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  calculateOverhead,
  median,
  rotateValues,
  summarizeRuleTimings,
  supportedFileCounts,
  writeGeneratedProject,
} from './core'

type BenchmarkMode = 'baseline' | 'fast' | 'strict'

interface WorkerResult {
  coldRuleTimings: Record<string, number>
  coldMs: number
  errors: number
  files: number
  mode: BenchmarkMode
  parseMs: number
  peakRssMb: number
  ruleTimings: Record<string, number>
  totalMs: number
  warmMs: number
  warmRuleTimings: Record<string, number>
  warnings: number
}

const benchmarkDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(benchmarkDir, '..', '..')
const requestedFiles = Number(readArgument('files') ?? 100)
const requestedRounds = Number(readArgument('rounds') ?? 3)

if (!supportedFileCounts.includes(requestedFiles as typeof supportedFileCounts[number])) {
  throw new Error(`--files must be one of ${supportedFileCounts.join(', ')}`)
}

if (!Number.isInteger(requestedRounds) || requestedRounds < 1 || requestedRounds > 10)
  throw new Error('--rounds must be an integer from 1 to 10')

const generatedRoot = join(benchmarkDir, '.generated')
await mkdir(generatedRoot, { recursive: true })
const project = await mkdtemp(join(generatedRoot, `files-${requestedFiles}-`))

try {
  await writeGeneratedProject(project, requestedFiles, join(repoRoot, 'src', 'index.tsx'))
  const modes: BenchmarkMode[] = ['baseline', 'fast', 'strict']
  const samples: WorkerResult[] = []
  for (let round = 0; round < requestedRounds; round += 1) {
    for (const mode of rotateValues(modes, round))
      samples.push(runWorker(project, mode))
  }
  const results = modes.map(mode => summarizeSamples(
    samples.filter(sample => sample.mode === mode),
  ))
  const baseline = results[0]
  const fast = results[1]
  const strict = results[2]
  const fastOverhead = calculateOverhead(baseline.totalMs, fast.totalMs)
  const strictPluginTime = Object.values(strict.ruleTimings).reduce((sum, value) => sum + value, 0)
  const perRule = summarizeRuleTimings(strictPluginTime, strict.ruleTimings)
    .filter(result => result.name.startsWith('kerros/'))
  const fastIncrementalTime = Math.max(0, fast.totalMs - baseline.totalMs)
  const fastThresholdRules = summarizeRuleTimings(fastIncrementalTime, fast.ruleTimings)
    .filter(result => result.name.startsWith('kerros/'))

  const output = {
    files: requestedFiles,
    machine: {
      arch: process.arch,
      bun: process.versions.bun ?? null,
      cpu: cpus()[0]?.model ?? 'unknown',
      cpuCount: cpus().length,
      memoryGb: totalmem() / 1024 / 1024 / 1024,
      node: process.version,
      os: `${platform()} ${release()}`,
    },
    results,
    rounds: requestedRounds,
    samples,
    thresholds: {
      fastOverheadPercent: fastOverhead,
      fastWithinTwentyPercent: fastOverhead <= 20,
      fastRulesAboveTwentyPercent: fastThresholdRules
        .filter(result => result.percent > 20)
        .map(result => result.name),
    },
  }

  console.table(results.map(result => ({
    coldMs: result.coldMs.toFixed(2),
    errors: result.errors,
    mode: result.mode,
    peakRssMb: result.peakRssMb.toFixed(2),
    totalMs: result.totalMs.toFixed(2),
    warmMs: result.warmMs.toFixed(2),
    warnings: result.warnings,
  })))
  console.table(perRule.map(result => ({
    percent: result.percent.toFixed(2),
    rule: result.name,
    timeMs: result.timeMs.toFixed(2),
  })))
  console.log(JSON.stringify(output, null, 2))
}
finally {
  await rm(project, { recursive: true })
}

/** Execute one isolated process so every mode receives a real cold Program. */
function runWorker(project: string, mode: BenchmarkMode) {
  const worker = fileURLToPath(new URL('./worker.ts', import.meta.url))
  const result = spawnSync(process.execPath, [
    worker,
    `--project=${project}`,
    `--mode=${mode}`,
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
  })

  if (result.status !== 0)
    throw new Error(result.stderr || result.stdout || `Worker ${mode} failed`)

  const line = result.stdout.trim().split('\n').at(-1)
  if (!line)
    throw new Error(`Worker ${mode} returned no result`)

  return JSON.parse(line) as WorkerResult
}

/** Collapse repeated isolated workers into one median result per mode. */
function summarizeSamples(samples: WorkerResult[]): WorkerResult {
  const first = samples[0]
  if (!first)
    throw new Error('Cannot summarize an empty benchmark sample')

  const names = new Set(samples.flatMap(sample => Object.keys(sample.ruleTimings)))
  const ruleTimings = Object.fromEntries([...names].map(name => [
    name,
    median(samples.map(sample => sample.ruleTimings[name] ?? 0)),
  ]))

  return {
    coldRuleTimings: summarizeTimingSamples(samples, 'coldRuleTimings'),
    coldMs: median(samples.map(sample => sample.coldMs)),
    errors: Math.max(...samples.map(sample => sample.errors)),
    files: first.files,
    mode: first.mode,
    parseMs: median(samples.map(sample => sample.parseMs)),
    peakRssMb: Math.max(...samples.map(sample => sample.peakRssMb)),
    ruleTimings,
    totalMs: median(samples.map(sample => sample.totalMs)),
    warmMs: median(samples.map(sample => sample.warmMs)),
    warmRuleTimings: summarizeTimingSamples(samples, 'warmRuleTimings'),
    warnings: Math.max(...samples.map(sample => sample.warnings)),
  }
}

/** Summarize one cold or warm rule-timing map independently. */
function summarizeTimingSamples(
  samples: WorkerResult[],
  field: 'coldRuleTimings' | 'warmRuleTimings',
) {
  const names = new Set(samples.flatMap(sample => Object.keys(sample[field])))

  return Object.fromEntries([...names].map(name => [
    name,
    median(samples.map(sample => sample[field][name] ?? 0)),
  ]))
}

/** Read one equals-form CLI argument. */
function readArgument(name: string) {
  return process.argv.find(value => value.startsWith(`--${name}=`))
    ?.slice(name.length + 3)
}
