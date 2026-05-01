'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AppRole } from '@/lib/supabase/types'
import { isAppRole } from '@/lib/supabase/types'

async function getMyRole(): Promise<AppRole | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_role')
  if (error || !data || !isAppRole(data)) return null
  return data
}

async function requireRole(allowedRoles: AppRole[]): Promise<AppRole> {
  const role = await getMyRole()
  if (!role || !allowedRoles.includes(role)) throw new Error('Unauthorized')
  return role
}

const BlastLogSchema = z.object({
  project_id: z.string().uuid().min(1, 'Project is required'),
  blast_date: z.string().min(1, 'Blast date is required'),
  blast_time: z.string().min(1, 'Blast time is required'),
  location: z.string().min(1, 'Location/Chainage is required'),
  blast_type: z.string().min(1, 'Blast type is required'),
  drill_depth_m: z.coerce.number().optional().nullable(),
  no_of_holes: z.coerce.number().optional().nullable(),
  spacing_m: z.coerce.number().optional().nullable(),
  burden_m: z.coerce.number().optional().nullable(),
  explosive_type: z.string().optional(),
  explosive_qty_kg: z.coerce.number().optional().nullable(),
  detonator_type: z.string().optional(),
  no_of_detonators: z.coerce.number().optional().nullable(),
  total_charge_kg: z.coerce.number().optional().nullable(),
  pattern: z.string().optional(),
  stemming: z.string().optional(),
  delay_sequence: z.string().optional(),
  ground_vibration_measured: z.coerce.boolean().optional(),
  peak_particle_velocity_mm_s: z.coerce.number().optional().nullable(),
  air_overpressure_db: z.coerce.number().optional().nullable(),
  fly_rock_incident: z.coerce.boolean().optional(),
  fly_rock_distance_m: z.coerce.number().optional().nullable(),
  noise_incident: z.coerce.boolean().optional(),
  complaints_received: z.coerce.boolean().optional(),
  weather_condition: z.string().optional(),
  temperature_c: z.coerce.number().optional().nullable(),
  result_summary: z.string().optional(),
  remarks: z.string().optional(),
  shot_firer_name: z.string().optional(),
  shot_firer_license_no: z.string().optional(),
  supervisor_on_duty: z.string().optional(),
})

export async function getBlastLogs(projectId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('blast_logs')
    .select('*, project:projects(project_name)')
    .eq('is_deleted', false)
    .order('blast_date', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createBlastLog(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = BlastLogSchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const supabase = await createClient()
    const { error } = await supabase.from('blast_logs').insert(validated.data)
    if (error) return { error: error.message }
    revalidatePath('/blast-logs')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function deleteBlastLog(id: string): Promise<any> {
  try {
    await requireRole(['admin', 'manager'])
    const supabase = await createClient()
    const { error } = await supabase
      .from('blast_logs')
      .update({ is_deleted: true })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/blast-logs')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type BlastLog = Awaited<ReturnType<typeof getBlastLogs>>[number]