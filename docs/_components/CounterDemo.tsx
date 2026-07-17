import { useState } from 'react'
import { createStore } from '../../src'

const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})

/**
 * Render the interactive counter body
 */
function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))

  return (
    <button
      type="button"
      onClick={() => setCount(count + 1)}
      style={{
        border: 0,
        borderRadius: 8,
        padding: '10px 16px',
        color: 'white',
        background: '#7357ff',
        cursor: 'pointer',
      }}
    >
      Count: {count}
    </button>
  )
}

/**
 * Mount an isolated Kerros Provider for the documentation demo
 */
export default function CounterDemo() {
  return (
    <CounterProvider>
      <Counter />
    </CounterProvider>
  )
}
