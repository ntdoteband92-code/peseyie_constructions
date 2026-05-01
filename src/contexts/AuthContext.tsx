'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { AppRole } from '@/lib/supabase/types'
import { getMyProfile } from '@/app/actions/profile'

interface Profile {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  role: AppRole | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Browser client — used ONLY for auth state detection (getSession, onAuthStateChange).
  // Never used for direct table queries (those 401 because RLS blocks anon-key reads).
  const supabase = createClient()

  const loadUserData = useCallback(async () => {
    try {
      // Call a Server Action so profile/role are fetched with the service role key
      // server-side, completely bypassing RLS. This eliminates the 401 errors that
      // happen when the browser client tries to query profiles/user_roles directly.
      const result = await getMyProfile()
      if (result) {
        setProfile(result.profile)
        setRole(result.role)
      } else {
        setProfile(null)
        setRole(null)
      }
    } catch (e) {
      console.error('Error loading user data:', e)
      setProfile(null)
      setRole(null)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadUserData()
        }
      } catch (e) {
        console.error('Auth init error:', e)
      } finally {
        setIsLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadUserData()
        } else {
          setProfile(null)
          setRole(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, loadUserData])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setRole(null)
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, profile, role, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}