import type { Dispatch, FC, ReactNode, SetStateAction } from 'react'
import type { StoreHook } from '../../src'
import type { BenchmarkSnapshot } from './core'
import { JSDOM } from 'jsdom'
import { createElement, useLayoutEffect, useState } from 'react'
import { bindStore, createStore } from '../../src'
import {
  createSnapshot,
  readWatchedTotal,
  selectWatched,
  sumSelection,
  trackingProfiles,
  updateMetric,
} from './core'

type Mode = 'createStore' | 'bindStore'
type Scenario = 'no-op' | 'unrelated' | 'watched'
type Strategy = 'selector' | 'tracking' | 'shallow'

interface ConsumerProps {
  counter: RenderCounter
}

interface ModelProps {
  controller: ModelController
  initial: BenchmarkSnapshot
}

interface Harness {
  publish: (snapshot: BenchmarkSnapshot) => void
  tree: ReactNode
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

class BenchmarkExternalStore {
  private listeners = new Set<() => void>()

  public constructor(private snapshot: BenchmarkSnapshot) {}

  /** Read the immutable snapshot consumed by bindStore. */
  public getSnapshot = () => this.snapshot

  /** Subscribe one real bindStore consumer. */
  public subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Publish one snapshot through the external Store contract. */
  public publish(snapshot: BenchmarkSnapshot) {
    this.snapshot = snapshot

    for (const listener of this.listeners)
      listener()
  }
}

class ModelController {
  private setter?: Dispatch<SetStateAction<BenchmarkSnapshot>>

  /** Attach the state setter owned by one createStore model instance. */
  public attach(setter: Dispatch<SetStateAction<BenchmarkSnapshot>>) {
    this.setter = setter
    return () => {
      if (this.setter === setter)
        this.setter = undefined
    }
  }

  /** Publish one snapshot through the real createStore model state. */
  public publish(snapshot: BenchmarkSnapshot) {
    if (!this.setter)
      throw new Error('createStore benchmark model is not mounted')

    this.setter(snapshot)
  }
}

/** Own the snapshot state used by the createStore benchmark. */
function useBenchmarkModel(props: ModelProps) {
  const { controller, initial } = props
  const [snapshot, setSnapshot] = useState(initial)

  useLayoutEffect(() => controller.attach(setSnapshot), [controller])
  return snapshot
}

/** Add real component depth above every subscriber collection. */
function ComponentDepth(props: { children?: ReactNode, depth: number }): ReactNode {
  const { children, depth } = props

  if (depth === 0)
    return children

  return createElement(
    'section',
    null,
    createElement(ComponentDepth, { depth: depth - 1 }, children),
  )
}

/** Create subscribers that read multiple six-segment deep properties. */
function createConsumers(
  useBenchmark: StoreHook<BenchmarkSnapshot>,
  strategy: Strategy,
  readCount: number,
) {
  if (strategy === 'selector') {
    return function SelectorConsumer({ counter }: ConsumerProps) {
      const selection = useBenchmark(s => selectWatched(s, readCount))
      counter.increment()
      return createElement('span', null, sumSelection(selection))
    }
  }

  return function SnapshotConsumer({ counter }: ConsumerProps) {
    const snapshot = useBenchmark()
    counter.increment()
    return createElement('span', null, readWatchedTotal(snapshot, readCount))
  }
}

/** Mount a fixed subscriber count below a configurable component-depth chain. */
function createSubscriberTree(
  Consumer: FC<ConsumerProps>,
  consumers: number,
  componentDepth: number,
  counter: RenderCounter,
) {
  const children = Array.from({ length: consumers }, (_, index) => (
    createElement(Consumer, { counter, key: index })
  ))

  return createElement(
    ComponentDepth,
    { depth: componentDepth },
    createElement('div', null, children),
  )
}

/** Build a harness around the real createStore API. */
function createModelHarness(
  initial: BenchmarkSnapshot,
  strategy: Strategy,
  profile: typeof trackingProfiles.large | typeof trackingProfiles.extreme,
  counter: RenderCounter,
): Harness {
  const controller = new ModelController()
  const options = strategy === 'shallow' ? { tracking: false } : undefined
  const [useBenchmark, Provider] = createStore(useBenchmarkModel, options)
  const Consumer = createConsumers(useBenchmark, strategy, profile.readCount)
  const children = createSubscriberTree(
    Consumer,
    profile.consumers,
    profile.componentDepth,
    counter,
  )

  return {
    publish: snapshot => controller.publish(snapshot),
    tree: createElement(Provider, { controller, initial }, children),
  }
}

/** Build a harness around the real bindStore API. */
function createExternalHarness(
  initial: BenchmarkSnapshot,
  strategy: Strategy,
  profile: typeof trackingProfiles.large | typeof trackingProfiles.extreme,
  counter: RenderCounter,
): Harness {
  const store = new BenchmarkExternalStore(initial)
  const options = strategy === 'shallow' ? { tracking: false } : undefined
  const [useBenchmark, Provider] = bindStore<BenchmarkExternalStore>('Benchmark', options)
  const Consumer = createConsumers(useBenchmark, strategy, profile.readCount)
  const children = createSubscriberTree(
    Consumer,
    profile.consumers,
    profile.componentDepth,
    counter,
  )

  return {
    publish: snapshot => store.publish(snapshot),
    tree: createElement(Provider, { store }, children),
  }
}

const requestedProfile = readArgument('profile')
const profileName = requestedProfile === 'extreme' ? 'extreme' : 'large'
const profile = trackingProfiles[profileName]
const modes = selectValues<Mode>('mode', ['createStore', 'bindStore'])
const strategies = selectValues<Strategy>('strategy', ['selector', 'tracking', 'shallow'])
const scenarios = selectValues<Scenario>('scenario', ['no-op', 'unrelated', 'watched'])
const dom = new JSDOM('<!doctype html><html><body></body></html>')
Object.assign(globalThis, {
  document: dom.window.document,
  navigator: dom.window.navigator,
  window: dom.window,
})

const { createRoot } = await import('react-dom/client')
const { flushSync } = await import('react-dom')

/** Measure one real Kerros mode under repeated immutable updates. */
function runBenchmark(mode: Mode, strategy: Strategy, scenario: Scenario) {
  const container = document.createElement('div')
  const initial = createSnapshot(profile.shape)
  const counter = new RenderCounter()
  const harness = mode === 'createStore'
    ? createModelHarness(initial, strategy, profile, counter)
    : createExternalHarness(initial, strategy, profile, counter)
  const root = createRoot(container)
  const rssBefore = process.memoryUsage().rss

  flushSync(() => root.render(harness.tree))
  let peakRss = process.memoryUsage().rss
  let snapshot = initial
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

    flushSync(() => harness.publish(snapshot))
    peakRss = Math.max(peakRss, process.memoryUsage().rss)
  }

  const duration = performance.now() - startedAt
  const rssAfter = process.memoryUsage().rss
  flushSync(() => root.unmount())

  return {
    duration,
    memoryDeltaMb: (rssAfter - rssBefore) / 1024 / 1024,
    peakRssMb: peakRss / 1024 / 1024,
    renders: counter.value,
  }
}

for (const mode of modes) {
  for (const scenario of scenarios) {
    const rows = strategies.map(strategy => {
      const results = Array.from(
        { length: profile.rounds },
        () => runBenchmark(mode, strategy, scenario),
      )
      const middle = [...results].sort((left, right) => left.duration - right.duration)[
        Math.floor(results.length / 2)
      ]

      return {
        'median ms': middle.duration.toFixed(2),
        'memory delta MB': middle.memoryDeltaMb.toFixed(2),
        'peak RSS MB': middle.peakRssMb.toFixed(2),
        renders: middle.renders,
        strategy,
      }
    })

    console.log(`\n${mode} ${profileName}/${scenario}`)
    console.log(`${profile.shape.domains * profile.shape.groups * profile.shape.metrics} leaves, depth ${profile.componentDepth}, ${profile.readCount} reads × ${profile.consumers} consumers × ${profile.updates} updates`)
    console.table(rows)
  }
}

dom.window.close()

/** Select one requested CLI value or retain the complete default list. */
function selectValues<T extends string>(name: string, defaults: readonly T[]) {
  const requested = readArgument(name)
  if (!requested)
    return [...defaults]
  if (!defaults.includes(requested as T))
    throw new Error(`--${name} must be one of ${defaults.join(', ')}`)
  return [requested as T]
}

/** Read one equals-form CLI argument. */
function readArgument(name: string) {
  return process.argv.find(value => value.startsWith(`--${name}=`))
    ?.slice(name.length + 3)
}
