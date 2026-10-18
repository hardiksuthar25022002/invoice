import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { api } from '@/api'
import { supabase } from '@/supabase'
import type { Me } from '@/types'

interface AuthContextValue {
  user: Me | null
  loading: boolean
  /**
   * Set when a session exists but its address has not been confirmed. The app
   * shows the "Confirm your email" screen instead of the app shell.
   */
  unconfirmedEmail: string | null
  /**
   * Set when the visitor arrived from a "reset your password" link, which signs
   * them in with a session that may only be used to pick a new password.
   */
  passwordRecovery: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  /** Re-send the confirmation email for an unverified address. */
  resendConfirmation: (email: string) => Promise<void>
  /** Email a link that lets the visitor choose a new password. */
  requestPasswordReset: (email: string) => Promise<void>
  /** Set the password of the signed-in user, used by the recovery screen. */
  updatePassword: (password: string) => Promise<void>
  logout: () => Promise<void>
  saveProfile: (data: Partial<Me>) => Promise<Me>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Where Supabase sends the user after they click a link in an auth email.
 *
 * A project has a single "Site URL" (Authentication → URL Configuration), so
 * omitting this sends production users wherever that one value points — often
 * the localhost URL left over from setup. Passing the current origin makes each
 * environment return to itself; the origin still has to be listed under
 * "Redirect URLs" in the project, or Supabase quietly falls back to Site URL.
 */
function emailRedirectUrl() {
  return window.location.origin
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [loading, setLoading] = useState(true)

  // The signed-in "user" is the auth user merged with its profile row, so
  // pages can read me.business_name, me.pan_number, and so on.
  const loadProfile = useCallback(async () => {
    try {
      setUser(await api.me())
    } catch {
      setUser(null)
    }
  }, [])

  /**
   * Applies a session to the context.
   *
   * "Confirm email" is a Supabase project setting, not something the browser
   * can switch on — so the app refuses an unverified session itself rather than
   * trusting that the project has the setting enabled.
   */
  const applySession = useCallback(
    async (session: Session | null) => {
      if (!session) {
        setUser(null)
        setUnconfirmedEmail(null)
        return
      }

      if (!session.user.email_confirmed_at) {
        setUser(null)
        setUnconfirmedEmail(session.user.email ?? '')
        return
      }

      setUnconfirmedEmail(null)
      await loadProfile()
    },
    [loadProfile],
  )

  useEffect(() => {
    let active = true

    // onAuthStateChange fires an INITIAL_SESSION event once the stored session
    // is read, which covers the first load. Profile work is deferred so we
    // never call back into Supabase from inside the callback itself.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return

      // A reset link signs the user in with a short-lived session: hold them on
      // the "choose a new password" screen instead of opening the app shell.
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
        setUnconfirmedEmail(null)
        setLoading(false)
        return
      }

      setTimeout(async () => {
        await applySession(session)
        if (active) setLoading(false)
      }, 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [applySession])

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      await applySession(await api.login(credentials))
    },
    [applySession],
  )

  const resendConfirmation = useCallback(async (email: string) => {
    await api.resendConfirmation(email, emailRedirectUrl())
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    // Come back to the app root so supabase-js can read the recovery token in
    // the URL and hand us a session.
    await api.requestPasswordReset(email, emailRedirectUrl())
  }, [])

  const updatePassword = useCallback(
    async (password: string) => {
      await api.updatePassword(password)
      setPasswordRecovery(false)

      // The recovery session is an ordinary one from here on, so run it through
      // the same confirmation check as any other sign-in.
      await applySession(await api.session())
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
    setUnconfirmedEmail(null)
    setPasswordRecovery(false)
  }, [])

  const saveProfile = useCallback(async (data: Partial<Me>) => {
    const updated = await api.updateProfile(data)
    setUser(updated)
    return updated
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      unconfirmedEmail,
      passwordRecovery,
      login,
      resendConfirmation,
      requestPasswordReset,
      updatePassword,
      logout,
      saveProfile,
    }),
    [
      user,
      loading,
      unconfirmedEmail,
      passwordRecovery,
      login,
      resendConfirmation,
      requestPasswordReset,
      updatePassword,
      logout,
      saveProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')

  return ctx
}
