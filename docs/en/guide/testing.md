# Testing

A Kerros Provider is an ordinary React component. Render a new Provider in each test to get isolated state without resetting a global Store.

This example uses Vitest and Testing Library.

## Prepare the test component

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

function useCounterModel() {
  const [count, setCount] = useState(0)

  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterModel)

function Counter() {
  const { count, setCount } = useCounter()

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

## Test an update

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

test('increments after a click', async () => {
  const user = userEvent.setup()

  render(
    <CounterProvider>
      <Counter />
    </CounterProvider>,
  )

  await user.click(screen.getByRole('button'))

  expect(screen.getByRole('button')).toHaveTextContent('1')
})
```

The next test mounts a new `CounterProvider`, so `count` starts at `0` again.

## Test Provider props

Provider props are passed to the Store Hook and can be tested with `rerender`:

```tsx
interface GreetingProps {
  name: string
}

function useGreetingModel({ name }: GreetingProps) {
  return { message: `Hello, ${name}` }
}

const [useGreeting, GreetingProvider] = createStore(useGreetingModel)

function Greeting() {
  const { message } = useGreeting()
  return <p>{message}</p>
}

test('publishes updated Provider props', () => {
  const view = render(
    <GreetingProvider name="Violet">
      <Greeting />
    </GreetingProvider>,
  )

  expect(screen.getByText('Hello, Violet')).toBeInTheDocument()

  view.rerender(
    <GreetingProvider name="Kerros">
      <Greeting />
    </GreetingProvider>,
  )

  expect(screen.getByText('Hello, Kerros')).toBeInTheDocument()
})
```

## Test the missing Provider error

Public Store packages should verify the Provider boundary:

```tsx
function Consumer() {
  useCounter()
  return null
}

expect(() => render(<Consumer />)).toThrow(
  'Kerros store hook must be used within its matching Provider',
)
```

## Test selector isolation

Only count renders when subscription behavior itself is under test. Create selected and ignored fields, subscribe to one, and update the other:

```tsx
function useExampleModel() {
  const [selected, setSelected] = useState(0)
  const [ignored, setIgnored] = useState(0)

  return { selected, setSelected, ignored, setIgnored }
}

const [useExample, ExampleProvider] = createStore(useExampleModel)
```

When the selector's top-level field references stay equal, updating `ignored` must not rerender the selected consumer.

Reusable Store packages should also cover Strict Mode, consumer unmounting, server rendering, and multiple Provider instances.
