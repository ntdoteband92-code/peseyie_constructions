'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { AppRole } from '@/lib/supabase/types'

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
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  signOut: async () => { },
  refreshAuth: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const loadUserData = useCallback(
    async (userId: string) => {
      const [profileResult, roleResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId).single(),
      ])
      setProfile(profileResult.data ?? null)
      setRole((roleResult.data?.role as AppRole) ?? null)
    },
    [supabase]
  )

  const refreshAuth = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      await loadUserData(user.id)
    } else {
      setProfile(null)
      setRole(null)
    }
  }, [supabase, loadUserData])

  useEffect(() => {
    // Initial load
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) await loadUserData(user.id)
      setIsLoading(false)
    }
    init()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadUserData(session.user.id)
      } else {
        setProfile(null)
        setRole(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, loadUserData])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setRole(null)
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, profile, role, isLoading, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
