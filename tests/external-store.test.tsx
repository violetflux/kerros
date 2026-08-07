import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { bindStore } from '../src'
import { act, render } from './render'

interface CounterSnapshot {
  count: number
  ignored: number
}

interface CounterStore {
  getSnapshot: () => CounterSnapshot
  listenerCount: () => number
  setSnapshot: (snapshot: CounterSnapshot) => void
  subscribe: (listener: () => void) => () => void
}

function createCounterStore(count: number): CounterStore {
  let snapshot = { count, ignored: 0 }
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

describe('bindStore', () => {
  it('selects directly from the provided external Store', async () => {
    const store = createCounterStore(1)
    const [
      useCounter,
      CounterProvider,
      useCounterInstance,
    ] = bindStore<CounterStore>('Counter')
    let selectedStore: CounterStore | undefined
    let renders = 0

    const Counter = () => {
      const { count } = useCounter(s => ({ count: s.count }))
      selectedStore = useCounterInstance()
      renders += 1
      return <span>{count}</span>
    }

    const view = await render(
      <CounterProvider store={store}>
        <Counter />
      </CounterProvider>,
    )
    const initialRenders = renders

    expect(view.container.textContent).toBe('1')
    expect(selectedStore).toBe(store)
    expect(store.listenerCount()).toBe(1)

    await act(() => store.setSnapshot({ count: 1, ignored: 1 }))

    expect(renders).toBe(initialRenders)

    await act(() => store.setSnapshot({ count: 2, ignored: 1 }))

    expect(view.container.textContent).toBe('2')
    expect(renders).toBeGreaterThan(initialRenders)

    await view.unmount()

    expect(store.listenerCount()).toBe(0)
  })

  it('switches subscriptions when the Provider Store changes', async () => {
    const firstStore = createCounterStore(1)
    const secondStore = createCounterStore(10)
    const [useCounter, CounterProvider] = bindStore<CounterStore>('Counter')

    const Counter = () => {
      const { count } = useCounter(s => ({ count: s.count }))
      return <span>{count}</span>
    }

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

    await act(() => firstStore.setSnapshot({ count: 2, ignored: 0 }))

    expect(view.container.textContent).toBe('10')
  })

  it('reads the external Store snapshot during SSR', () => {
    const store = createCounterStore(3)
    const [useCounter, CounterProvider] = bindStore<CounterStore>('Counter')

    const Counter = () => {
      const { count } = useCounter(s => ({ count: s.count }))
      return <span>{count}</span>
    }

    const html = renderToString(
      <CounterProvider store={store}>
        <Counter />
      </CounterProvider>,
    )

    expect(html).toContain('3')
  })

  it('throws a clear error outside its matching Provider', () => {
    const [useCounter] = bindStore<CounterStore>('Counter')

    const OutsideProvider = () => {
      useCounter(s => ({ count: s.count }))
      return null
    }

    expect(() => renderToString(<OutsideProvider />)).toThrow(
      'Kerros store hook must be used within its matching Provider',
    )
  })
})
