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
  if (!role || !allowedRoles.includes(role)) {
    throw new Error('Unauthorized')
  }
  return role
}

const TenderSchema = z.object({
  tender_name: z.string().min(1, 'Tender name is required'),
  nit_number: z.string().optional(),
  department: z.string().optional(),
  tender_value: z.coerce.number().optional().nullable(),
  duration_months: z.coerce.number().optional().nullable(),
  submission_deadline: z.string().optional().nullable(),
  tender_fee: z.coerce.number().optional().nullable(),
  emd_amount: z.coerce.number().optional().nullable(),
  emd_status: z.enum(['paid', 'refunded', 'forfeited']).optional().nullable(),
  emd_refund_date: z.string().optional().nullable(),
  bid_submission_date: z.string().optional().nullable(),
  bid_opening_date: z.string().optional().nullable(),
  status: z.enum(['identified', 'documents_purchased', 'bid_submitted', 'l1_lowest_bidder', 'awarded', 'lost', 'withdrawn']).default('identified'),
  our_quoted_amount: z.coerce.number().optional().nullable(),
  rival_l1_amount: z.coerce.number().optional().nullable(),
  remarks: z.string().optional(),
})

export type TenderFormState = {
  success?: boolean
  error?: string
  errors?: Record<string, string[]>
} | null

export async function getTenders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTender(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createTender(
  _prevState: TenderFormState,
  formData: FormData
): Promise<TenderFormState> {
  try {
    await requireRole(['admin', 'manager', 'accountant'])

    const rawData = Object.fromEntries(formData)
    const validated = TenderSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        error: 'Validation failed',
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('tenders').insert({
      ...validated.data,
      created_by: user?.id,
    })

    if (error) return { error: error.message }

    revalidatePath('/tenders')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function updateTender(
  id: string,
  _prevState: TenderFormState,
  formData: FormData
): Promise<TenderFormState> {
  try {
    await requireRole(['admin', 'manager', 'accountant'])

    const rawData = Object.fromEntries(formData)
    const validated = TenderSchema.omit({ status: true }).safeParse(rawData)

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        error: 'Validation failed',
      }
    }

    const status = formData.get('status') as string

    const supabase = await createClient()
    const { error } = await supabase
      .from('tenders')
      .update({
        ...validated.data,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/tenders')
    revalidatePath(`/tenders/${id}`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function convertTenderToProject(
  tenderId: string,
  _prevState: TenderFormState,
  formData: FormData
): Promise<TenderFormState> {
  try {
    await requireRole(['admin', 'manager'])

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const tender = await getTender(tenderId)
    if (!tender) return { error: 'Tender not found' }

    const contract_value = parseFloat(formData.get('contract_value') as string) || tender.tender_value || 0
    const contract_date = formData.get('contract_date') as string || null
    const start_date = formData.get('start_date') as string || null
    const expected_end_date = formData.get('expected_end_date') as string || null
    const location_district = formData.get('location_district') as string || null
    const location_state = formData.get('location_state') as string || null

    const projectData = {
      project_name: tender.tender_name,
      contract_value,
      contract_date,
      start_date,
      expected_end_date,
      location_district,
      location_state,
      tender_id: tenderId,
      status: 'ongoing' as const,
      created_by: user?.id,
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select('id')
      .single()

    if (projectError) return { error: projectError.message }

    await supabase
      .from('tenders')
      .update({
        status: 'awarded',
        converted_project_id: project.id,
      })
      .eq('id', tenderId)

    revalidatePath('/tenders')
    revalidatePath('/projects')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function updateTenderStatus(
  id: string,
  status: string
): Promise<{ error?: string }> {
  try {
    await requireRole(['admin', 'manager', 'accountant'])

    const supabase = await createClient()
    const { error } = await supabase
      .from('tenders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/tenders')
    revalidatePath(`/tenders/${id}`)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type TenderListItem = Awaited<ReturnType<typeof getTenders>>[number]