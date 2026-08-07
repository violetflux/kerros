/*!
 * Adapted from proxy-compare 3.0.1.
 * Copyright (c) 2020 Daishi Kato. Licensed under the MIT License.
 */

type PropertyKeySet = Set<string | symbol>

interface UsedProperties {
  /** Properties checked with the `in` operator */
  has?: PropertyKeySet
  /** Properties checked with getOwnPropertyDescriptor */
  own?: PropertyKeySet
  /** Properties read through get */
  keys?: PropertyKeySet
  /** Whether all own keys were enumerated */
  all?: true
}

interface ProxyState<T extends object> {
  /** Access map owned by the current Hook render */
  affected?: Affected
  /** Whether proxy invariants required a copied target */
  copied: boolean
  /** Stable compare Proxy */
  proxy?: T
  /** Per-Hook Proxy cache */
  proxyCache?: ProxyCache<object>
  /** Cross-Hook target inspection cache */
  targetCache?: TargetCache<object>
}

type Affected = WeakMap<object, UsedProperties>
type ProxyCache<T extends object> = WeakMap<
  object,
  readonly [ProxyHandler<T>, ProxyState<T>]
>
type TargetCache<T extends object> = WeakMap<
  object,
  readonly [target: T, copiedTarget?: T]
>

const trackMemoSymbol = Symbol()
const getOriginalSymbol = Symbol()
const reactElementType = Symbol.for('react.element')
const reactTransitionalElementType = Symbol.for('react.transitional.element')
const reactPortalType = Symbol.for('react.portal')
const objectPrototype = Object.prototype
const arrayPrototype = Array.prototype
const trackingOverrides = new WeakMap<object, boolean>()

/** Create an access-tracking Proxy and lazily preserve React atomic values */
export function createProxy<T>(
  value: T,
  affected: WeakMap<object, unknown>,
  proxyCache?: WeakMap<object, unknown>,
  targetCache?: WeakMap<object, unknown>,
): T {
  if (!isObjectToTrack(value))
    return value

  const typedTargetCache = targetCache as TargetCache<typeof value> | undefined
  let targetAndCopied = typedTargetCache?.get(value)

  if (!targetAndCopied) {
    const target = getOriginalObject(value)

    targetAndCopied = needsToCopyTargetObject(target)
      ? [target, copyTargetObject(target)]
      : [target]
    typedTargetCache?.set(value, targetAndCopied)
  }

  const [target, copiedTarget] = targetAndCopied
  const typedProxyCache = proxyCache as ProxyCache<typeof target> | undefined
  let handlerAndState = typedProxyCache?.get(target)

  if (!handlerAndState || handlerAndState[1].copied !== Boolean(copiedTarget)) {
    handlerAndState = createProxyHandler(target, Boolean(copiedTarget))
    handlerAndState[1].proxy = new Proxy(
      copiedTarget ?? target,
      handlerAndState[0],
    )
    typedProxyCache?.set(target, handlerAndState)
  }

  handlerAndState[1].affected = affected as Affected
  handlerAndState[1].proxyCache = proxyCache as ProxyCache<object> | undefined
  handlerAndState[1].targetCache = targetCache as TargetCache<object> | undefined

  return handlerAndState[1].proxy as typeof target
}

/** Compare only paths read through a previous tracking Proxy */
export function isChanged(
  previous: unknown,
  next: unknown,
  affected: WeakMap<object, unknown>,
  cache?: WeakMap<object, unknown>,
  isEqual: (left: unknown, right: unknown) => boolean = Object.is,
): boolean {
  if (isEqual(previous, next))
    return false
  if (!isObject(previous) || !isObject(next))
    return true

  const used = (affected as Affected).get(getOriginalObject(previous))

  if (!used)
    return true

  if (cache) {
    const cached = cache.get(previous)

    if (cached === next)
      return false

    cache.set(previous, next)
  }

  let changed: boolean | null = null

  for (const key of used.has ?? []) {
    changed = Reflect.has(previous, key) !== Reflect.has(next, key)
    if (changed)
      return true
  }

  if (used.all) {
    changed = areOwnKeysChanged(previous, next)
    if (changed)
      return true
  }
  else {
    for (const key of used.own ?? []) {
      changed = Boolean(Reflect.getOwnPropertyDescriptor(previous, key))
        !== Boolean(Reflect.getOwnPropertyDescriptor(next, key))
      if (changed)
        return true
    }
  }

  for (const key of used.keys ?? []) {
    changed = isChanged(
      Reflect.get(previous, key),
      Reflect.get(next, key),
      affected,
      cache,
      isEqual,
    )
    if (changed)
      return true
  }

  if (changed === null)
    throw new Error('Invalid Kerros access tracking state')

  return changed
}

/** Mark an exact object identity as tracked or atomic */
export function markToTrack(value: object, track = true) {
  trackingOverrides.set(value, track)
}

/** Build the handler state shared by a single cached Proxy */
function createProxyHandler<T extends object>(
  original: T,
  copied: boolean,
): readonly [ProxyHandler<T>, ProxyState<T>] {
  const state: ProxyState<T> = { copied }
  let trackWholeObject = false

  /** Record one access operation against the original snapshot object */
  const record = (
    operation: 'all' | 'has' | 'keys' | 'own',
    key?: string | symbol,
  ) => {
    if (trackWholeObject)
      return

    let used = state.affected?.get(original)

    if (!used) {
      used = {}
      state.affected?.set(original, used)
    }

    if (operation === 'all') {
      used.all = true
      return
    }

    let keys = used[operation]

    if (!keys) {
      keys = new Set()
      used[operation] = keys
    }

    keys.add(key as string | symbol)
  }

  const handler: ProxyHandler<T> = {
    get: (target, key) => {
      if (key === getOriginalSymbol)
        return original

      record('keys', key)

      return createProxy(
        Reflect.get(target, key),
        state.affected as Affected,
        state.proxyCache,
        state.targetCache,
      )
    },
    getOwnPropertyDescriptor: (target, key) => {
      record('own', key)
      return Reflect.getOwnPropertyDescriptor(target, key)
    },
    has: (target, key) => {
      if (key === trackMemoSymbol) {
        trackWholeObject = true
        state.affected?.delete(original)
        return true
      }

      record('has', key)
      return Reflect.has(target, key)
    },
    ownKeys: target => {
      record('all')
      return Reflect.ownKeys(target)
    },
  }

  if (copied) {
    handler.deleteProperty = () => false
    handler.set = () => false
  }

  return [handler, state]
}

/** Decide lazily whether one reached value supports recursive tracking */
function isObjectToTrack<T>(value: T): value is T & object {
  if (!isObject(value))
    return false

  if (trackingOverrides.has(value))
    return trackingOverrides.get(value) as boolean

  const prototype = Object.getPrototypeOf(value) as unknown

  if (prototype === arrayPrototype)
    return true
  if (prototype !== objectPrototype)
    return false

  const marker = (value as { $$typeof?: unknown }).$$typeof

  return marker !== reactElementType
    && marker !== reactTransitionalElementType
    && marker !== reactPortalType
}

/** Narrow mutable object operations used by the compare algorithm */
function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null
}

/** Unwrap a cached tracking Proxy when comparison receives one */
function getOriginalObject<T extends object>(value: T): T {
  return (value as { [getOriginalSymbol]?: T })[getOriginalSymbol] ?? value
}

/** Detect invariant-sensitive frozen properties before Proxy creation */
function needsToCopyTargetObject(value: object) {
  return Object.values(Object.getOwnPropertyDescriptors(value)).some(
    descriptor => !descriptor.configurable && !descriptor.writable,
  )
}

/** Copy an invariant-sensitive object with configurable descriptors */
function copyTargetObject<T extends object>(value: T): T {
  if (Array.isArray(value))
    return Array.from(value) as T

  const descriptors = Object.getOwnPropertyDescriptors(value)

  for (const descriptor of Object.values(descriptors))
    descriptor.configurable = true

  return Object.create(Object.getPrototypeOf(value), descriptors) as T
}

/** Compare complete own-key enumeration in insertion order */
function areOwnKeysChanged(previous: object, next: object) {
  const previousKeys = Reflect.ownKeys(previous)
  const nextKeys = Reflect.ownKeys(next)

  return previousKeys.length !== nextKeys.length
    || previousKeys.some((key, index) => key !== nextKeys[index])
}
