import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDiaryEntries, getDocuments, getExpiringDocuments } from '@/app/actions/diary'
import { getProjects } from '@/app/actions/projects'
import CombinedClient from '@/components/diary/DiaryClient'

export const metadata: Metadata = { title: 'Site Diary & Documents' }

export default async function DiaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [diaryEntries, documents, expiringDocs, projectsData] = await Promise.all([
    getDiaryEntries().catch(() => []),
    getDocuments().catch(() => []),
    getExpiringDocuments(60).catch(() => []),
    getProjects().catch(() => []),
  ])

  const projects = projectsData.map((p: any) => ({ id: p.id, project_name: p.project_name }))

  return <CombinedClient diaryEntries={diaryEntries} documents={documents} expiringDocs={expiringDocs} projects={projects} />
}