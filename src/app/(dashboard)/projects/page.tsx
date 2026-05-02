import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProjects } from '@/app/actions/projects'
import ProjectsListClient from '@/components/projects/ProjectsListClient'

export const revalidate = 0

 export const metadata: Metadata = { title: 'Projects' }

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  let projects = []
  try {
    projects = await getProjects()
  } catch (error) {
    console.error('Failed to fetch projects:', error)
  }

  return <ProjectsListClient projects={projects} />
}