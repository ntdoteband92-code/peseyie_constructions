import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Browser-side Supabase client.
 * Uses createBrowserClient from @supabase/ssr so it reads/writes the same
 * HTTP cookies that the server-side createClient() sets. This keeps the
 * client and server session in sync — previously this used localStorage
 * with a custom key which was completely disconnected from server cookies.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}