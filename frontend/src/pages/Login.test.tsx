import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/AuthContext'
import Login from '@/pages/Login'

/* The Supabase client is mocked, but everything above it — api.ts and
 * AuthContext — is the real thing, so these tests cover the whole OTP flow. */
const supa = vi.hoisted(() => ({
  signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
  verifyOtp: vi
    .fn()
    .mockResolvedValue({ data: { session: { access_token: 'token' } }, error: null }),
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
      signInWithOtp: supa.signInWithOtp,
      verifyOtp: supa.verifyOtp,
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

describe('Login (email OTP)', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    vi.clearAllMocks()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('asks for an email, emails a code, then verifies it', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </MemoryRouter>,
      )
    })

    const submit = () =>
      container
        .querySelector('form')
        ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    // Step one: email only — no password field, and no submit until typed.
    const email = container.querySelector<HTMLInputElement>('#email')
    expect(email).not.toBeNull()
    expect(container.querySelector('#password')).toBeNull()
    expect(
      container.querySelector('button[type="submit"]')?.hasAttribute('disabled'),
    ).toBe(true)

    await act(async () => {
      fill(email!, 'ravi@example.com')
    })

    expect(
      container.querySelector('button[type="submit"]')?.hasAttribute('disabled'),
    ).toBe(false)

    await act(async () => {
      submit()
      await flush()
    })

    expect(supa.signInWithOtp).toHaveBeenCalledWith({
      email: 'ravi@example.com',
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      },
    })

    // Step two: the code box replaces the email box.
    const token = container.querySelector<HTMLInputElement>('#token')
    expect(token, 'code step should be shown').not.toBeNull()
    expect(container.textContent).toContain('ravi@example.com')

    await act(async () => {
      fill(token!, '123456')
    })

    await act(async () => {
      submit()
      await flush()
    })

    expect(supa.verifyOtp).toHaveBeenCalledWith({
      email: 'ravi@example.com',
      token: '123456',
      type: 'email',
    })
  })

  it('links to the terms and privacy pages', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </MemoryRouter>,
      )
    })

    expect(container.querySelector('a[href="/terms"]')).not.toBeNull()
    expect(container.querySelector('a[href="/privacy"]')).not.toBeNull()
  })
})
