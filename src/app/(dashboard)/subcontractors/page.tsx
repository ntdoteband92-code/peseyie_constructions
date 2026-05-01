import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubcontractors, getWorkOrders } from '@/app/actions/subcontractors'
import { getProjects } from '@/app/actions/projects'
import SubcontractorsClient from '@/components/subcontractors/SubcontractorsClient'

export const metadata: Metadata = { title: 'Subcontractors' }

export default async function SubcontractorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [subcontractors, workOrders, projectsData] = await Promise.all([
    getSubcontractors().catch(() => []),
    getWorkOrders().catch(() => []),
    getProjects().catch(() => []),
  ])

  const projects = projectsData.map((p: any) => ({ id: p.id, project_name: p.project_name }))

  return <SubcontractorsClient subcontractors={subcontractors} workOrders={workOrders} projects={projects} />
}