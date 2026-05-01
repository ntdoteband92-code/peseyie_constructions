import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEstimations, getProjectFinancials } from '@/app/actions/estimation'
import { getProjects } from '@/app/actions/projects'
import EstimationClient from '@/components/estimation/EstimationClient'

export const metadata: Metadata = { title: 'Cost Estimation' }

export default async function EstimationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [estimations, projectsData] = await Promise.all([
    getEstimations().catch(() => []),
    getProjects().catch(() => []),
  ])

  const projects = projectsData.map((p: any) => ({ id: p.id, project_name: p.project_name }))

  const varianceData: Record<string, any> = {}
  for (const est of estimations) {
    if (est.project_id) {
      try {
        varianceData[est.id] = await getProjectFinancials(est.project_id)
      } catch {
        varianceData[est.id] = null
      }
    }
  }

  return <EstimationClient estimations={estimations} projects={projects} varianceData={varianceData} />
}