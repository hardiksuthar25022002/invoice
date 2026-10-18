import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/AuthContext'
import Login from '@/pages/Login'

/* The Supabase client is mocked, but api.ts and AuthContext are the real
 * thing, so these tests cover the whole sign-in / sign-up path. */
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
  noSession: { data: { session: null }, error: null },
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  resend: vi.fn().mockResolvedValue({ error: null }),
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
      signUp: supa.signUp,
      signInWithPassword: supa.signInWithPassword,
      resend: supa.resend,
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
    supa.signUp.mockResolvedValue(supa.session)
    supa.signInWithPassword.mockResolvedValue(supa.session)
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

    // Sign-in mode by default: no full name field.
    expect(field('#email')).not.toBeNull()
    expect(field('#password')).not.toBeNull()
    expect(field('#full_name')).toBeNull()

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
    expect(supa.signUp).not.toHaveBeenCalled()
  })

  it('creates an account with a full name', async () => {
    await renderLogin()

    await act(async () => {
      clickButton('Create one')
    })

    const fullName = field('#full_name')
    expect(fullName, 'sign-up asks for a name').not.toBeNull()

    await act(async () => {
      fill(fullName!, 'Ravi Kumar')
      fill(field('#email')!, 'ravi@example.com')
      fill(field('#password')!, 'hunter2hunter2')
    })

    await act(async () => {
      submit()
      await flush()
    })

    expect(supa.signUp).toHaveBeenCalledWith({
      email: 'ravi@example.com',
      password: 'hunter2hunter2',
      options: { data: { full_name: 'Ravi Kumar' } },
    })
    expect(supa.signInWithPassword).not.toHaveBeenCalled()
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

  it('asks for confirmation when sign-up requires a verified email', async () => {
    supa.signUp.mockResolvedValue(supa.noSession)
    await renderLogin()

    await act(async () => {
      clickButton('Create one')
    })

    await act(async () => {
      fill(field('#full_name')!, 'Ravi Kumar')
      fill(field('#email')!, 'ravi@example.com')
      fill(field('#password')!, 'hunter2hunter2')
    })

    await act(async () => {
      submit()
      await flush()
    })

    expect(container.textContent).toContain('Confirm your email')
    expect(container.textContent).toContain('ravi@example.com')

    await act(async () => {
      clickButton('Resend confirmation email')
      await flush()
    })

    expect(supa.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'ravi@example.com',
    })
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
})
