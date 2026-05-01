import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProject, getMyRole } from '@/app/actions/projects'
import ProjectForm from '@/components/projects/ProjectForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const project = await getProject(id).catch(() => null)
  return { title: project ? `Edit: ${project.project_name}` : 'Edit Project' }
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const role = await getMyRole()
  if (!role || !['admin', 'manager', 'accountant'].includes(role)) {
    redirect(`/projects/${id}`)
  }

  const project = await getProject(id).catch(() => null)
  if (!project) notFound()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-sm text-gray-500">{project.project_name}</p>
        </div>
      </div>
      <ProjectForm project={project} isEdit />
    </div>
  )
}