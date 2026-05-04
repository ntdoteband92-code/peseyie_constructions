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

// Materials Registry
const MaterialSchema = z.object({
  material_name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  standard_rate: z.coerce.number().optional().nullable(),
})

export async function getMaterials() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('materials').select('*').eq('is_deleted', false).order('material_name')
  if (error) throw error
  return (data ?? []) as any
}

export async function createMaterial(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    console.log('[createMaterial] rawData:', JSON.stringify(rawData))

    const rawDataClean = {
      ...rawData,
      standard_rate: rawData.standard_rate === '' ? null : Number(rawData.standard_rate),
    }

    const validated = MaterialSchema.safeParse(rawDataClean)
    if (!validated.success) {
      console.log('[createMaterial] validation errors:', JSON.stringify(validated.error.flatten().fieldErrors))
      return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('materials').insert({ ...validated.data, created_by: user?.id } as any)
    if (error) return { error: error.message }
    revalidatePath('/materials')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function deleteMaterial(id: string): Promise<{ error?: string }> {
  try {
    await requireRole(['admin', 'manager'])
    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('materials') as any).update({ is_deleted: true }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/materials')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// Material Inward
const MaterialInwardSchema = z.object({
  material_id: z.string().uuid().min(1, 'Material is required'),
  project_id: z.string().uuid().min(1, 'Project is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  rate_per_unit: z.coerce.number().min(0),
  total_amount: z.coerce.number().min(0),
  inward_date: z.string().min(1, 'Date is required'),
  vendor_id: z.string().optional(),
  invoice_no: z.string().optional(),
  vehicle_no: z.string().optional(),
  received_by: z.string().optional(),
  quality_note: z.string().optional(),
})

export async function getMaterialInward(projectId?: string) {
  const supabase = await createAdminClient()
  let query = supabase
    .from('material_inward')
    .select('*, material:materials(material_name, unit), project:projects(project_name)')
    .eq('is_deleted', false)
    .order('inward_date', { ascending: false })
  if (projectId) query = query.eq('project_id', projectId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any
}

export async function createMaterialInward(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    console.log('[createMaterialInward] rawData:', JSON.stringify(rawData))

    const rawDataClean = {
      ...rawData,
      quantity: rawData.quantity === '' ? 0 : Number(rawData.quantity),
      rate_per_unit: rawData.rate_per_unit === '' ? 0 : Number(rawData.rate_per_unit),
      total_amount: rawData.total_amount === '' ? null : Number(rawData.total_amount),
      vendor_id: rawData.vendor_id === '' ? null : rawData.vendor_id,
    }

    const validated = MaterialInwardSchema.safeParse(rawDataClean)
    if (!validated.success) {
      console.log('[createMaterialInward] validation errors:', JSON.stringify(validated.error.flatten().fieldErrors))
      return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('material_inward').insert({
      material_id: validated.data.material_id,
      project_id: validated.data.project_id,
      quantity: validated.data.quantity,
      rate_per_unit: validated.data.rate_per_unit,
      total_amount: validated.data.total_amount,
      inward_date: validated.data.inward_date,
      vendor_id: validated.data.vendor_id,
      invoice_no: validated.data.invoice_no,
      vehicle_no: validated.data.vehicle_no,
      created_by: user?.id,
    } as any)
    if (error) return { error: error.message }
    revalidatePath('/materials')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// Explosives Register (special compliance module)
const ExplosiveSchema = z.object({
  license_id: z.string().optional(),
  project_id: z.string().optional(),
  entry_date: z.string().min(1, 'Date is required'),
  entry_type: z.enum(['inward', 'issue', 'return']),
  explosive_type: z.string().min(1, 'Type is required'),
  quantity: z.coerce.number().min(0),
  source_dealer: z.string().optional(),
  transport_permit: z.string().optional(),
  invoice_no: z.string().optional(),
  blast_shot_ref: z.string().optional(),
  issued_to: z.string().optional(),
  received_by: z.string().optional(),
  is_correction: z.boolean().optional(),
  correction_of: z.string().optional(),
  correction_reason: z.string().optional(),
})

export async function getExplosivesLog() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('explosives_register')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as any
}

export async function createExplosiveEntry(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    console.log('[createExplosiveEntry] rawData:', JSON.stringify(rawData))

    const rawDataClean = {
      ...rawData,
      license_id: rawData.license_id === '' ? null : rawData.license_id,
      project_id: rawData.project_id === '' ? null : rawData.project_id,
      quantity: rawData.quantity === '' ? 0 : Number(rawData.quantity),
      entry_date: rawData.entry_date || new Date().toISOString().split('T')[0],
    }

    const validated = ExplosiveSchema.safeParse(rawDataClean)
    if (!validated.success) {
      console.log('[createExplosiveEntry] validation errors:', JSON.stringify(validated.error.flatten().fieldErrors))
      return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('explosives_register').insert({
      ...validated.data,
      created_by: user?.id,
    } as any)
    console.log('[createExplosiveEntry] Insert result, error:', error)
    if (error) return { error: error.message }
    revalidatePath('/materials')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type Material = Awaited<ReturnType<typeof getMaterials>>[number]
export type ExplosiveEntry = Awaited<ReturnType<typeof getExplosivesLog>>[number]