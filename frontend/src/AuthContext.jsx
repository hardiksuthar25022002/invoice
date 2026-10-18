import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api } from './api.js'
import { supabase } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
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

  const login = useCallback(
    async (credentials) => {
      await api.login(credentials)
      await loadProfile()
    },
    [loadProfile],
  )

  const register = useCallback(
    async (data) => {
      await api.register(data)
      await loadProfile()
    },
    [loadProfile],
  )

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const saveProfile = useCallback(async (data) => {
    const updated = await api.updateProfile(data)
    setUser(updated)
    return updated
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, saveProfile }),
    [user, loading, login, register, logout, saveProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')

  return ctx
}
