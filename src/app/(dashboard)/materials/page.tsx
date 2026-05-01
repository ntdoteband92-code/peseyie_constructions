import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMaterials, getMaterialInward, getExplosivesLog } from '@/app/actions/materials'
import { getProjects } from '@/app/actions/projects'
import MaterialsClient from '@/components/materials/MaterialsClient'

export const metadata: Metadata = { title: 'Materials & Inventory' }

export default async function MaterialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [materials, materialInward, explosives, projectsData] = await Promise.all([
    getMaterials().catch(() => []),
    getMaterialInward().catch(() => []),
    getExplosivesLog().catch(() => []),
    getProjects().catch(() => []),
  ])

  const projects = projectsData.map((p: any) => ({ id: p.id, project_name: p.project_name }))

  return <MaterialsClient materials={materials} materialInward={materialInward} explosives={explosives} projects={projects} />
}