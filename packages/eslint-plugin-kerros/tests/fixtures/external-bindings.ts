import { bindStore } from '@violetflux/kerros'
import type { CachedStore } from './external-store'

export const [useExternal, ExternalProvider, useExternalInstance] = bindStore<CachedStore>()
