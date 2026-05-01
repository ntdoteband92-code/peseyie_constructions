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

// Materials Registry
const MaterialSchema = z.object({
  material_name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  standard_rate: z.coerce.number().optional().nullable(),
})

export async function getMaterials() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('materials').select('*').eq('is_deleted', false).order('material_name')
  if (error) throw error
  return data
}

export async function createMaterial(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = MaterialSchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('materials').insert({ ...validated.data, created_by: user?.id })
    if (error) return { error: error.message }
    revalidatePath('/materials')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// Material Inward
const MaterialInwardSchema = z.object({
  material_id: z.string().uuid().min(1, 'Material is required'),
  project_id: z.string().uuid().min(1, 'Project is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive'),
  rate_per_unit: z.coerce.number().min(0),
  total_amount: z.coerce.number().min(0),
  supplier_name: z.string().optional(),
  invoice_number: z.string().optional(),
  vehicle_number: z.string().optional(),
  received_by: z.string().optional(),
  quality_note: z.string().optional(),
})

export async function getMaterialInward(projectId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('material_inward')
    .select('*, material:materials(material_name, unit), project:projects(project_name)')
    .eq('is_deleted', false)
    .order('inward_date', { ascending: false })
  if (projectId) query = query.eq('project_id', projectId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createMaterialInward(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = MaterialInwardSchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('material_inward').insert({
      ...validated.data,
      inward_date: validated.data.inward_date || new Date().toISOString().split('T')[0],
      created_by: user?.id,
    })
    if (error) return { error: error.message }
    revalidatePath('/materials')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// Explosives Register (special compliance module)
const ExplosiveSchema = z.object({
  explosive_type: z.string().min(1, 'Type is required'),
  license_number: z.string().optional(),
  license_expiry: z.string().optional(),
  magazine_location: z.string().optional(),
  inward_date: z.string().min(1, 'Date is required'),
  quantity_in: z.coerce.number().min(0),
  source: z.string().optional(),
  invoice_number: z.string().optional(),
  transport_permit: z.string().optional(),
  issue_date: z.string().optional(),
  quantity_out: z.coerce.number().optional().nullable(),
  shot_number: z.string().optional(),
  issued_to: z.string().optional(),
  remarks: z.string().optional(),
  entry_type: z.enum(['inward', 'issue', 'return']),
})

export async function getExplosivesLog() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('explosives_register')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createExplosiveEntry(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = ExplosiveSchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('explosives_register').insert({
      ...validated.data,
      created_by: user?.id,
    })
    if (error) return { error: error.message }
    revalidatePath('/materials')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type Material = Awaited<ReturnType<typeof getMaterials>>[number]
export type ExplosiveEntry = Awaited<ReturnType<typeof getExplosivesLog>>[number]