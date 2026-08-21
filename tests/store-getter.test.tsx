import { StrictMode, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createStore } from '../src'
import { act, render } from './render'

describe('createStore getter', () => {
  it('reads the latest committed snapshot and clears it after unmount', async () => {
    const [, CounterProvider, getCounter] = createStore(() => {
      const [count, setCount] = useState(0)
      return { count, setCount }
    })

    expect(() => getCounter()).toThrow(
      'Kerros store getter requires a mounted Provider',
    )

    const view = await render(<CounterProvider />)

    expect(getCounter().count).toBe(0)

    await act(() => getCounter().setCount(1))

    expect(getCounter().count).toBe(1)

    await view.unmount()

    expect(() => getCounter()).toThrow(
      'Kerros store getter requires a mounted Provider',
    )
  })

  it('returns the most recently mounted Provider and falls back after unmount', async () => {
    const [, CounterProvider, getCounter] = createStore(
      ({ count }: { count: number }) => ({ count }),
    )

    const view = await render(
      <>
        <CounterProvider count={1} />
        <CounterProvider count={2} />
      </>,
    )

    expect(getCounter().count).toBe(2)

    await view.rerender(<CounterProvider count={1} />)

    expect(getCounter().count).toBe(1)
  })

  it('matches string, number, and symbol scopes without coercion', async () => {
    const [, ValueProvider, getValue] = createStore(
      ({ value }: { value: string }) => ({ value }),
    )
    const symbolScope = Symbol('symbol-scope')

    await render(
      <>
        <ValueProvider scope="main" value="named" />
        <ValueProvider scope={1} value="number" />
        <ValueProvider scope="1" value="string" />
        <ValueProvider scope={symbolScope} value="symbol" />
      </>,
    )

    expect(getValue('main').value).toBe('named')
    expect(getValue(1).value).toBe('number')
    expect(getValue('1').value).toBe('string')
    expect(getValue(symbolScope).value).toBe('symbol')
    expect(getValue().value).toBe('symbol')
  })

  it('falls back between duplicate scopes and re-registers changed scopes', async () => {
    const [, ValueProvider, getValue] = createStore(
      ({ value }: { value: string }) => ({ value }),
    )

    const view = await render(
      <>
        <ValueProvider scope="shared" value="first" />
        <ValueProvider scope="shared" value="second" />
      </>,
    )

    expect(getValue('shared').value).toBe('second')

    await view.rerender(
      <>
        <ValueProvider scope="shared" value="first" />
        <ValueProvider scope="moved" value="second" />
      </>,
    )

    expect(getValue('shared').value).toBe('first')
    expect(getValue('moved').value).toBe('second')
    expect(() => getValue('missing')).toThrow(
      'Kerros store getter could not find a mounted Provider for the requested scope',
    )

    await view.rerender(<ValueProvider scope="shared" value="first" />)

    expect(getValue('shared').value).toBe('first')
    expect(() => getValue('moved')).toThrow(
      'Kerros store getter could not find a mounted Provider for the requested scope',
    )
  })

  it('treats an inner Provider as mounted after its outer Provider', async () => {
    const [, ValueProvider, getValue] = createStore(
      ({ value }: { value: string }) => ({ value }),
    )

    const view = await render(
      <ValueProvider scope="shared" value="outer">
        <ValueProvider scope="shared" value="inner" />
      </ValueProvider>,
    )

    expect(getValue('shared').value).toBe('inner')

    await view.rerender(<ValueProvider scope="shared" value="outer" />)

    expect(getValue('shared').value).toBe('outer')
  })

  it('does not change mount precedence when an older Store updates', async () => {
    const [, CounterProvider, getCounter] = createStore(
      ({ initialCount }: { initialCount: number }) => {
        const [count, setCount] = useState(initialCount)
        return { count, setCount }
      },
    )

    await render(
      <>
        <CounterProvider scope="first" initialCount={1} />
        <CounterProvider scope="second" initialCount={2} />
      </>,
    )

    await act(() => getCounter('first').setCount(3))

    expect(getCounter('first').count).toBe(3)
    expect(getCounter().count).toBe(2)
  })

  it('passes scope to the model props', async () => {
    const [, ScopeProvider, getScope] = createStore(
      ({ scope }: { scope?: string | number | symbol }) => ({ scope }),
    )

    await render(<ScopeProvider scope={42} />)

    expect(getScope(42).scope).toBe(42)
  })

  it('does not retain duplicate registrations in StrictMode', async () => {
    const [, CounterProvider, getCounter] = createStore(() => ({ count: 1 }))
    const view = await render(
      <StrictMode>
        <CounterProvider />
      </StrictMode>,
    )

    expect(getCounter().count).toBe(1)

    await view.unmount()

    expect(() => getCounter()).toThrow(
      'Kerros store getter requires a mounted Provider',
    )
  })
})
