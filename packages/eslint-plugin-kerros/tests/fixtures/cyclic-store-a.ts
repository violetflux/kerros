import type { StoreHook, StoreProvider } from '@violetflux/kerros'
import type { CyclicValue } from './cyclic-types'
import { create } from './reexport'
import { useAModel } from './cyclic-model'

export const [useA, AProvider]: readonly [
  StoreHook<CyclicValue>,
  StoreProvider<Record<never, never>>,
] = create<CyclicValue>(useAModel)
