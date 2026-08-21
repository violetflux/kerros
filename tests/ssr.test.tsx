// @vitest-environment node

import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createStore } from '../src'

describe('server rendering', () => {
  it('reads the Provider snapshot during SSR', () => {
    const [useGreeting, GreetingProvider] = createStore(() => ({
      greeting: 'hello from Kerros',
    }))

    const Greeting = () => {
      const { greeting } = useGreeting(s => ({ greeting: s.greeting }))
      return <span>{greeting}</span>
    }

    const html = renderToString(
      <GreetingProvider>
        <Greeting />
      </GreetingProvider>,
    )

    expect(html).toContain('hello from Kerros')
  })

  it('reads automatically tracked fields during SSR', () => {
    const [useGreeting, GreetingProvider] = createStore(() => ({
      greeting: 'automatic Kerros',
    }))

    const Greeting = () => <span>{useGreeting().greeting}</span>
    const html = renderToString(
      <GreetingProvider>
        <Greeting />
      </GreetingProvider>,
    )

    expect(html).toContain('automatic Kerros')
  })

  it('does not expose an imperative Store before a Provider commits', () => {
    const [, GreetingProvider, getGreeting] = createStore(() => ({
      greeting: 'server snapshot',
    }))

    renderToString(<GreetingProvider />)

    expect(() => getGreeting()).toThrow(
      'Kerros store getter requires a mounted Provider',
    )
  })
})
