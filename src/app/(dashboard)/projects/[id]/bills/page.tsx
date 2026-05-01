import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/app/actions/projects'
import { getRaBills } from '@/app/actions/ra-bills'
import RaBillsListClient from '@/components/ra-bills/RaBillsListClient'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'RA Bills' }

export default async function ProjectBillsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [project, bills] = await Promise.all([
    getProject(id).catch(() => null),
    getRaBills(id).catch(() => []),
  ])

  if (!project) notFound()

  return (
    <RaBillsListClient
      bills={bills}
      projectId={id}
      projectName={project.project_name}
    />
  )
}