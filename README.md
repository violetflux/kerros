# Kerros

Tiny, selector-first React stores with stable Providers and official external-store semantics.

```bash
bun add @violetflux/kerros
```

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

export const [useCounter, CounterProvider] = createStore(() => {
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
```

Kerros uses `use-sync-external-store/shim/with-selector`, so the same package works with React 17, 18, and 19. Selectors may be declared inline. Their returned objects are compared with top-level shallow equality.

Stores compose through normal Provider nesting: an inner store hook can select values from an outer store. This keeps dependencies explicit and prevents a global store from becoming a single rerender domain.

- [Documentation](https://violetflux.github.io/kerros/)
- [API reference](https://violetflux.github.io/kerros/api/)
- [Migration from hox](https://violetflux.github.io/kerros/guide/migration)

## License

MIT
