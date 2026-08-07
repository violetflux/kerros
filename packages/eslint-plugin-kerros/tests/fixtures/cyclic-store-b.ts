import { createStore as makeStore } from '@violetflux/kerros'
import type { StoreHook, StoreProvider } from '@violetflux/kerros'
import type { CyclicValue } from './cyclic-types'
import { useA as useAAlias } from './cyclic-store-a'

function useBModel(): CyclicValue {
  const { value } = useAAlias(() => ({ value: 1 }))
  return { value }
}

export const [useBDirect, BProvider]: readonly [
  StoreHook<CyclicValue>,
  StoreProvider<Record<never, never>>,
] = makeStore<CyclicValue>(useBModel)
