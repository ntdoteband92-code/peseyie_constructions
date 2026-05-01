import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenders } from '@/app/actions/tenders'
import TendersListClient from '@/components/tenders/TendersListClient'

export const metadata: Metadata = { title: 'Tenders' }

export default async function TendersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const tenders = await getTenders().catch(() => [])

  return <TendersListClient tenders={tenders} />
}