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
  login: (credentials: { email: string; password: string }) => Promise<void>
  register: (data: {
    full_name: string
    email: string
    password: string
  }) => Promise<{ needsConfirmation: boolean }>
  /** Re-send the confirmation email for an unverified address. */
  resendConfirmation: (email: string) => Promise<void>
  logout: () => Promise<void>
  saveProfile: (data: Partial<Me>) => Promise<Me>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return

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

  const register = useCallback(
    async (data: { full_name: string; email: string; password: string }) => {
      const session = await api.register(data)

      await applySession(session)

      return { needsConfirmation: session === null }
    },
    [applySession],
  )

  const resendConfirmation = useCallback(async (email: string) => {
    await api.resendConfirmation(email)
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
    setUnconfirmedEmail(null)
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
      login,
      register,
      resendConfirmation,
      logout,
      saveProfile,
    }),
    [
      user,
      loading,
      unconfirmedEmail,
      login,
      register,
      resendConfirmation,
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
