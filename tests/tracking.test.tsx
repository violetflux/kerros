import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { bindStore, createStore } from '../src'
import { act, render } from './render'

const { StrictMode, Suspense, useState } = React

interface MutableStore<TSnapshot> {
  getSnapshot: () => TSnapshot
  listenerCount: () => number
  setSnapshot: (snapshot: TSnapshot) => void
  subscribe: (listener: () => void) => () => void
}

function createMutableStore<TSnapshot>(initialSnapshot: TSnapshot): MutableStore<TSnapshot> {
  let snapshot = initialSnapshot
  const listeners = new Set<() => void>()

  return {
    getSnapshot: () => snapshot,
    listenerCount: () => listeners.size,
    setSnapshot: nextSnapshot => {
      snapshot = nextSnapshot

      for (const listener of listeners)
        listener()
    },
    subscribe: listener => {
      listeners.add(listener)

      return () => listeners.delete(listener)
    },
  }
}

describe('automatic tracking', () => {
  it('tracks top-level createStore fields read during render', async () => {
    let setCount: (value: number) => void = () => undefined
    let setIgnored: (value: number) => void = () => undefined
    const [useExample, ExampleProvider] = createStore(() => {
      const [count, updateCount] = useState(0)
      const [ignored, updateIgnored] = useState(0)
      setCount = updateCount
      setIgnored = updateIgnored
      return { count, ignored }
    })
    let renders = 0

    const Count = () => {
      const store = useExample()
      renders += 1
      return <span>{store.count}</span>
    }

    const view = await render(
      <ExampleProvider>
        <Count />
      </ExampleProvider>,
    )
    const initialRenders = renders

    await act(() => setIgnored(1))
    expect(renders).toBe(initialRenders)

    await act(() => setCount(1))
    expect(view.container.textContent).toBe('1')
    expect(renders).toBeGreaterThan(initialRenders)
  })

  it('tracks deep createStore fields through recreated parent objects', async () => {
    let setName: (value: string) => void = () => undefined
    let setIgnored: (value: number) => void = () => undefined
    const [useProfile, ProfileProvider] = createStore(() => {
      const [name, updateName] = useState('Kerros')
      const [ignored, updateIgnored] = useState(0)
      setName = updateName
      setIgnored = updateIgnored
      return { ignored, profile: { details: { name } } }
    })
    let renders = 0

    const Profile = () => {
      const store = useProfile()
      renders += 1
      return <span>{store.profile.details.name}</span>
    }

    const view = await render(
      <ProfileProvider>
        <Profile />
      </ProfileProvider>,
    )
    const initialRenders = renders

    await act(() => setIgnored(1))
    expect(renders).toBe(initialRenders)

    await act(() => setName('Violet'))
    expect(view.container.textContent).toBe('Violet')
    expect(renders).toBeGreaterThan(initialRenders)
  })

  it('tracks deep bindStore fields without reacting to unrelated changes', async () => {
    const store = createMutableStore({
      ignored: 0,
      profile: { details: { name: 'Kerros' } },
    })
    const [useProfile, ProfileProvider] = bindStore<typeof store>()
    let renders = 0

    const Profile = () => {
      const snapshot = useProfile()
      renders += 1
      return <span>{snapshot.profile.details.name}</span>
    }

    const view = await render(
      <ProfileProvider store={store}>
        <Profile />
      </ProfileProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot({
      ignored: 1,
      profile: { details: { name: 'Kerros' } },
    }))
    expect(renders).toBe(initialRenders)

    await act(() => store.setSnapshot({
      ignored: 1,
      profile: { details: { name: 'Violet' } },
    }))
    expect(view.container.textContent).toBe('Violet')
    expect(renders).toBeGreaterThan(initialRenders)
  })

  it('passes the original snapshot to explicit selectors', async () => {
    const initialSnapshot = { count: 1 }
    const store = createMutableStore(initialSnapshot)
    const [useCounter, CounterProvider] = bindStore<typeof store>()
    let selectedSnapshot: typeof initialSnapshot | undefined

    const Counter = () => {
      const { count } = useCounter((snapshot) => {
        selectedSnapshot = snapshot
        return { count: snapshot.count }
      })
      return <span>{count}</span>
    }

    await render(
      <CounterProvider store={store}>
        <Counter />
      </CounterProvider>,
    )

    expect(selectedSnapshot).toBe(initialSnapshot)
  })

  it('replaces conditional access only after the next render commits', async () => {
    const store = createMutableStore({
      details: { name: 'Kerros' },
      showDetails: false,
      title: 'Overview',
    })
    const [usePage, PageProvider] = bindStore<typeof store>()
    let renders = 0

    const Page = () => {
      const snapshot = usePage()
      renders += 1
      return <span>{snapshot.showDetails ? snapshot.details.name : snapshot.title}</span>
    }

    const view = await render(
      <PageProvider store={store}>
        <Page />
      </PageProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot({
      details: { name: 'Violet' },
      showDetails: false,
      title: 'Overview',
    }))
    expect(renders).toBe(initialRenders)

    await act(() => store.setSnapshot({
      details: { name: 'Violet' },
      showDetails: true,
      title: 'Overview',
    }))
    expect(view.container.textContent).toBe('Violet')
    const detailRenders = renders

    await act(() => store.setSnapshot({
      details: { name: 'Violet' },
      showDetails: true,
      title: 'Ignored title',
    }))
    expect(renders).toBe(detailRenders)

    await act(() => store.setSnapshot({
      details: { name: 'Flux' },
      showDetails: true,
      title: 'Ignored title',
    }))
    expect(view.container.textContent).toBe('Flux')
  })

  it('tracks accessed array indexes', async () => {
    const store = createMutableStore({ items: ['first', 'second'] })
    const [useList, ListProvider] = bindStore<typeof store>()
    let renders = 0

    const FirstItem = () => {
      const snapshot = useList()
      renders += 1
      return <span>{snapshot.items[0]}</span>
    }

    const view = await render(
      <ListProvider store={store}>
        <FirstItem />
      </ListProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot({ items: ['first', 'changed'] }))
    expect(renders).toBe(initialRenders)

    await act(() => store.setSnapshot({ items: ['updated', 'changed'] }))
    expect(view.container.textContent).toBe('updated')
  })

  it('tracks property enumeration independently from property values', async () => {
    const store = createMutableStore<{ flags: Record<string, boolean> }>({
      flags: { alpha: true },
    })
    const [useFlags, FlagsProvider] = bindStore<typeof store>()
    let renders = 0

    const FlagNames = () => {
      const snapshot = useFlags()
      renders += 1
      return <span>{Object.keys(snapshot.flags).join(',')}</span>
    }

    const view = await render(
      <FlagsProvider store={store}>
        <FlagNames />
      </FlagsProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot({ flags: { alpha: false } }))
    expect(renders).toBe(initialRenders)

    await act(() => store.setSnapshot({ flags: { alpha: false, beta: true } }))
    expect(view.container.textContent).toBe('alpha,beta')
  })

  it('compares cyclic objects through the proxy-compare cache', async () => {
    interface CyclicNode {
      self: CyclicNode
      value: string
    }

    const createNode = (value: string) => {
      const node = { value } as CyclicNode
      node.self = node
      return node
    }
    const store = createMutableStore({ node: createNode('stable') })
    const [useNode, NodeProvider] = bindStore<typeof store>()
    let renders = 0

    const Value = () => {
      const snapshot = useNode()
      renders += 1
      return <span>{snapshot.node.self.value}</span>
    }

    const view = await render(
      <NodeProvider store={store}>
        <Value />
      </NodeProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot({ node: createNode('stable') }))
    expect(renders).toBe(initialRenders)

    await act(() => store.setSnapshot({ node: createNode('changed') }))
    expect(view.container.textContent).toBe('changed')
  })

  it('compares values returned by tracked getters', async () => {
    const createSnapshot = (label: string, ignored: number) => ({
      get label() {
        return label
      },
      ignored,
    })
    const store = createMutableStore(createSnapshot('Kerros', 0))
    const [useLabel, LabelProvider] = bindStore<typeof store>()
    let renders = 0

    const Label = () => {
      const snapshot = useLabel()
      renders += 1
      return <span>{snapshot.label}</span>
    }

    const view = await render(
      <LabelProvider store={store}>
        <Label />
      </LabelProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot(createSnapshot('Kerros', 1)))
    expect(renders).toBe(initialRenders)

    await act(() => store.setSnapshot(createSnapshot('Violet', 1)))
    expect(view.container.textContent).toBe('Violet')
  })

  it('treats class instances as whole references', async () => {
    class Label {
      constructor(readonly value: string) {}
    }

    const store = createMutableStore({ label: new Label('Kerros') })
    const [useLabel, LabelProvider] = bindStore<typeof store>()
    let renders = 0

    const Value = () => {
      const snapshot = useLabel()
      renders += 1
      return <span>{snapshot.label.value}</span>
    }

    await render(
      <LabelProvider store={store}>
        <Value />
      </LabelProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot({ label: new Label('Kerros') }))

    expect(renders).toBeGreaterThan(initialRenders)
  })

  it('treats Map and Set values as whole references', async () => {
    const store = createMutableStore({
      keys: new Set(['alpha']),
      values: new Map([['alpha', 1]]),
    })
    const [useCollection, CollectionProvider] = bindStore<typeof store>()
    let renders = 0

    const Collection = () => {
      const snapshot = useCollection()
      renders += 1
      return <span>{snapshot.keys.has('alpha') && snapshot.values.get('alpha')}</span>
    }

    await render(
      <CollectionProvider store={store}>
        <Collection />
      </CollectionProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot({
      keys: new Set(['alpha']),
      values: new Map([['alpha', 1]]),
    }))

    expect(renders).toBeGreaterThan(initialRenders)
  })
})

describe('tracking lifecycle', () => {
  it('calibrates the current Store after switching the accessed branch', async () => {
    const firstStore = createMutableStore({ left: 'same', right: 'old' })
    const secondStore = createMutableStore({ left: 'same', right: 'new' })
    const [useValue, ValueProvider] = bindStore<typeof firstStore>()

    const Value = ({ readRight }: { readRight: boolean }) => {
      const snapshot = useValue()
      return <span>{readRight ? snapshot.right : snapshot.left}</span>
    }

    const view = await render(
      <ValueProvider store={firstStore}>
        <Value readRight={false} />
      </ValueProvider>,
    )

    await view.rerender(
      <ValueProvider store={secondStore}>
        <Value readRight />
      </ValueProvider>,
    )

    expect(view.container.textContent).toBe('new')
  })

  it('switches automatic subscriptions with the Provider Store', async () => {
    const firstStore = createMutableStore({ count: 1 })
    const secondStore = createMutableStore({ count: 10 })
    const [useCounter, CounterProvider] = bindStore<typeof firstStore>()

    const Counter = () => <span>{useCounter().count}</span>
    const view = await render(
      <CounterProvider store={firstStore}>
        <Counter />
      </CounterProvider>,
    )

    expect(firstStore.listenerCount()).toBe(1)

    await view.rerender(
      <CounterProvider store={secondStore}>
        <Counter />
      </CounterProvider>,
    )

    expect(view.container.textContent).toBe('10')
    expect(firstStore.listenerCount()).toBe(0)
    expect(secondStore.listenerCount()).toBe(1)
  })

  it('unsubscribes an automatic consumer when it unmounts', async () => {
    const store = createMutableStore({ count: 1 })
    const [useCounter, CounterProvider] = bindStore<typeof store>()

    const Counter = () => <span>{useCounter().count}</span>
    const view = await render(
      <CounterProvider store={store}>
        <Counter />
      </CounterProvider>,
    )

    expect(store.listenerCount()).toBe(1)
    await view.unmount()
    expect(store.listenerCount()).toBe(0)
  })

  it('keeps useInstance free of snapshot subscriptions', async () => {
    const store = createMutableStore({ count: 1 })
    const [, CounterProvider, useCounterInstance] = bindStore<typeof store>()
    let renders = 0

    const Instance = () => {
      const instance = useCounterInstance()
      renders += 1
      return <span>{instance === store ? 'same' : 'different'}</span>
    }

    const view = await render(
      <CounterProvider store={store}>
        <Instance />
      </CounterProvider>,
    )
    const initialRenders = renders

    expect(store.listenerCount()).toBe(0)
    await act(() => store.setSnapshot({ count: 2 }))
    expect(view.container.textContent).toBe('same')
    expect(renders).toBe(initialRenders)
    expect(store.listenerCount()).toBe(0)
  })

  it('tracks committed accesses in StrictMode', async () => {
    const store = createMutableStore({ count: 1, ignored: 0 })
    const [useCounter, CounterProvider] = bindStore<typeof store>()
    let renders = 0

    const Counter = () => {
      const snapshot = useCounter()
      renders += 1
      return <span>{snapshot.count}</span>
    }

    const view = await render(
      <StrictMode>
        <CounterProvider store={store}>
          <Counter />
        </CounterProvider>
      </StrictMode>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot({ count: 1, ignored: 1 }))
    expect(renders).toBe(initialRenders)

    await act(() => store.setSnapshot({ count: 2, ignored: 1 }))
    expect(view.container.textContent).toBe('2')
  })

  it.skipIf(!React.version.startsWith('19.'))(
    'does not replace committed accesses with an abandoned React 19 render',
    async () => {
      const pending = new Promise<never>(() => undefined)
      const store = createMutableStore({ left: 'left 1', right: 'right 1' })
      const [useValue, ValueProvider] = bindStore<typeof store>()
      let showRight: () => void = () => undefined

      const Value = ({ right }: { right: boolean }) => {
        const snapshot = useValue()
        const value = right ? snapshot.right : snapshot.left

        if (right)
          throw pending

        return <span>{value}</span>
      }

      const App = () => {
        const [right, setRight] = useState(false)
        showRight = () => setRight(true)

        return (
          <ValueProvider store={store}>
            <Suspense fallback={<span>loading</span>}>
              <Value right={right} />
            </Suspense>
          </ValueProvider>
        )
      }

      const view = await render(<App />)

      await act(() => React.startTransition(showRight))
      expect(view.container.textContent).toBe('left 1')

      await act(() => store.setSnapshot({ left: 'left 2', right: 'right 1' }))
      expect(view.container.textContent).toBe('left 2')
    },
  )
})

describe('disabled tracking', () => {
  it('compares the complete object snapshot shallowly', async () => {
    const store = createMutableStore({ count: 0, ignored: 0 })
    const [useCounter, CounterProvider] = bindStore<typeof store>({ tracking: false })
    let renders = 0

    const Counter = () => {
      const snapshot = useCounter()
      renders += 1
      return <span>{snapshot.count}</span>
    }

    await render(
      <CounterProvider store={store}>
        <Counter />
      </CounterProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot({ count: 0, ignored: 1 }))

    expect(renders).toBeGreaterThan(initialRenders)
  })

  it('compares primitive snapshots with Object.is', async () => {
    const store = createMutableStore(1)
    const [useValue, ValueProvider] = bindStore<typeof store>('Value', { tracking: false })
    let renders = 0

    const Value = () => {
      const value = useValue()
      renders += 1
      return <span>{value}</span>
    }

    const view = await render(
      <ValueProvider store={store}>
        <Value />
      </ValueProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot(1))
    expect(renders).toBe(initialRenders)

    await act(() => store.setSnapshot(2))
    expect(view.container.textContent).toBe('2')
    expect(renders).toBeGreaterThan(initialRenders)
  })

  it('compares non-plain snapshots by reference', async () => {
    const store = createMutableStore(new Map([['value', 1]]))
    const [useValue, ValueProvider] = bindStore<typeof store>({ tracking: false })
    let renders = 0

    const Value = () => {
      const value = useValue()
      renders += 1
      return <span>{value.get('value')}</span>
    }

    await render(
      <ValueProvider store={store}>
        <Value />
      </ValueProvider>,
    )
    const initialRenders = renders

    await act(() => store.setSnapshot(new Map([['value', 1]])))

    expect(renders).toBeGreaterThan(initialRenders)
  })
})
