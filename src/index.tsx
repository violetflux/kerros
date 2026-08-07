import type { Context, FC, PropsWithChildren } from 'react'
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'
import { useStoreValue } from './tracking'

declare const storeHookMarker: unique symbol
declare const storeInstanceHookMarker: unique symbol
declare const externalStoreProviderMarker: unique symbol

/** Store behavior options */
export interface StoreOptions {
  /** Automatically track properties read by selector-free Store hooks */
  tracking?: boolean
}

/** Store selector returning an object compared with shallow equality */
export type StoreSelector<TStore, TSelection extends object> = (
  store: TStore,
) => TSelection

/** Hook used by consumers to select Store fields */
export interface StoreHook<TStore> {
  /** Type-only Store hook identity */
  readonly [storeHookMarker]: TStore
  (): TStore
  <TSelection extends object>(
    selector: StoreSelector<TStore, TSelection>,
  ): TSelection
}

/** Provider created for a Store hook */
export type StoreProvider<TProps> = FC<PropsWithChildren<TProps>>

/** Hook returning the exact external Store instance */
interface StoreInstanceHook<TStore> {
  /** Type-only Store instance hook identity */
  readonly [storeInstanceHookMarker]: TStore
  (): TStore
}

/** Provider carrying an existing external Store instance */
type ExternalStoreProvider<TStore> = StoreProvider<{ store: TStore }> & {
  /** Type-only external Store Provider identity */
  readonly [externalStoreProviderMarker]: TStore
}

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
  ExternalStoreProvider<TStore>,
  StoreInstanceHook<TStore>,
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
 * Create a React Store with automatic tracking and explicit selector support
 */
export function createStore<TStore, TProps = Record<never, never>>(
  useModel: (props: TProps) => TStore,
  options?: StoreOptions,
): readonly [StoreHook<TStore>, StoreProvider<TProps>] {
  const StoreContext = createContext<StoreContainer<TStore> | undefined>(undefined)
  const storeName = useModel.name || 'KerrosStore'
  const tracking = options?.tracking ?? true

  /** Run the model Hook and publish its committed snapshot */
  const StoreProvider: StoreProvider<TProps> = (props) => {
    const { children, ...storeProps } = props
    const model = useModel(storeProps as TProps)
    const [container] = useState(() => createStoreContainer(model))

    // Publish after commit so consumers never observe an uncommitted Provider render
    useStoreLayoutEffect(() => container.publish(model), [container, model])

    return createElement(StoreContext.Provider, { value: container }, children)
  }

  StoreProvider.displayName = `${storeName}Provider`
  StoreContext.displayName = `${storeName}Context`

  /** Select Store fields through the stable Provider container */
  const useStore = (<TSelection extends object>(
    selector?: StoreSelector<TStore, TSelection>,
  ) => {
    const container = useStoreContext(StoreContext)

    return useStoreValue(container, selector, tracking)
  }) as StoreHook<TStore>

  return [useStore, StoreProvider] as const
}

/**
 * Bind existing external Store instances to scoped React consumers
 */
export function bindStore<
  TStore extends ExternalStore<TSnapshot>,
  TSnapshot = ExternalStoreSnapshot<TStore>,
>(
  options?: StoreOptions,
): StoreBinding<TStore, TSnapshot>
export function bindStore<
  TStore extends ExternalStore<TSnapshot>,
  TSnapshot = ExternalStoreSnapshot<TStore>,
>(
  name?: string,
  options?: StoreOptions,
): StoreBinding<TStore, TSnapshot>
export function bindStore<
  TStore extends ExternalStore<TSnapshot>,
  TSnapshot = ExternalStoreSnapshot<TStore>,
>(
  nameOrOptions: string | StoreOptions = 'KerrosExternalStore',
  inputOptions?: StoreOptions,
): StoreBinding<TStore, TSnapshot> {
  const name = typeof nameOrOptions === 'string'
    ? nameOrOptions
    : 'KerrosExternalStore'
  const options = typeof nameOrOptions === 'string'
    ? inputOptions
    : nameOrOptions
  const tracking = options?.tracking ?? true
  const StoreContext = createContext<TStore | undefined>(undefined)

  /** Provide one existing Store instance without copying its snapshot */
  const StoreProvider = ((props: PropsWithChildren<{ store: TStore }>) => {
    const { children, store } = props

    return createElement(StoreContext.Provider, { value: store }, children)
  }) as ExternalStoreProvider<TStore>

  StoreProvider.displayName = `${name}Provider`
  StoreContext.displayName = `${name}Context`

  /** Select snapshot fields directly from the bound external Store */
  const useStore = (<TSelection extends object>(
    selector?: StoreSelector<TSnapshot, TSelection>,
  ) => {
    const store = useStoreContext(StoreContext)

    return useStoreValue(store, selector, tracking)
  }) as StoreHook<TSnapshot>

  /** Read the exact Store instance bound to the current Provider */
  const useInstance = (() => useStoreContext(StoreContext)) as StoreInstanceHook<TStore>

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
