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

const EquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  equipment_type: z.string().min(1, 'Type is required'),
  make: z.string().optional(),
  model: z.string().optional(),
  registration_number: z.string().optional(),
  ownership: z.enum(['company_owned', 'hired']).default('company_owned'),
  status: z.enum(['active', 'under_maintenance', 'idle', 'hired_out', 'decommissioned']).default('active'),
  hire_vendor_name: z.string().optional(),
  hire_vendor_contact: z.string().optional(),
  hire_rate: z.coerce.number().optional().nullable(),
  hire_rate_unit: z.string().optional(),
  purchase_cost: z.coerce.number().optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  year_of_manufacture: z.string().optional(),
  assigned_project_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
})

const VehicleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  vehicle_type: z.string().min(1, 'Type is required'),
  registration_number: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  ownership: z.enum(['company_owned', 'hired']).default('company_owned'),
  status: z.enum(['active', 'under_maintenance', 'idle', 'hired_out', 'decommissioned']).default('active'),
  hire_vendor_name: z.string().optional(),
  hire_rate: z.coerce.number().optional().nullable(),
  hire_rate_unit: z.string().optional(),
  fitness_certificate_expiry: z.string().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  permit_expiry: z.string().optional().nullable(),
  assigned_project_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
})

export type EquipmentFormState = { success?: boolean; error?: string; errors?: Record<string, string[]> } | null

export async function getEquipment() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('equipment')
    .select('*, project:projects!equipment_assigned_project_id_fkey(id, project_name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as any
}

export async function getVehicles() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, project:projects!vehicles_assigned_project_id_fkey(id, project_name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as any
}

export async function getProjectsForSelection() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, project_name')
    .eq('is_deleted', false)
    .order('project_name')

  if (error) throw error
  return (data ?? []) as any
}

export async function createEquipment(_prevState: EquipmentFormState, formData: FormData): Promise<EquipmentFormState> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = EquipmentSchema.safeParse(rawData)

    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()

    const { error } = await adminClient.from('equipment').insert({
      ...validated.data,
      created_by: user?.id,
    } as any)

    if (error) return { error: error.message }
    revalidatePath('/equipment')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function createVehicle(_prevState: EquipmentFormState, formData: FormData): Promise<EquipmentFormState> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = VehicleSchema.safeParse(rawData)

    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()

    const { error } = await adminClient.from('vehicles').insert({
      ...validated.data,
      created_by: user?.id,
    } as any)

    if (error) return { error: error.message }
    revalidatePath('/equipment')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function updateEquipmentStatus(
  id: string,
  status: string
): Promise<{ error?: string }> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('equipment') as any).update({ status, updated_at: new Date().toISOString() }).eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/equipment')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function deleteEquipment(id: string): Promise<{ error?: string }> {
  try {
    await requireRole(['admin', 'manager'])
    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('equipment') as any).update({ is_deleted: true }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/equipment')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type EquipmentItem = Awaited<ReturnType<typeof getEquipment>>[number]
export type VehicleItem = Awaited<ReturnType<typeof getVehicles>>[number]