import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getExpenses, getIncomeEntries } from '@/app/actions/expenses'
import { getProjects } from '@/app/actions/projects'
import FinancialsClient from '@/components/financials/FinancialsClient'

export const metadata: Metadata = { title: 'Financials' }

export default async function FinancialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [expenses, income, projectsData] = await Promise.all([
    getExpenses().catch(() => []),
    getIncomeEntries().catch(() => []),
    getProjects().catch(() => []),
  ])

  const projects = projectsData.map(p => ({ id: p.id, project_name: p.project_name }))

  return (
    <FinancialsClient
      expenses={expenses}
      income={income}
      projects={projects}
    />
  )
}