import type { FC, PropsWithChildren } from 'react'
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'

/** Store selector returning an object compared with shallow equality */
export type StoreSelector<TStore, TSelection extends object> = (
  store: TStore,
) => TSelection

/** Hook used by consumers to select Store fields */
export interface StoreHook<TStore> {
  <TSelection extends object>(
    selector: StoreSelector<TStore, TSelection>,
  ): TSelection
}

/** Provider created for a Store hook */
export type StoreProvider<TProps> = FC<PropsWithChildren<TProps>>

/** Stable snapshot container owned by one Provider instance */
interface StoreContainer<TStore> {
  /** Read the current Store snapshot */
  getSnapshot: () => TStore
  /** Publish the next Store snapshot */
  publish: (snapshot: TStore) => void
  /** Subscribe to Store snapshot changes */
  subscribe: (listener: () => void) => () => void
}

const useStoreLayoutEffect = typeof window === 'undefined'
  ? useEffect
  : useLayoutEffect

/**
 * Create a selector-first React Store and its matching Provider
 */
export function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>] {
  const StoreContext = createContext<StoreContainer<TStore> | undefined>(undefined)
  const storeName = useStoreValue.name || 'KerrosStore'

  /** Run the Store hook and publish its committed snapshot */
  const StoreProvider: StoreProvider<TProps> = (props) => {
    const { children, ...storeProps } = props
    const value = useStoreValue(storeProps as TProps)
    const [container] = useState(() => createStoreContainer(value))

    // Publish after commit so consumers never observe an uncommitted Provider render
    useStoreLayoutEffect(() => container.publish(value), [container, value])

    return createElement(StoreContext.Provider, { value: container }, children)
  }

  StoreProvider.displayName = `${storeName}Provider`
  StoreContext.displayName = `${storeName}Context`

  /** Select Store fields through the stable Provider container */
  const useStore: StoreHook<TStore> = selector => {
    const container = useContext(StoreContext)

    if (!container) {
      throw new Error(
        'Kerros store hook must be used within its matching Provider',
      )
    }

    return useSyncExternalStoreWithSelector(
      container.subscribe,
      container.getSnapshot,
      container.getSnapshot,
      selector,
      shallowEqual,
    )
  }

  return [useStore, StoreProvider] as const
}

/**
 * Create the stable external-store container for one Provider instance
 */
function createStoreContainer<TStore>(
  initialSnapshot: TStore,
): StoreContainer<TStore> {
  let snapshot = initialSnapshot
  const listeners = new Set<() => void>()

  return {
    getSnapshot: () => snapshot,
    publish: nextSnapshot => {
      if (Object.is(snapshot, nextSnapshot))
        return

      snapshot = nextSnapshot

      for (const listener of listeners)
        listener()
    },
    subscribe: listener => {
      listeners.add(listener)

      return () => listeners.delete(listener)
    },
  }
}

/**
 * Compare selector objects by their enumerable top-level fields
 */
function shallowEqual(left: object, right: object) {
  if (Object.is(left, right))
    return true

  const leftKeys = Object.keys(left)

  if (leftKeys.length !== Object.keys(right).length)
    return false

  return leftKeys.every(key => (
    Object.prototype.hasOwnProperty.call(right, key)
    && Object.is(
      (left as Record<string, unknown>)[key],
      (right as Record<string, unknown>)[key],
    )
  ))
}
