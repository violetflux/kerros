import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import { createProxy, isChanged } from 'proxy-compare'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'

interface StoreSubscription<TSnapshot> {
  getSnapshot: () => TSnapshot
  subscribe: (listener: () => void) => () => void
}

interface CommittedTracking<TSnapshot> {
  affected: WeakMap<object, unknown>
  snapshot: TSnapshot
}

const useStoreLayoutEffect = typeof window === 'undefined'
  ? useEffect
  : useLayoutEffect

/**
 * Subscribe through either an explicit selector, shallow snapshots, or render access tracking
 */
export function useStoreValue<TSnapshot, TSelection extends object>(
  store: StoreSubscription<TSnapshot>,
  selector: ((snapshot: TSnapshot) => TSelection) | undefined,
  tracking: boolean,
): TSnapshot | TSelection {
  const committedTracking = useRef<CommittedTracking<TSnapshot> | undefined>(undefined)
  const [proxyCache] = useState(() => new WeakMap<object, unknown>())
  const [calibration, calibrate] = useReducer(
    (
      previous: { snapshot: TSnapshot, version: number } | undefined,
      snapshot: TSnapshot,
    ) => ({
      snapshot,
      version: (previous?.version ?? 0) + 1,
    }),
    undefined,
  )

  const selectSnapshot = useCallback(
    (snapshot: TSnapshot): TSnapshot | TSelection => {
      const currentSnapshot = calibration
        && Object.is(calibration.snapshot, snapshot)
        ? calibration.snapshot
        : snapshot

      return selector ? selector(currentSnapshot) : currentSnapshot
    },
    [calibration, selector],
  )
  const compareSelections = useCallback(
    (previous: TSnapshot | TSelection, next: TSnapshot | TSelection) => {
      if (selector || !tracking)
        return shallowEqual(previous, next)

      const committed = committedTracking.current

      if (!committed)
        return Object.is(previous, next)

      return !isChanged(
        committed.snapshot,
        next,
        committed.affected,
        new WeakMap(),
      )
    },
    [selector, tracking],
  )
  const snapshot = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    selectSnapshot,
    compareSelections,
  )
  const affected = new WeakMap<object, unknown>()
  const shouldTrack = !selector && tracking
  const value = shouldTrack
    ? createProxy(snapshot, affected, proxyCache)
    : snapshot

  // Only committed renders replace the access set used by future subscription checks
  useStoreLayoutEffect(() => {
    if (shouldTrack) {
      const renderedSnapshot = snapshot as TSnapshot
      committedTracking.current = {
        affected,
        snapshot: renderedSnapshot,
      }

      // A newly committed access branch must be checked against the latest Store value
      const currentSnapshot = store.getSnapshot()

      if (isChanged(
        renderedSnapshot,
        currentSnapshot,
        affected,
        new WeakMap(),
      )) {
        calibrate(currentSnapshot)
      }
    }
  }, [affected, shouldTrack, snapshot, store])

  return value
}

/**
 * Compare values by identity first and enumerable top-level fields second
 */
function shallowEqual(left: unknown, right: unknown) {
  if (Object.is(left, right))
    return true

  if (!isShallowComparable(left) || !isShallowComparable(right))
    return false

  const leftKeys = Object.keys(left)

  if (leftKeys.length !== Object.keys(right).length)
    return false

  return leftKeys.every(key => (
    Object.prototype.hasOwnProperty.call(right, key)
    && Object.is(left[key], right[key])
  ))
}

/**
 * Narrow values before enumerable field comparison
 */
function isShallowComparable(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null)
    return false

  const prototype = Object.getPrototypeOf(value) as unknown

  return prototype === Object.prototype || prototype === Array.prototype
}
