import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: 'sb-osyndmombqnaerbkexyq-auth',
        storage: {
          getItem: (key) => {
            if (typeof window === 'undefined') return null
            return localStorage.getItem(key)
          },
          setItem: (key, value) => {
            if (typeof window === 'undefined') return
            localStorage.setItem(key, value)
          },
          removeItem: (key) => {
            if (typeof window === 'undefined') return
            localStorage.removeItem(key)
          },
        },
      },
    }
  )
}