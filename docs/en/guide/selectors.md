# Automatic tracking and selectors

Kerros Store Hooks use automatic property tracking by default. Call the Hook without an argument and immediately read the fields the component needs.

## Default: automatic property tracking

```tsx
function Avatar() {
  const { online } = useUser()
  return <span>{online ? 'Online' : 'Offline'}</span>
}
```

Kerros records the object, array, and nested properties read while the component renders. Changing an unread field does not rerender `Avatar`, and Kerros does not deep-compare the complete Store.

Read the tracked value immediately. Destructuring and direct property access are safe:

```tsx
const { profile, setOnline } = useUser()
const name = useUser().profile.name
```

Do not save, return, spread, serialize, or pass the complete result. Those operations make the subscription broad or let the render-scoped Proxy escape.

## Nested properties and conditional reads

Tracking follows the property path that is actually read:

```tsx
function Profile() {
  const { profile } = useUser()
  return <strong>{profile.name}</strong>
}
```

This component observes `profile.name`. Array indexes and property enumeration are also tracked. Conditional reads update after the render that takes the new branch.

`Map`, `Set`, class instances, and other atomic objects are compared by whole reference. Primitive Store snapshots use `Object.is`.

## Advanced: explicit selectors

Use an explicit selector for derived values or a measured hot spot:

```tsx
const { name, online } = useUser(s => ({
  name: s.profile.name,
  online: s.online,
}))
```

Keep it inline and name the parameter `s`. Kerros shallowly compares the returned object's top-level fields with `Object.is`; the outer object may be newly allocated.

Avoid creating unstable arrays, objects, or functions inside a selector:

```tsx
// Avoid: a new array on every Store read
const { onlineUsers } = useUser(s => ({
  onlineUsers: s.users.filter(user => user.online),
}))
```

Create and memoize the derived value in the model, then select that stable field. Do not select the complete Store with `s => ({ value: s })`.

## Disable tracking

Use `{ tracking: false }` only when selector-free calls should compare the complete Store at the top level:

```tsx
const [useUser, UserProvider] = createStore(useUserModel, {
  tracking: false,
})
```

This is top-level shallow equality, not deep equality. Explicit selectors keep their normal behavior.
