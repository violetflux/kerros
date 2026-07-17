import type { ReactElement } from 'react'
import * as React from 'react'
import * as LegacyReactDOM from 'react-dom'
import { act as domAct } from 'react-dom/test-utils'
import { afterEach } from 'vitest'

interface RootHandle {
  /** Render into the mounted root */
  render: (node: ReactElement) => void
  /** Unmount the mounted root */
  unmount: () => void
}

interface LegacyRenderer {
  /** Render through the React 17 DOM API */
  render: (node: ReactElement, container: Element) => void
  /** Unmount through the React 17 DOM API */
  unmountComponentAtNode: (container: Element) => void
}

interface ClientRenderer {
  /** Create a React 18 or React 19 DOM root */
  createRoot: (container: Element) => RootHandle
}

interface MountedView {
  /** DOM container used by the render */
  container: HTMLDivElement
  /** Render the next element into the same root */
  rerender: (node: ReactElement) => Promise<void>
  /** Unmount and remove the DOM container */
  unmount: () => Promise<void>
}

type Act = (callback: () => void | Promise<void>) => Promise<void>

export const act = ((React as typeof React & { act?: Act }).act
  ?? domAct) as Act

const mountedViews = new Set<MountedView>()

/**
 * Render with the DOM API available in the active React compatibility job
 */
export async function render(node: ReactElement): Promise<MountedView> {
  const container = document.createElement('div')
  document.body.append(container)

  let root: RootHandle | undefined
  const legacy = LegacyReactDOM as unknown as LegacyRenderer

  if (React.version.startsWith('17.')) {
    await act(() => legacy.render(node, container))
  }
  else {
    const clientPath = 'react-dom/client'
    const { createRoot } = await import(/* @vite-ignore */ clientPath) as ClientRenderer
    root = createRoot(container)
    await act(() => root!.render(node))
  }

  const view: MountedView = {
    container,
    rerender: async nextNode => {
      await act(() => {
        if (root)
          root.render(nextNode)
        else
          legacy.render(nextNode, container)
      })
    },
    unmount: async () => {
      await act(() => {
        if (root)
          root.unmount()
        else
          legacy.unmountComponentAtNode(container)
      })
      container.remove()
      mountedViews.delete(view)
    },
  }

  mountedViews.add(view)
  return view
}

afterEach(async () => {
  for (const view of [...mountedViews])
    await view.unmount()
})
