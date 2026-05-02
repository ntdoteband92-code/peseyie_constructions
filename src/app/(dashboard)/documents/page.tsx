import type { Metadata } from 'next'
import { getDocuments } from '@/app/actions/documents'
import { getProjects } from '@/app/actions/projects'
import DocumentsClient from '@/components/documents/DocumentsClient'

export const metadata: Metadata = { title: 'Documents' }

export default async function DocumentsPage() {
  const [documents, projects] = await Promise.all([
    getDocuments().catch(() => []),
    getProjects().catch(() => []),
  ])

  const projectOptions = projects.map((p: any) => ({
    id: p.id,
    project_name: p.project_name,
  }))

  return <DocumentsClient documents={documents} projects={projectOptions} />
}