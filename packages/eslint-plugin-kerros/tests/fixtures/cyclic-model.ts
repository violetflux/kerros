import type { CyclicValue } from './cyclic-types'
import { useB as useBAlias } from './cyclic-reexport'

export function useAModel(): CyclicValue {
  const { value } = useBAlias(() => ({ value: 1 }))
  return { value }
}
