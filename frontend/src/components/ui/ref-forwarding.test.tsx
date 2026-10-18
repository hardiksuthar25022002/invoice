import { act, createRef, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Slot } from 'radix-ui'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Button } from '@/components/ui/button'

/*
 * Radix popups (dropdown menu, alert dialog, tooltip, select…) hand their anchor
 * DOM node to their child through `asChild`. That only works if `ref` reaches
 * the child *in its props* — React 19's ref-as-prop behaviour. On React 18,
 * `ref` is pulled out of props, so the trigger's ref stays null, Radix never
 * marks the popup as positioned, and it is left at `translate(0, -200%)`:
 * off-screen. Clicking the trigger then looks like it does nothing at all.
 *
 * The generated shadcn components in src/components/ui are written for React 19
 * (no forwardRef anywhere), so these two tests pin that contract.
 */
describe('ui components accept a ref', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const render = (node: ReactNode) => act(() => root.render(node))

  it('attaches a ref passed to Button to its DOM node', () => {
    const ref = createRef<HTMLButtonElement>()

    render(<Button ref={ref}>Save</Button>)

    expect(ref.current?.tagName).toBe('BUTTON')
  })

  it('passes the ref through Radix Slot (asChild) to the DOM node', () => {
    const ref = createRef<HTMLButtonElement>()

    render(
      <Slot.Root>
        <Button ref={ref}>Save</Button>
      </Slot.Root>,
    )

    expect(ref.current?.tagName).toBe('BUTTON')
  })
})
