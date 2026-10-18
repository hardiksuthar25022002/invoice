import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import ThemeSwitch from '@/components/theme-switch'
import { ThemeProvider } from '@/context/theme-context'

/* jsdom is missing a few browser APIs that Radix and floating-ui touch while
 * opening a popup. Without these the test fails for the wrong reason. */
function installDomPolyfills() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia

  Element.prototype.scrollIntoView = () => {}
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}

/*
 * Regression test for "some buttons are not clickable".
 *
 * Radix hands the trigger's DOM node to the child through `asChild`, which
 * needs `ref` to arrive in props (React 19 ref-as-prop). Without that node,
 * floating-ui is never asked to position the popup and @radix-ui/react-popper
 * keeps it at `transform: translate(0, -200%)` — rendered above the top of the
 * viewport, so the menu exists in the DOM but is invisible: the trigger looks
 * dead even though its click handler ran.
 */
describe('ThemeSwitch', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeAll(installDomPolyfills)

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

  it('opens its menu on click and anchors it on screen', async () => {
    await act(async () => {
      root.render(
        <ThemeProvider>
          <ThemeSwitch />
        </ThemeProvider>,
      )
    })

    const trigger = container.querySelector('button')
    expect(trigger).not.toBeNull()
    expect(trigger?.getAttribute('aria-expanded')).toBe('false')

    await act(async () => {
      trigger?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      )
      // Let floating-ui's promise settle.
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(trigger?.getAttribute('aria-expanded')).toBe('true')

    const content = document.querySelector('[data-slot="dropdown-menu-content"]')
    expect(content, 'menu content should be rendered').not.toBeNull()
    expect(content?.textContent).toContain('Dark')

    const wrapper = content?.parentElement as HTMLElement | null
    expect(
      wrapper?.style.transform,
      'popup must not be left at the off-screen placeholder',
    ).not.toContain('-200%')
  })
})
