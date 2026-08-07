import { create } from './reexport'
import { useSharedModel } from './models'

export const [useShared, SharedProvider] = create(useSharedModel)
