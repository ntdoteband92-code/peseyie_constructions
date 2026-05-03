'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AppRole } from '@/lib/supabase/types'
import { isAppRole } from '@/lib/supabase/types'

async function getMyRole(): Promise<AppRole | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single() as any

    if (error || !data) return null
    if (!isAppRole(data.role)) return null
    return data.role
  } catch {
    return null
  }
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
  location_chainage: z.string().min(1, 'Location/Chainage is required'),
  rock_type: z.string().min(1, 'Rock type is required'),
  bench_height_m: z.coerce.number().optional().nullable(),
  hole_depth_m: z.coerce.number().optional().nullable(),
  holes_drilled: z.coerce.number().optional().nullable(),
  hole_diameter_mm: z.coerce.number().optional().nullable(),
  burden_m: z.coerce.number().optional().nullable(),
  spacing_m: z.coerce.number().optional().nullable(),
  explosive_type: z.string().optional(),
  total_explosive_kg: z.coerce.number().optional().nullable(),
  detonators_count: z.coerce.number().optional().nullable(),
  detonator_type: z.string().optional(),
  initiation_system: z.string().optional(),
  misfires_count: z.coerce.number().optional().nullable(),
  misfire_action: z.string().optional(),
  result: z.string().optional(),
  volume_blasted_cum: z.coerce.number().optional().nullable(),
  safety_officer: z.string().optional(),
  clearance_confirmed: z.coerce.boolean().optional(),
  authority_intimation_ref: z.string().optional(),
  remarks: z.string().optional(),
})

export async function getBlastLogs(projectId?: string) {
  const supabase = await createAdminClient()
  let query = supabase
    .from('blasting_shots')
    .select('*, project:projects(project_name)')
    .eq('is_deleted', false)
    .order('blast_date', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any
}

export async function getBlastSummary(projectId?: string) {
  const supabase = await createAdminClient()
  let query = supabase
    .from('blasting_shots')
    .select(`
      project_id,
      project:projects(project_name),
      blast_date,
      total_explosive_kg,
      misfires_count,
      volume_blasted_cum,
      holes_drilled
    `)
    .eq('is_deleted', false)

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query as any
  if (error) throw error

  const logs = data ?? []

  const summaryByProject: Record<string, {
    project_name: string
    total_shots: number
    total_explosive_kg: number
    total_charge_kg: number
    total_misfires: number
    total_volume_cum: number
    last_blast_date: string | null
  }> = {}

  for (const log of logs) {
    const pid = log.project_id
    if (!summaryByProject[pid]) {
      summaryByProject[pid] = {
        project_name: log.project?.project_name ?? 'Unknown',
        total_shots: 0,
        total_explosive_kg: 0,
        total_charge_kg: 0,
        total_misfires: 0,
        total_volume_cum: 0,
        last_blast_date: null,
      }
    }
    summaryByProject[pid].total_shots += 1
    summaryByProject[pid].total_explosive_kg += Number(log.total_explosive_kg ?? 0)
    summaryByProject[pid].total_charge_kg += Number(log.total_explosive_kg ?? 0)
    summaryByProject[pid].total_misfires += Number(log.misfires_count ?? 0)
    summaryByProject[pid].total_volume_cum += Number(log.volume_blasted_cum ?? 0)
    if (!summaryByProject[pid].last_blast_date || log.blast_date > summaryByProject[pid].last_blast_date) {
      summaryByProject[pid].last_blast_date = log.blast_date
    }
  }

  return Object.entries(summaryByProject).map(([project_id, s]) => ({ project_id, ...s }))
}

export async function createBlastLog(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = BlastLogSchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('blasting_shots').insert(validated.data as any)
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
    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('blasting_shots') as any).update({ is_deleted: true }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/blast-logs')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type BlastLog = Awaited<ReturnType<typeof getBlastLogs>>[number]