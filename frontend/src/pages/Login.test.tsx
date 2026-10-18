import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/AuthContext'
import Login from '@/pages/Login'

/* The Supabase client is mocked, but api.ts and AuthContext are the real thing,
 * so these tests cover the whole sign-in and password-reset path. */
const supa = vi.hoisted(() => ({
  session: {
    data: {
      session: {
        access_token: 'token',
        user: {
          id: 'user-1',
          email: 'ravi@example.com',
          email_confirmed_at: '2026-01-01T00:00:00Z',
        },
      },
    },
    error: null,
  },
  unconfirmed: {
    data: {
      session: {
        access_token: 'token',
        user: { id: 'user-1', email: 'ravi@example.com' },
      },
    },
    error: null,
  },
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: () => {} } },
  })),
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  from: vi.fn(),
}))

vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: supa.signInWithPassword,
      resetPasswordForEmail: supa.resetPasswordForEmail,
      onAuthStateChange: supa.onAuthStateChange,
      getUser: supa.getUser,
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

describe('Login (email + password)', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    vi.clearAllMocks()
    supa.signInWithPassword.mockResolvedValue(supa.session)
    supa.resetPasswordForEmail.mockResolvedValue({ error: null })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const renderLogin = async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </MemoryRouter>,
      )
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

  it('signs in with email and password', async () => {
    await renderLogin()

    expect(field('#email')).not.toBeNull()
    expect(field('#password')).not.toBeNull()

    await act(async () => {
      fill(field('#email')!, 'ravi@example.com')
      fill(field('#password')!, 'hunter2hunter2')
    })

    await act(async () => {
      submit()
      await flush()
    })

    expect(supa.signInWithPassword).toHaveBeenCalledWith({
      email: 'ravi@example.com',
      password: 'hunter2hunter2',
    })
  })

  it('offers no way to sign up', async () => {
    await renderLogin()

    // Sign-ups are closed in the project, so the app must not dangle a form
    // that Supabase would reject.
    expect(field('#full_name')).toBeNull()
    expect(container.textContent).not.toContain('Create one')
    expect(container.textContent).toContain(
      'Accounts are created by the workspace owner',
    )
  })

  it('shows and hides the password', async () => {
    await renderLogin()

    expect(field('#password')?.type).toBe('password')

    await act(async () => {
      clickButton('Show password')
    })

    expect(field('#password')?.type).toBe('text')

    await act(async () => {
      clickButton('Hide password')
    })

    expect(field('#password')?.type).toBe('password')
  })

  it('links to the terms and privacy pages', async () => {
    await renderLogin()

    expect(container.querySelector('a[href="/terms"]')).not.toBeNull()
    expect(container.querySelector('a[href="/privacy"]')).not.toBeNull()
  })

  it('keeps an unconfirmed session out of the app', async () => {
    supa.signInWithPassword.mockResolvedValue(supa.unconfirmed)
    await renderLogin()

    await act(async () => {
      fill(field('#email')!, 'ravi@example.com')
      fill(field('#password')!, 'hunter2hunter2')
    })

    await act(async () => {
      submit()
      await flush()
    })

    // Nowhere to go: no profile is loaded, so App would render ConfirmEmail.
    expect(supa.getUser).not.toHaveBeenCalled()
  })

  it('emails a reset link from the forgot-password screen', async () => {
    await renderLogin()

    await act(async () => {
      clickButton('Forgot password?')
    })

    // Only the address: there is no password to type when you've lost it.
    expect(field('#email')).not.toBeNull()
    expect(field('#password')).toBeNull()

    await act(async () => {
      fill(field('#email')!, 'ravi@example.com')
    })

    await act(async () => {
      submit()
      await flush()
    })

    expect(supa.resetPasswordForEmail).toHaveBeenCalledWith(
      'ravi@example.com',
      { redirectTo: window.location.origin },
    )
    expect(container.textContent).toContain('Check your inbox')
    expect(container.textContent).toContain('ravi@example.com')

    await act(async () => {
      clickButton('Resend reset link')
      await flush()
    })

    expect(supa.resetPasswordForEmail).toHaveBeenCalledTimes(2)
  })

  it('explains the Supabase email limit instead of the raw 429', async () => {
    supa.resetPasswordForEmail.mockResolvedValue({
      error: { status: 429, message: 'Email rate limit exceeded' },
    })
    await renderLogin()

    await act(async () => {
      clickButton('Forgot password?')
    })

    await act(async () => {
      fill(field('#email')!, 'ravi@example.com')
    })

    await act(async () => {
      submit()
      await flush()
    })

    expect(container.textContent).toContain('custom SMTP')
    expect(container.textContent).not.toContain('rate limit exceeded')
  })
})
