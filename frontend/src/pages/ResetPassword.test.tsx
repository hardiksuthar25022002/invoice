import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider, useAuth } from '@/AuthContext'
import ResetPassword from '@/pages/ResetPassword'

/* The Supabase client is mocked, but api.ts and AuthContext are the real thing,
 * so these tests cover the whole recovery path. */
const supa = vi.hoisted(() => ({
  session: {
    access_token: 'token',
    user: {
      id: 'user-1',
      email: 'ravi@example.com',
      email_confirmed_at: '2026-01-01T00:00:00Z',
    },
  },
  updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  getSession: vi.fn(),
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  onAuthStateChange: vi.fn(
    (_callback: (event: string, session: unknown) => void) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  ),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  from: vi.fn(),
}))

vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      updateUser: supa.updateUser,
      getSession: supa.getSession,
      getUser: supa.getUser,
      onAuthStateChange: supa.onAuthStateChange,
      signOut: supa.signOut,
    },
    from: supa.from,
  },
}))

/** React tracks controlled inputs through the native value setter. */
function fill(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set

  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

/** Reports what the app would decide to show, the way App.tsx does. */
function RecoveryProbe() {
  const { passwordRecovery } = useAuth()

  return <span>{passwordRecovery ? 'recovering' : 'idle'}</span>
}

describe('ResetPassword (recovery link)', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    vi.clearAllMocks()
    supa.getSession.mockResolvedValue({
      data: { session: supa.session },
      error: null,
    })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const render = async (node = <ResetPassword />) => {
    await act(async () => {
      root.render(<AuthProvider>{node}</AuthProvider>)
    })
  }

  const submit = () =>
    container
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

  const clickButton = (label: string) => {
    const button = [...container.querySelectorAll('button')].find(
      (candidate) =>
        candidate.textContent?.trim() === label ||
        candidate.getAttribute('aria-label') === label,
    )
    expect(button, `expected a "${label}" button`).not.toBeNull()
    button?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    )
  }

  const field = (selector: string) =>
    container.querySelector<HTMLInputElement>(selector)

  it('refuses two passwords that differ', async () => {
    await render()

    await act(async () => {
      fill(field('#new_password')!, 'newpassword1')
      fill(field('#confirm_password')!, 'newpassword2')
    })

    await act(async () => {
      submit()
      await flush()
    })

    expect(container.textContent).toContain("don't match")
    expect(supa.updateUser).not.toHaveBeenCalled()
  })

  it('saves the new password and carries on signed in', async () => {
    await render()

    await act(async () => {
      fill(field('#new_password')!, 'newpassword1')
      fill(field('#confirm_password')!, 'newpassword1')
    })

    await act(async () => {
      submit()
      await flush()
    })

    expect(supa.updateUser).toHaveBeenCalledWith({ password: 'newpassword1' })
    // The recovery session is re-checked and the profile loaded, exactly like a
    // normal sign-in, so App swaps this screen for the shell.
    expect(supa.getSession).toHaveBeenCalled()
    expect(supa.getUser).toHaveBeenCalled()
  })

  it('shows and hides the password', async () => {
    await render()

    expect(field('#new_password')?.type).toBe('password')

    await act(async () => {
      clickButton('Show password')
    })

    expect(field('#new_password')?.type).toBe('text')
    expect(field('#confirm_password')?.type).toBe('text')
  })

  it('switches the app into recovery mode when the link lands', async () => {
    await render(<RecoveryProbe />)

    expect(container.textContent).toBe('idle')

    const onChange = supa.onAuthStateChange.mock.calls[0][0]

    await act(async () => {
      onChange('PASSWORD_RECOVERY', supa.session)
    })

    expect(container.textContent).toBe('recovering')
  })
})
