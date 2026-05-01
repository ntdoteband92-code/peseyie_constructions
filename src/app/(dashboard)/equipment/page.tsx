import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEquipment, getVehicles, getProjectsForSelection } from '@/app/actions/equipment'
import EquipmentClient from '@/components/equipment/EquipmentClient'

export const metadata: Metadata = { title: 'Equipment & Fleet' }

export default async function EquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [equipment, vehicles, projects] = await Promise.all([
    getEquipment().catch(() => []),
    getVehicles().catch(() => []),
    getProjectsForSelection().catch(() => []),
  ])

  return (
    <EquipmentClient
      equipment={equipment}
      vehicles={vehicles}
      projects={projects}
    />
  )
}