import { describe, expect, it } from 'vitest'
import type { BenchmarkSnapshot } from './core'
import {
  createSnapshot,
  createProxyCompareTracker,
  deepEqual,
  readWatchedTotal,
  selectWatched,
  shallowEqual,
  updateMetric,
} from './core'
import * as trackingCore from './core'

const shape = { domains: 3, groups: 3, metrics: 4 }

describe('tracking benchmark strategies', () => {
  it('distinguishes unrelated and watched deep updates', () => {
    const initial = createSnapshot(shape)
    const unrelated = updateMetric(initial, 2, 2, 3, 1)
    const watched = updateMetric(initial, 0, 0, 0, 1)

    expect(shallowEqual(
      selectWatched(initial, 3),
      selectWatched(unrelated, 3),
    )).toBe(true)
    expect(shallowEqual(
      selectWatched(initial, 3),
      selectWatched(watched, 3),
    )).toBe(false)
    expect(shallowEqual(initial, unrelated)).toBe(false)
    expect(deepEqual(initial, unrelated)).toBe(false)
  })

  it('records and compares every deep path read by a consumer', () => {
    const initial = createSnapshot(shape)
    const unrelated = updateMetric(initial, 2, 2, 3, 1)
    const watched = updateMetric(initial, 0, 0, 1, 1)
    const tracker = createProxyCompareTracker(initial)

    expect(readWatchedTotal(tracker.proxy, 3)).toBe(0)
    expect(tracker.isChanged(unrelated)).toBe(false)
    expect(tracker.isChanged(watched)).toBe(true)
  })

  it('suppresses no-op root replacement with shallow comparison', () => {
    const initial = createSnapshot(shape)
    const cloned = { ...initial }

    expect(shallowEqual(initial, cloned)).toBe(true)
    expect(deepEqual(initial, cloned)).toBe(true)
  })

  it('uses cached proxy-compare proxies and affected paths for production tracking', () => {
    const createTracker = Reflect.get(trackingCore, 'createProxyCompareTracker') as undefined | ((snapshot: unknown) => {
      isChanged: (next: unknown) => boolean
      proxy: BenchmarkSnapshot
    })

    expect(createTracker).toBeTypeOf('function')
    if (!createTracker)
      return

    const initial = createSnapshot(shape)
    const tracker = createTracker(initial)

    expect(tracker.proxy.state).toBe(tracker.proxy.state)
    expect(readWatchedTotal(tracker.proxy, 2)).toBe(0)
    expect(tracker.isChanged(updateMetric(initial, 2, 2, 3, 1))).toBe(false)
    expect(tracker.isChanged(updateMetric(initial, 0, 0, 1, 1))).toBe(true)
  })

  it('defines real createStore and bindStore pressure profiles at 80k and 250k leaves', () => {
    const profiles = Reflect.get(trackingCore, 'trackingProfiles') as undefined | Record<string, {
      modes: readonly string[]
      shape: { domains: number, groups: number, metrics: number }
    }>

    expect(profiles).toBeDefined()
    if (!profiles)
      return

    expect(profiles.large.shape.domains
      * profiles.large.shape.groups
      * profiles.large.shape.metrics).toBe(80_000)
    expect(profiles.extreme.shape.domains
      * profiles.extreme.shape.groups
      * profiles.extreme.shape.metrics).toBe(250_000)
    expect(profiles.large.modes).toEqual(['createStore', 'bindStore'])
    expect(profiles.extreme.modes).toEqual(['createStore', 'bindStore'])
  })
})
