import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBlastLogs } from '@/app/actions/blast-logs'
import { getProjects } from '@/app/actions/projects'
import BlastLogsClient from '@/components/blast-logs/BlastLogsClient'

export const metadata: Metadata = { title: 'Blast Logs' }

export default async function BlastLogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [blastLogs, projectsData] = await Promise.all([
    getBlastLogs().catch(() => []),
    getProjects().catch(() => []),
  ])

  const projects = projectsData.map((p: any) => ({ id: p.id, project_name: p.project_name }))

  return <BlastLogsClient blastLogs={blastLogs} projects={projects} />
}