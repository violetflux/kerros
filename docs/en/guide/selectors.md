# Automatic tracking and selectors

Kerros Store Hooks use automatic property tracking by default. Call the Hook without an argument and treat its result as the component's read-only tracked snapshot.

## Default: automatic property tracking

```tsx
function Avatar() {
  const { online } = useUser()
  return <span>{online ? 'Online' : 'Offline'}</span>
}
```

Kerros records the object, array, and nested properties read while the component renders. Changing an unread field does not rerender `Avatar`, and Kerros does not deep-compare the complete Store.

Destructure the snapshot directly or keep it in a render-local variable, just as you would with Valtio's `useSnapshot`:

```tsx
const { profile, setOnline } = useUser()
const snapshot = useUser()
const name = snapshot.profile.name
```

You may pass the snapshot or one of its nested objects to a synchronously rendered child; property reads during the child's render are still tracked. A custom Hook may also return the snapshot for continued use in the same render chain.

Do not mutate the snapshot or retain it in state, a ref, a module variable, or a long-lived cache as if it were a live state object. `Object.keys`, object spread, rest destructuring, and serialization enumerate the complete object and therefore create broad subscriptions.

Read Effect dependencies during render and declare them normally:

```tsx
const snapshot = useUser()
const name = snapshot.profile.name

useEffect(() => {
  reportName(name)
}, [name])
```

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

## React values and exact identity

React elements and portals are detected lazily when their path is read and are returned without a Proxy. Standard `useRef()` and `createRef()` containers can also be returned directly; they work with DOM refs, `forwardRef`, and `useImperativeHandle` in React 17, 18, and 19:

```tsx
function usePanelModel() {
  const containerRef = useRef<HTMLDivElement>(null)
  return { containerRef, icon: <PanelIcon /> }
}
```

Use `ref()` only for a Proxy-intolerant third-party object or when strict object identity must survive the tracked snapshot:

```tsx
import { ref } from '@violetflux/kerros'

const client = ref(new ThirdPartyClient())
```

An atomic value is observed only by reference. Mutating `client` or a `Map`/`Set` in place does not publish an update; replace the containing snapshot field with a new reference for reactive changes. A standard React ref is also non-reactive: changing `.current` does not rerender a component.

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
