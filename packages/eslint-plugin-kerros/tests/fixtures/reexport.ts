import { bindStore } from '@violetflux/kerros'

export { bindStore as bind, createStore as create } from '@violetflux/kerros'

interface ReexportStore {
  getSnapshot(): { count: number }
  subscribe(listener: () => void): () => void
}

const [, , useExternalInstance] = bindStore<ReexportStore>()

export { useExternalInstance as useExternalInstanceAlias }
