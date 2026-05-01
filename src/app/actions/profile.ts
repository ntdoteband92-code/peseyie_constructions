'use server'

import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/lib/supabase/types'

interface Profile {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
}

interface MyProfileResult {
  id: string
  email: string
  profile: Profile | null
  role: AppRole | null
}

/**
 * Server Action: fetches the authenticated user's profile and role.
 * Uses the service role client so it bypasses RLS — safe on the server.
 * Called from AuthContext instead of making direct browser REST API calls
 * (which fail 401 when RLS is enabled and the anon key has no session).
 */
export async function getMyProfile(): Promise<MyProfileResult | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const [profileResult, roleResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_roles').select('role').eq('user_id', user.id).single(),
    ])

    return {
      id: user.id,
      email: user.email ?? '',
      profile: profileResult.data ?? null,
      role: (roleResult.data?.role as AppRole) ?? null,
    }
  } catch (err) {
    console.error('getMyProfile error:', err)
    return null
  }
}
