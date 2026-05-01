import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Server-side Supabase client using the SERVICE ROLE KEY.
 *
 * Why service role (not anon key)?
 *  - With the anon key, every DB query is subject to RLS and requires a valid
 *    user session JWT in the cookie. If cookies aren't perfectly forwarded in
 *    a Server Action context, auth.getUser() returns null and all queries fail
 *    with 401 / empty results.
 *  - With the service role key, DB queries bypass RLS (safe on the server —
 *    we're in a trusted environment). auth.getUser() still validates the
 *    user's JWT from the cookie to confirm identity.
 *  - All mutation actions already enforce RBAC manually via requireRole(),
 *    so skipping RLS at the DB level does not reduce security.
 *
 * NEVER import or use this client in 'use client' files.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
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