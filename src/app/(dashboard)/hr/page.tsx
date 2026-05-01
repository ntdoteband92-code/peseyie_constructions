import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEmployees, getOutstandingAdvances } from '@/app/actions/hr'
import { getProjects } from '@/app/actions/projects'
import HRClient from '@/components/hr/HRClient'

export const metadata: Metadata = { title: 'HR & Payroll' }

export default async function HRPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [employees, advances, projectsData] = await Promise.all([
    getEmployees().catch(() => []),
    getOutstandingAdvances().catch(() => []),
    getProjects().catch(() => []),
  ])

  const projects = projectsData.map((p: any) => ({ id: p.id, project_name: p.project_name }))

  return <HRClient employees={employees} projects={projects} advances={advances} />
}