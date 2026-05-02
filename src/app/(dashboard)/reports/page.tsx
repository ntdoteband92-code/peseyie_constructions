import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getReportSummary } from '@/app/actions/reports'
import ReportsClient from '@/components/reports/ReportsClient'

export const metadata: Metadata = { title: 'Reports & Analytics' }

export const revalidate = 0

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const data = await getReportSummary().catch(() => null)
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Failed to load report data.</p>
      </div>
    )
  }

  return <ReportsClient data={data} />
}