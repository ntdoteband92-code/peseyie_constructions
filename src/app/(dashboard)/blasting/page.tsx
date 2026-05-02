import type { Metadata } from 'next'
import { getBlastLogs, getBlastSummary } from '@/app/actions/blast-logs'
import { getProjects } from '@/app/actions/projects'
import BlastLogsClient from '@/components/blast-logs/BlastLogsClient'

export const metadata: Metadata = { title: 'Blasting Operations' }

export default async function BlastingPage() {
  const [blastLogs, blastSummary, projects] = await Promise.all([
    getBlastLogs().catch(() => []),
    getBlastSummary().catch(() => []),
    getProjects().catch(() => []),
  ])

  const projectOptions = projects.map((p: any) => ({
    id: p.id,
    project_name: p.project_name,
  }))

  return (
    <BlastLogsClient
      blastLogs={blastLogs}
      blastSummary={blastSummary}
      projects={projectOptions}
    />
  )
}