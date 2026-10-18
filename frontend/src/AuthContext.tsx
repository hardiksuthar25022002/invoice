import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { api } from '@/api'
import { supabase } from '@/supabase'
import type { Me } from '@/types'

interface AuthContextValue {
  user: Me | null
  loading: boolean
  /** Email a one-time code to the address. */
  sendLoginCode: (email: string) => Promise<void>
  /** Exchange that code for a session. */
  verifyLoginCode: (email: string, token: string) => Promise<void>
  logout: () => Promise<void>
  saveProfile: (data: Partial<Me>) => Promise<Me>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
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

  useEffect(() => {
    let active = true

    // onAuthStateChange fires an INITIAL_SESSION event once the stored session
    // is read, which covers the first load. Profile work is deferred so we
    // never call back into Supabase from inside the callback itself.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return

      if (!session) {
        setUser(null)
        setLoading(false)
        return
      }

      setTimeout(async () => {
        await loadProfile()
        if (active) setLoading(false)
      }, 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const sendLoginCode = useCallback(async (email: string) => {
    await api.sendLoginCode(email)
  }, [])

  const verifyLoginCode = useCallback(
    async (email: string, token: string) => {
      await api.verifyLoginCode(email, token)
      await loadProfile()
    },
    [loadProfile],
  )

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const saveProfile = useCallback(async (data: Partial<Me>) => {
    const updated = await api.updateProfile(data)
    setUser(updated)
    return updated
  }, [])

  const value = useMemo(
    () => ({ user, loading, sendLoginCode, verifyLoginCode, logout, saveProfile }),
    [user, loading, sendLoginCode, verifyLoginCode, logout, saveProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')

  return ctx
}
