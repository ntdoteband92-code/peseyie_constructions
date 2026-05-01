import type { Metadata } from 'next'
import ModulePlaceholder from '@/components/layout/ModulePlaceholder'
import { FolderOpen } from 'lucide-react'

export const metadata: Metadata = { title: 'Documents' }

export default function DocumentsPage() {
  return (
    <ModulePlaceholder
      icon={FolderOpen}
      title="Documents"
      description="Central document store with categories, expiry tracking, version history, and license expiry dashboard."
      phase={6}
      features={['Upload with project link, category, expiry date', 'PDF/image preview in browser', 'Version history for updated documents', 'License expiry dashboard (red/amber/green)', 'Search by project, category, keyword', 'Download and print support']}
    />
  )
}
