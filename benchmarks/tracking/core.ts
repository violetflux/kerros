import { createProxy, isChanged } from 'proxy-compare'

export interface BenchmarkShape {
  domains: number
  groups: number
  metrics: number
}

export interface BenchmarkSnapshot {
  state: {
    domains: Record<string, {
      groups: Record<string, {
        metrics: Record<string, number>
      }>
    }>
  }
  metadata: {
    revision: number
  }
}

export type BenchmarkSelection = Record<string, number>

export const defaultShape: BenchmarkShape = {
  domains: 100,
  groups: 10,
  metrics: 10,
}

export const trackingProfiles = {
  large: {
    componentDepth: 8,
    consumers: 1_000,
    microConsumers: 2_000,
    modes: ['createStore', 'bindStore'],
    readCount: 12,
    rounds: 3,
    shape: { domains: 200, groups: 20, metrics: 20 },
    time: 600,
    updates: 200,
  },
  extreme: {
    componentDepth: 12,
    consumers: 2_500,
    microConsumers: 5_000,
    modes: ['createStore', 'bindStore'],
    readCount: 24,
    rounds: 1,
    shape: { domains: 400, groups: 25, metrics: 25 },
    time: 1_000,
    updates: 300,
  },
} as const

/** Create a deterministic deeply nested snapshot for comparator benchmarks. */
export function createSnapshot(
  shape: BenchmarkShape = defaultShape,
): BenchmarkSnapshot {
  const domains: BenchmarkSnapshot['state']['domains'] = {}

  for (let domainIndex = 0; domainIndex < shape.domains; domainIndex += 1) {
    const groups: Record<string, { metrics: Record<string, number> }> = {}

    for (let groupIndex = 0; groupIndex < shape.groups; groupIndex += 1) {
      const metrics: Record<string, number> = {}

      for (let metricIndex = 0; metricIndex < shape.metrics; metricIndex += 1)
        metrics[`metric${metricIndex}`] = 0

      groups[`group${groupIndex}`] = { metrics }
    }

    domains[`domain${domainIndex}`] = { groups }
  }

  return {
    metadata: { revision: 0 },
    state: { domains },
  }
}

/** Replace one six-segment metric path while preserving unrelated references. */
export function updateMetric(
  snapshot: BenchmarkSnapshot,
  domainIndex: number,
  groupIndex: number,
  metricIndex: number,
  value: number,
): BenchmarkSnapshot {
  const domainKey = `domain${domainIndex}`
  const groupKey = `group${groupIndex}`
  const metricKey = `metric${metricIndex}`
  const domain = snapshot.state.domains[domainKey]
  const group = domain.groups[groupKey]

  return {
    ...snapshot,
    state: {
      ...snapshot.state,
      domains: {
        ...snapshot.state.domains,
        [domainKey]: {
          ...domain,
          groups: {
            ...domain.groups,
            [groupKey]: {
              ...group,
              metrics: {
                ...group.metrics,
                [metricKey]: value,
              },
            },
          },
        },
      },
    },
  }
}

/** Select several deep primitive values for the explicit-selector baseline. */
export function selectWatched(
  snapshot: BenchmarkSnapshot,
  readCount: number,
): BenchmarkSelection {
  const selection: BenchmarkSelection = {}
  const metrics = snapshot.state.domains.domain0.groups.group0.metrics

  for (let index = 0; index < readCount; index += 1)
    selection[`metric${index}`] = metrics[`metric${index}`]

  return selection
}

/** Read several deep values through a Store snapshot or tracking Proxy. */
export function readWatchedTotal(
  snapshot: BenchmarkSnapshot,
  readCount: number,
) {
  const metrics = snapshot.state.domains.domain0.groups.group0.metrics
  let total = 0

  for (let index = 0; index < readCount; index += 1)
    total += metrics[`metric${index}`]

  return total
}

/** Sum an explicit selector result so React consumes every selected field. */
export function sumSelection(selection: BenchmarkSelection) {
  let total = 0

  for (const value of Object.values(selection))
    total += value

  return total
}

/** Compare all enumerable top-level fields by identity. */
export function shallowEqual(left: unknown, right: unknown) {
  if (Object.is(left, right))
    return true

  if (!isRecord(left) || !isRecord(right))
    return false

  const leftKeys = Object.keys(left)

  if (leftKeys.length !== Object.keys(right).length)
    return false

  return leftKeys.every(key => (
    Object.prototype.hasOwnProperty.call(right, key)
    && Object.is(left[key], right[key])
  ))
}

/** Recursively compare plain benchmark snapshots. */
export function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right))
    return true

  if (!isRecord(left) || !isRecord(right))
    return false

  const leftKeys = Object.keys(left)

  if (leftKeys.length !== Object.keys(right).length)
    return false

  return leftKeys.every(key => (
    Object.prototype.hasOwnProperty.call(right, key)
    && deepEqual(left[key], right[key])
  ))
}

/** Create the same cached proxy-compare access tracker used by the runtime. */
export function createProxyCompareTracker<TSnapshot>(snapshot: TSnapshot) {
  const affected = new WeakMap<object, unknown>()
  const proxyCache = new WeakMap<object, unknown>()
  const proxy = createProxy(snapshot, affected, proxyCache)

  return {
    affected,
    isChanged: (next: TSnapshot) => isChanged(
      snapshot,
      next,
      affected,
      new WeakMap<object, unknown>(),
    ),
    proxy,
  }
}

/** Narrow values supported by the benchmark's plain-object comparators. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
