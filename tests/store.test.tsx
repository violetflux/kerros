import { StrictMode, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createStore } from '../src'
import { act, render } from './render'

describe('createStore', () => {
  it('initializes from Provider props and publishes prop updates', async () => {
    const [useGreeting, GreetingProvider] = createStore(
      ({ greeting }: { greeting: string }) => ({ greeting }),
    )

    const Greeting = () => {
      const { greeting } = useGreeting(s => ({ greeting: s.greeting }))
      return <span>{greeting}</span>
    }

    const view = await render(
      <GreetingProvider greeting="hello">
        <Greeting />
      </GreetingProvider>,
    )

    expect(view.container.textContent).toBe('hello')

    await view.rerender(
      <GreetingProvider greeting="kerros">
        <Greeting />
      </GreetingProvider>,
    )

    expect(view.container.textContent).toBe('kerros')
  })

  it('creates a new Store instance when the Provider key changes', async () => {
    const [useCounter, CounterProvider] = createStore(
      ({ initialCount }: { initialCount: number }) => {
        const [count, setCount] = useState(initialCount)
        return { count, setCount }
      },
    )

    let setCount: (value: number) => void = () => undefined

    const Counter = () => {
      const selected = useCounter(s => ({
        count: s.count,
        setCount: s.setCount,
      }))
      setCount = selected.setCount
      return <span>{selected.count}</span>
    }

    const view = await render(
      <CounterProvider key="first" initialCount={1}>
        <Counter />
      </CounterProvider>,
    )

    await act(() => setCount(2))
    expect(view.container.textContent).toBe('2')

    await view.rerender(
      <CounterProvider key="second" initialCount={10}>
        <Counter />
      </CounterProvider>,
    )

    expect(view.container.textContent).toBe('10')
  })

  it('does not rerender when an unselected field changes', async () => {
    const [useExample, ExampleProvider] = createStore(() => {
      const [selected, setSelected] = useState(0)
      const [ignored, setIgnored] = useState(0)

      return { selected, ignored, setSelected, setIgnored }
    })

    let renders = 0
    let setIgnored: (value: number) => void = () => undefined

    const SelectedValue = () => {
      const selected = useExample(s => ({
        selected: s.selected,
        setIgnored: s.setIgnored,
      }))

      renders += 1
      setIgnored = selected.setIgnored
      return <span>{selected.selected}</span>
    }

    const view = await render(
      <ExampleProvider>
        <SelectedValue />
      </ExampleProvider>,
    )
    const initialRenders = renders

    await act(() => setIgnored(1))

    expect(view.container.textContent).toBe('0')
    expect(renders).toBe(initialRenders)
  })

  it('supports nested property selectors', async () => {
    const [useProfile, ProfileProvider] = createStore(() => ({
      profile: { details: { name: 'Kerros' } },
    }))

    const Profile = () => {
      const { name } = useProfile(s => ({ name: s.profile.details.name }))
      return <span>{name}</span>
    }

    const view = await render(
      <ProfileProvider>
        <Profile />
      </ProfileProvider>,
    )

    expect(view.container.textContent).toBe('Kerros')
  })

  it('unsubscribes consumers when they unmount', async () => {
    const [useCounter, CounterProvider] = createStore(() => {
      const [count, setCount] = useState(0)
      return { count, setCount }
    })

    let renders = 0
    let setCount: (value: number) => void = () => undefined
    let setVisible: (value: boolean) => void = () => undefined

    const Counter = () => {
      const { count } = useCounter(s => ({ count: s.count }))
      renders += 1
      return <span>{count}</span>
    }

    const Controller = () => {
      const selected = useCounter(s => ({ setCount: s.setCount }))
      setCount = selected.setCount
      return null
    }

    const App = () => {
      const [visible, updateVisible] = useState(true)
      setVisible = updateVisible

      return (
        <CounterProvider>
          <Controller />
          {visible && <Counter />}
        </CounterProvider>
      )
    }

    await render(<App />)
    await act(() => setVisible(false))
    const rendersAfterUnmount = renders
    await act(() => setCount(1))

    expect(renders).toBe(rendersAfterUnmount)
  })

  it('works in StrictMode', async () => {
    const [useCounter, CounterProvider] = createStore(() => {
      const [count, setCount] = useState(0)
      return { count, setCount }
    })

    let increment: () => void = () => undefined

    const Counter = () => {
      const selected = useCounter(s => ({
        count: s.count,
        setCount: s.setCount,
      }))
      increment = () => selected.setCount(selected.count + 1)
      return <span>{selected.count}</span>
    }

    const view = await render(
      <StrictMode>
        <CounterProvider>
          <Counter />
        </CounterProvider>
      </StrictMode>,
    )

    await act(() => increment())
    expect(view.container.textContent).toBe('1')
  })

  it('supports one-way dependencies between nested stores', async () => {
    const [useCounter, CounterProvider] = createStore(() => {
      const [count, setCount] = useState(1)
      return { count, setCount }
    })
    const [useDouble, DoubleProvider] = createStore(() => {
      const { count } = useCounter(s => ({ count: s.count }))
      return { double: count * 2 }
    })

    let setCount: (value: number) => void = () => undefined

    const Controller = () => {
      const selected = useCounter(s => ({ setCount: s.setCount }))
      setCount = selected.setCount
      return null
    }

    const Double = () => {
      const { double } = useDouble(s => ({ double: s.double }))
      return <span>{double}</span>
    }

    const view = await render(
      <CounterProvider>
        <Controller />
        <DoubleProvider>
          <Double />
        </DoubleProvider>
      </CounterProvider>,
    )

    expect(view.container.textContent).toBe('2')
    await act(() => setCount(3))
    expect(view.container.textContent).toBe('6')
  })

  it('throws a clear error outside its matching Provider', () => {
    const [useExample] = createStore(() => ({ value: true }))

    const OutsideProvider = () => {
      useExample(s => ({ value: s.value }))
      return null
    }

    expect(() => renderToString(<OutsideProvider />)).toThrow(
      'Kerros store hook must be used within its matching Provider',
    )
  })
})
