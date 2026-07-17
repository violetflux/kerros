# Testing

Kerros Providers are ordinary React components. Mount a fresh Provider for each test so state remains isolated.

## Test a consumer

```tsx
const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})

function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

test('increments', async () => {
  const user = userEvent.setup()
  render(<CounterProvider><Counter /></CounterProvider>)

  await user.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('1')
})
```

There is no global Store to reset between tests.

## Verify subscription isolation

Count renders only when subscription behavior is the behavior under test. Change an unselected field and assert that the selected consumer did not render again.

```tsx
const selected = useExample(s => ({
  value: s.value,
  setIgnored: s.setIgnored,
}))
```

Calling `setIgnored` must not rerender a component while `value` and `setIgnored` retain their identities.

## Test Provider props

Render the Provider with initial props, then rerender it with new props. Consumers should observe the committed update without temporarily seeing another Provider instance's snapshot.

## Runtime coverage

For a reusable package, include tests for:

- usage outside the matching Provider
- Provider prop initialization and updates
- unsubscription after consumer unmount
- React Strict Mode
- server rendering
- nested one-way Store dependencies
- unchanged selector output avoiding rerenders

Kerros runs the same suite against React 17, React 18, and React 19.
