import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Server-side Supabase client using the ANON KEY.
 * This is used for all Server Components and Server Actions that need
 * to act on behalf of the user (enforces RLS and auth.getUser() works properly).
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Can fail from Server Components during SSR — middleware handles it
          }
        },
      },
    }
  )
}

/**
 * Auth-specific client using the ANON KEY — use ONLY in auth.ts (signIn/signOut).
 *
 * WHY: signInWithPassword must use the anon key so that Supabase SSR properly
 * stores the user session in cookies that the browser client can read. Using
 * the service role key for sign-in breaks client-side session detection.
 */
export async function createAuthClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Can fail from Server Components during SSR
          }
        },
      },
    }
  )
}

/**
 * Admin client without cookie context — for background jobs, cron routes,
 * invite flows, and any server code that doesn't need user identity.
 */
export async function createAdminClient() {
  const { createClient: createSupabase } = await import('@supabase/supabase-js')
  return createSupabase<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}