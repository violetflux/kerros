import type { Context, FC, PropsWithChildren } from 'react'
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

/** Existing external Store contract supported by bindStore */
export interface ExternalStore<TSnapshot> {
  /** Read the current immutable snapshot */
  getSnapshot: () => TSnapshot
  /** Subscribe to snapshot changes */
  subscribe: (listener: () => void) => () => void
}

/** Extract the snapshot exposed by an external Store */
export type ExternalStoreSnapshot<TStore> = TStore extends ExternalStore<infer TSnapshot>
  ? TSnapshot
  : never

/** React bindings created for an existing external Store type */
export type StoreBinding<
  TStore extends ExternalStore<TSnapshot>,
  TSnapshot = ExternalStoreSnapshot<TStore>,
> = readonly [
  StoreHook<TSnapshot>,
  StoreProvider<{ store: TStore }>,
  () => TStore,
]

/** Stable snapshot container owned by one Provider instance */
interface StoreContainer<TStore> extends ExternalStore<TStore> {
  /** Publish the next Store snapshot */
  publish: (snapshot: TStore) => void
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
    const container = useStoreContext(StoreContext)

    return useStoreSelector(container, selector)
  }

  return [useStore, StoreProvider] as const
}

/**
 * Bind existing external Store instances to scoped React consumers
 */
export function bindStore<
  TStore extends ExternalStore<TSnapshot>,
  TSnapshot = ExternalStoreSnapshot<TStore>,
>(
  name = 'KerrosExternalStore',
): StoreBinding<TStore, TSnapshot> {
  const StoreContext = createContext<TStore | undefined>(undefined)

  /** Provide one existing Store instance without copying its snapshot */
  const StoreProvider: StoreProvider<{ store: TStore }> = (props) => {
    const { children, store } = props

    return createElement(StoreContext.Provider, { value: store }, children)
  }

  StoreProvider.displayName = `${name}Provider`
  StoreContext.displayName = `${name}Context`

  /** Select snapshot fields directly from the bound external Store */
  const useStore: StoreHook<TSnapshot> = selector => {
    const store = useStoreContext(StoreContext)

    return useStoreSelector(store, selector)
  }

  /** Read the exact Store instance bound to the current Provider */
  const useInstance = () => useStoreContext(StoreContext)

  return [useStore, StoreProvider, useInstance] as const
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
 * Read the Store bound to the current Provider
 */
function useStoreContext<TStore>(
  context: Context<TStore | undefined>,
): TStore {
  const store = useContext(context)

  if (!store) {
    throw new Error(
      'Kerros store hook must be used within its matching Provider',
    )
  }

  return store
}

/**
 * Select fields directly from an external Store subscription
 */
function useStoreSelector<TSnapshot, TSelection extends object>(
  store: ExternalStore<TSnapshot>,
  selector: StoreSelector<TSnapshot, TSelection>,
): TSelection {
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    selector,
    shallowEqual,
  )
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
