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
})
