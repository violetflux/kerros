# Selectors and rerenders

Every Kerros Store Hook requires a selector. The selector receives the complete Store and returns an object containing the fields used by the current component.

## Select one field

Start with a user Store:

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

const [useUser, UserProvider] = createStore(() => {
  const [profile, setProfile] = useState({
    name: 'Violet',
    city: 'Hangzhou',
  })
  const [online, setOnline] = useState(false)

  return { profile, setProfile, online, setOnline }
})
```

An avatar only needs the online status:

```tsx
function Avatar() {
  const { online } = useUser(s => ({ online: s.online }))

  return <span>{online ? 'Online' : 'Offline'}</span>
}
```

Updating `profile` does not rerender `Avatar`, because it only subscribes to `online`.

## Select several fields

Return state and actions in the same selector object:

```tsx
function OnlineButton() {
  const { online, setOnline } = useUser(s => ({
    online: s.online,
    setOnline: s.setOnline,
  }))

  return (
    <button onClick={() => setOnline(!online)}>
      {online ? 'Go offline' : 'Go online'}
    </button>
  )
}
```

The selector may stay inline and does not need `useCallback`.

## Select nested fields

Nested paths such as `s.profile.name` work directly:

```tsx
const { name } = useUser(s => ({ name: s.profile.name }))
```

Kerros compares the top-level fields returned by the selector. The top-level field above is `name`, so changing `profile.city` does not rerender the component.

These selectors subscribe to different values:

```tsx
// Rerenders when the profile object reference changes
const { profile } = useUser(s => ({ profile: s.profile }))

// Rerenders only when name changes
const { name } = useUser(s => ({ name: s.profile.name }))
```

## Top-level shallow equality

The selector creates a new outer object each time:

```tsx
s => ({ online: s.online, setOnline: s.setOnline })
```

Kerros does not compare that outer object by reference. It compares `online` and `setOnline` individually with `Object.is`. When both fields are unchanged, the selection is equal.

Avoid creating new arrays or objects inside the selector:

```tsx
// Creates a new array every time
const { onlineUsers } = useUser(s => ({
  onlineUsers: s.users.filter(user => user.online),
}))
```

Compute that value in the Store Hook with normal React memoization, then select the stable result:

```tsx
const onlineUsers = useMemo(
  () => users.filter(user => user.online),
  [users],
)

return { users, onlineUsers }
```

```tsx
const { onlineUsers } = useUser(s => ({ onlineUsers: s.onlineUsers }))
```

## Do not select the whole Store

This subscribes the component to every field:

```tsx
const { value } = useUser(s => ({ value: s }))
```

Select the fields the component actually uses instead:

```tsx
const { name, online } = useUser(s => ({
  name: s.profile.name,
  online: s.online,
}))
```

The larger a Store becomes, the more specific its selectors should be.
