import * as React from 'react'
import { createPortal } from 'react-dom'
import { describe, expect, it } from 'vitest'
import * as Kerros from '../src'
import { act, render } from './render'

const {
  StrictMode,
  createRef,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} = React
const { bindStore, createStore, ref } = Kerros

interface MutableStore<TSnapshot> {
  getSnapshot: () => TSnapshot
  setSnapshot: (snapshot: TSnapshot) => void
  subscribe: (listener: () => void) => () => void
}

/** Create a real external Store for automatic-tracking integration tests */
function createMutableStore<TSnapshot>(initialSnapshot: TSnapshot): MutableStore<TSnapshot> {
  let snapshot = initialSnapshot
  const listeners = new Set<() => void>()

  return {
    getSnapshot: () => snapshot,
    setSnapshot: nextSnapshot => {
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

describe('React atomic values', () => {
  it('renders nested React elements without proxying their identity', async () => {
    const icon = <strong>automatic element</strong>
    const store = createMutableStore({ ui: { icon }, version: 0 })
    const [useView, ViewProvider] = bindStore<typeof store>()
    let renderedIcon: React.ReactNode
    let renders = 0

    const View = () => {
      const { ui } = useView()
      renderedIcon = ui.icon
      renders += 1
      return <div>{ui.icon}</div>
    }

    const view = await render(
      <ViewProvider store={store}>
        <View />
      </ViewProvider>,
    )
    const initialRenders = renders

    expect(view.container.textContent).toBe('automatic element')
    expect(renderedIcon).toBe(icon)

    await act(() => store.setSnapshot({ ui: { icon }, version: 1 }))
    expect(renders).toBe(initialRenders)
  })

  it('renders nested portals without proxying their identity', async () => {
    const target = document.createElement('div')
    document.body.append(target)
    const portal = createPortal(<span>automatic portal</span>, target)
    const store = createMutableStore({ ui: { portal } })
    const [useView, ViewProvider] = bindStore<typeof store>()
    let renderedPortal: React.ReactNode

    const View = () => {
      const { ui } = useView()
      renderedPortal = ui.portal
      return <>{ui.portal}</>
    }

    const view = await render(
      <ViewProvider store={store}>
        <View />
      </ViewProvider>,
    )

    expect(renderedPortal).toBe(portal)
    expect(target.textContent).toBe('automatic portal')

    await view.unmount()
    target.remove()
  })

  it('provides ref as an exact-identity tracking escape hatch', async () => {
    const client = { connect: () => 'connected' }
    const markedClient = ref(client)
    const store = createMutableStore({ nested: { client: markedClient } })
    const [useClient, ClientProvider] = bindStore<typeof store>()
    let renderedClient: typeof client | undefined

    const Client = () => {
      renderedClient = useClient().nested.client
      return <span>{renderedClient.connect()}</span>
    }

    const view = await render(
      <ClientProvider store={store}>
        <Client />
      </ClientProvider>,
    )

    expect(markedClient).toBe(client)
    expect(renderedClient).toBe(client)
    expect(view.container.textContent).toBe('connected')
  })

  it('passes useRef containers directly to React DOM across Store updates', async () => {
    let originalRef: ReturnType<typeof useRef<HTMLDivElement | null>> | undefined
    let renderedRef: ReturnType<typeof useRef<HTMLDivElement | null>> | undefined
    let setVersion: (version: number) => void = () => undefined
    const [useView, ViewProvider] = createStore(() => {
      const containerRef = useRef<HTMLDivElement | null>(null)
      const [version, updateVersion] = useState(0)
      originalRef = containerRef
      setVersion = updateVersion
      return { containerRef, version }
    })

    const View = () => {
      const { containerRef, version } = useView()
      renderedRef = containerRef
      return <div data-version={version} id="ref-target" ref={containerRef} />
    }

    const view = await render(
      <StrictMode>
        <ViewProvider>
          <View />
        </ViewProvider>
      </StrictMode>,
    )

    expect(renderedRef).not.toBe(originalRef)
    expect(originalRef?.current?.id).toBe('ref-target')
    expect(renderedRef?.current).toBe(originalRef?.current)

    await act(() => setVersion(1))
    expect(renderedRef?.current).toBe(originalRef?.current)

    await view.unmount()
    expect(originalRef?.current).toBeNull()
    expect(renderedRef?.current).toBeNull()
  })

  it('passes createRef containers through useImperativeHandle', async () => {
    interface Handle {
      ping: () => string
    }

    const originalRef = createRef<Handle>()
    let renderedRef: React.RefObject<Handle | null> | undefined
    const [useHandle, HandleProvider] = createStore(() => ({ handleRef: originalRef }))
    const HandleTarget = forwardRef<Handle>((_props, forwardedRef) => {
      useImperativeHandle(forwardedRef, () => ({ ping: () => 'pong' }), [])
      return null
    })

    const View = () => {
      const { handleRef } = useHandle()
      renderedRef = handleRef
      return <HandleTarget ref={handleRef} />
    }

    const view = await render(
      <StrictMode>
        <HandleProvider>
          <View />
        </HandleProvider>
      </StrictMode>,
    )

    expect(renderedRef).not.toBe(originalRef)
    expect(originalRef.current?.ping()).toBe('pong')
    expect(renderedRef?.current?.ping()).toBe('pong')

    await view.unmount()
    expect(originalRef.current).toBeNull()
    expect(renderedRef?.current).toBeNull()
  })
})
