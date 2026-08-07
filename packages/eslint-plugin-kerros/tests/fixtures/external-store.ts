import { useEffectEvent, useSyncExternalStore } from 'react'

export class CachedStore {
  private snapshot = { count: 0 }

  getSnapshot() {
    return this.snapshot
  }

  subscribe() {
    return () => {}
  }
}

export class UncachedStore {
  getSnapshot() {
    return { count: 0 }
  }

  subscribe() {
    return () => {}
  }
}

export class PropertyStore {
  getSnapshot = () => ({ count: 0 })

  subscribe() {
    return () => {}
  }
}

const externalSnapshot = { count: 0 }

export function useExternalSyncModel() {
  return useSyncExternalStore(() => () => {}, () => externalSnapshot)
}

export function useExternalEffectModel() {
  const event = useEffectEvent(() => {})
  // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional invalid fixture for no-effect-event-action
  const action = event

  return { action }
}
