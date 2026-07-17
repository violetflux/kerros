# Selectors

Every Kerros consumer explicitly selects an object:

```tsx
const { name, save } = useSettings(s => ({
  name: s.profile.name,
  save: s.save,
}))
```

Nested reads such as `s.profile.name` work normally. Kerros rerenders the component only when a selected top-level value changes according to `Object.is`.

## Shallow equality

This selector returns a new object on every render, but it remains equal while `name` and `save` retain their identities:

```tsx
s => ({ name: s.profile.name, save: s.save })
```

Do not select the entire store unless the component truly depends on every field:

```tsx
// Avoid broad subscriptions
const { store } = useExample(s => ({ store: s }))
```

Actions are ordinary React values. If a store is not compiled with React Compiler, stabilize actions with React's normal memoization tools when their identities matter.
