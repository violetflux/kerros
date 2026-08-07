import type { FC, ReactNode } from 'react'
import type { BenchmarkSnapshot } from './core'
import { JSDOM } from 'jsdom'
import { createElement, useCallback, useRef } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import {
  createSnapshot,
  createProxyCompareTracker,
  deepEqual,
  readWatchedTotal,
  selectWatched,
  shallowEqual,
  sumSelection,
  trackingProfiles,
  updateMetric,
} from './core'

/* eslint-disable react-hooks/refs -- The prototype intentionally records render-time Proxy access for measurement. */

type Strategy = 'selector' | 'tracking' | 'shallow' | 'deep'
type Scenario = 'no-op' | 'unrelated' | 'watched'

interface ConsumerProps {
  counter: RenderCounter
  readCount: number
  store: BenchmarkStore
}

class RenderCounter {
  private renders = 0

  /** Record one benchmark component render. */
  public increment() {
    this.renders += 1
  }

  /** Read the accumulated render count. */
  public get value() {
    return this.renders
  }
}

class BenchmarkStore {
  private listeners = new Set<() => void>()

  public constructor(private snapshot: BenchmarkSnapshot) {}

  /** Read the current immutable benchmark snapshot. */
  public getSnapshot = () => this.snapshot

  /** Subscribe one React consumer like bindStore does. */
  public subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Publish one snapshot and synchronously notify all subscribers. */
  public publish(snapshot: BenchmarkSnapshot) {
    this.snapshot = snapshot

    for (const listener of this.listeners)
      listener()
  }
}

const identity = <T,>(value: T) => value

/** Render an explicit multi-field selector consumer. */
function SelectorConsumer(props: ConsumerProps) {
  const { counter, readCount, store } = props
  const selection = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    snapshot => selectWatched(snapshot, readCount),
    shallowEqual,
  )

  counter.increment()
  return createElement('span', null, sumSelection(selection))
}

/** Render an automatic deep property-access tracking consumer. */
function TrackingConsumer(props: ConsumerProps) {
  const { counter, readCount, store } = props
  const tracker = useRef<ReturnType<typeof createProxyCompareTracker<BenchmarkSnapshot>> | undefined>(undefined)
  const equal = useCallback((left: BenchmarkSnapshot, right: BenchmarkSnapshot) => (
    tracker.current ? !tracker.current.isChanged(right) : Object.is(left, right)
  ), [])
  const snapshot = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    identity,
    equal,
  )

  tracker.current = createProxyCompareTracker(snapshot)
  counter.increment()
  return createElement(
    'span',
    null,
    readWatchedTotal(tracker.current.proxy, readCount),
  )
}

/** Render a whole-Store top-level shallow comparison consumer. */
function ShallowConsumer(props: ConsumerProps) {
  const { counter, readCount, store } = props
  const value = useWholeValue(store, readCount, shallowEqual)

  counter.increment()
  return createElement('span', null, value)
}

/** Render a whole-Store recursive deep comparison consumer. */
function DeepConsumer(props: ConsumerProps) {
  const { counter, readCount, store } = props
  const value = useWholeValue(store, readCount, deepEqual)

  counter.increment()
  return createElement('span', null, value)
}

/** Subscribe to a whole snapshot and read several deep values. */
function useWholeValue(
  store: BenchmarkStore,
  readCount: number,
  equal: typeof shallowEqual,
) {
  const snapshot = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    identity,
    equal,
  )

  return readWatchedTotal(snapshot, readCount)
}

const consumerComponents: Record<Strategy, FC<ConsumerProps>> = {
  deep: DeepConsumer,
  selector: SelectorConsumer,
  shallow: ShallowConsumer,
  tracking: TrackingConsumer,
}

/** Render a fixed number of consumers for one benchmark strategy. */
function Consumers(props: ConsumerProps & { count: number, strategy: Strategy }) {
  const { count, counter, readCount, store, strategy } = props
  const Consumer = consumerComponents[strategy]
  const children: ReactNode[] = []

  for (let index = 0; index < count; index += 1) {
    children.push(createElement(Consumer, {
      counter,
      key: index,
      readCount,
      store,
    }))
  }

  return createElement('div', null, children)
}

/** Return the median to reduce DOM and garbage-collection noise. */
function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

const requestedProfile = process.argv.find(argument => argument.startsWith('--profile='))
  ?.split('=')[1]
const requestedScenario = process.argv.find(argument => argument.startsWith('--scenario='))
  ?.split('=')[1]
const profileName = requestedProfile === 'extreme' ? 'extreme' : 'large'
const profile = trackingProfiles[profileName]
const scenarios: Scenario[] = requestedScenario === 'unrelated'
  || requestedScenario === 'watched'
  || requestedScenario === 'no-op'
  ? [requestedScenario]
  : ['no-op', 'unrelated', 'watched']
const dom = new JSDOM('<!doctype html><html><body></body></html>')
Object.assign(globalThis, {
  document: dom.window.document,
  navigator: dom.window.navigator,
  window: dom.window,
})

const { createRoot } = await import('react-dom/client')
const { flushSync } = await import('react-dom')
const strategies: Strategy[] = ['selector', 'tracking', 'shallow', 'deep']

/** Measure one mounted bindStore-style tree under repeated Store updates. */
function runReactBenchmark(strategy: Strategy, scenario: Scenario) {
  const container = document.createElement('div')
  const store = new BenchmarkStore(createSnapshot(profile.shape))
  const counter = new RenderCounter()
  const root = createRoot(container)

  flushSync(() => root.render(createElement(Consumers, {
    count: profile.consumers,
    counter,
    readCount: profile.readCount,
    store,
    strategy,
  })))

  let snapshot = store.getSnapshot()
  const startedAt = performance.now()

  for (let index = 1; index <= profile.updates; index += 1) {
    if (scenario === 'no-op')
      snapshot = { ...snapshot }
    else if (scenario === 'unrelated')
      snapshot = updateMetric(
        snapshot,
        profile.shape.domains - 1,
        profile.shape.groups - 1,
        profile.shape.metrics - 1,
        index,
      )
    else
      snapshot = updateMetric(snapshot, 0, 0, 0, index)

    flushSync(() => store.publish(snapshot))
  }

  const duration = performance.now() - startedAt
  flushSync(() => root.unmount())

  return {
    duration,
    renders: counter.value,
  }
}

for (const scenario of scenarios) {
  const rows = strategies.map(strategy => {
    const results = Array.from(
      { length: profile.rounds },
      () => runReactBenchmark(strategy, scenario),
    )

    return {
      strategy,
      'median ms': median(results.map(result => result.duration)).toFixed(2),
      renders: results[0].renders,
    }
  })

  console.log(`\nbindStore-style React ${profileName}/${scenario}`)
  console.log(`${profile.shape.domains * profile.shape.groups * profile.shape.metrics} deep leaves, ${profile.readCount} reads × ${profile.consumers} consumers × ${profile.updates} updates`)
  console.table(rows)
}

dom.window.close()
