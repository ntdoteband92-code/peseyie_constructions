'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AppRole } from '@/lib/supabase/types'
import { isAppRole } from '@/lib/supabase/types'

export async function getMyRole(): Promise<AppRole | null> {
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

const ProjectSchema = z.object({
  project_name: z.string().min(1, 'Project name is required'),
  contract_number: z.string().optional(),
  tender_id: z.string().transform(v => v === '' ? null : v).optional().nullable(),
  client_name: z.string().optional(),
  client_contact_person: z.string().optional(),
  client_phone: z.string().optional(),
  contract_value: z.coerce.number().min(0).default(0),
  contract_date: z.string().transform(v => v === '' ? null : v).optional().nullable(),
  start_date: z.string().transform(v => v === '' ? null : v).optional().nullable(),
  expected_end_date: z.string().transform(v => v === '' ? null : v).optional().nullable(),
  actual_end_date: z.string().transform(v => v === '' ? null : v).optional().nullable(),
  location_district: z.string().optional(),
  location_state: z.string().optional(),
  project_type: z.array(z.string()).optional().default([]),
  status: z.enum(['ongoing', 'completed', 'on_hold', 'defect_liability', 'terminated']).default('ongoing'),
  security_deposit: z.coerce.number().optional().nullable(),
  security_deposit_status: z.string().optional().nullable(),
  scope_of_work: z.string().optional(),
  project_manager_id: z.string().transform(v => v === '' ? null : v).optional().nullable(),
})

export type ProjectFormState = {
  success?: boolean
  error?: string
  errors?: Record<string, string[]>
} | null

async function requireRole(allowedRoles: AppRole[]): Promise<AppRole | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('[requireRole] Auth error:', authError.message)
      return null
    }
    if (!user) {
      console.log('[requireRole] No user found from auth.getUser()')
      return null
    }

    const { data, error } = await (supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()) as any

    if (error) {
      console.log('[requireRole] Error fetching user_roles:', error.message)
      return null
    }
    if (!data) {
      console.log('[requireRole] No role found for user:', user.id)
      return null
    }
    if (!isAppRole(data.role)) {
      console.log('[requireRole] Role is not a valid AppRole:', data.role)
      return null
    }
    if (!allowedRoles.includes(data.role)) {
      console.log(`[requireRole] User role '${data.role}' not in allowed roles:`, allowedRoles)
      return null
    }
    console.log('[requireRole] Role check passed, user has role:', data.role)
    return data.role
  } catch (err) {
    console.log('[requireRole] Exception:', err)
    return null
  }
}

export async function getProjects() {
  try {
    const supabase = await createAdminClient()
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getProjects error:', error.message, error.code)
      return []
    }
    return (projects ?? []) as any
  } catch (err) {
    console.error('getProjects exception:', err)
    return []
  }
}

export async function getProject(id: string) {
  const supabase = await createAdminClient()
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return project as any
}

export async function getProjectFinancialSummary(id: string) {
  const supabase = await createAdminClient()
  const { data, error } = await (supabase.rpc('get_project_financial_summary', { p_project_id: id } as any) as any)
  if (error) throw error
  return data?.[0] ?? null
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const DEBUG_SKIP_AUTH = process.env.DEBUG_SKIP_AUTH === 'true'
  try {
    console.log('[createProject] Started with formData keys:', Array.from(formData.keys()))

    if (!DEBUG_SKIP_AUTH) {
      const role = await requireRole(['admin', 'manager', 'accountant'])
      if (!role) {
        console.log('[createProject] requireRole failed - user may not have a role assigned')
        return { error: 'Unauthorized - You may not have a role assigned. Please contact admin.' }
      }
    } else {
      console.log('[createProject] DEBUG MODE: Skipping auth check')
    }

    const rawData = Object.fromEntries(formData)
    console.log('[createProject] rawData keys:', Object.keys(rawData))
    const validated = ProjectSchema.omit({ project_type: true }).safeParse(rawData)

    if (!validated.success) {
      console.log('[createProject] Validation failed:', validated.error.flatten().fieldErrors)
      return {
        errors: validated.error.flatten().fieldErrors,
        error: 'Validation failed: ' + Object.keys(validated.error.flatten().fieldErrors).join(', '),
      }
    }

    const project_type = formData.getAll('project_type') as string[]
    console.log('[createProject] Validation passed. project_type:', project_type)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('[createProject] No user from getUser()')
      return { error: 'Authentication error. Please log out and log in again.' }
    }

    console.log('[createProject] User:', user.id, 'Attempting to insert into projects table...')
    const insertData = {
      ...validated.data,
      project_type,
      created_by: user.id,
    }
    console.log('[createProject] Insert data:', JSON.stringify(insertData, null, 2))

    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('projects') as any).insert(insertData)

    if (error) {
      console.error('[createProject] Supabase insert error:', error)
      return { error: 'Database error: ' + error.message }
    }

    console.log('[createProject] Insert successful, revalidating path...')
    revalidatePath('/projects')
    return { success: true }
  } catch (err) {
    console.error('[createProject] Uncaught exception:', err)
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function updateProject(
  id: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  try {
    const role = await requireRole(['admin', 'manager', 'accountant'])
    if (!role) return { error: 'Unauthorized - Insufficient permissions' }

    const rawData = Object.fromEntries(formData)
    const validated = ProjectSchema.omit({ project_type: true }).safeParse(rawData)

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        error: 'Validation failed',
      }
    }

    const project_type = formData.getAll('project_type') as string[]

    const adminClient = await createAdminClient()
    const { error } = await (((adminClient as any).from('projects'))
      .update({
        ...validated.data,
        project_type,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id) as any)

    if (error) return { error: error.message }

    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  try {
    const role = await requireRole(['admin'])
    if (!role) return { error: 'Unauthorized - Admin access required' }

    const adminClient = await createAdminClient()
    const { error } = await (((adminClient as any).from('projects'))
      .update({ is_deleted: true } as any)
      .eq('id', id) as any)

    if (error) return { error: error.message }

    revalidatePath('/projects')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function convertTenderToProject(
  tenderId: string,
  projectData: {
    project_name: string
    contract_value: number
    client_name: string
    contract_date: string
    start_date: string
    expected_end_date: string
    location_district: string
    location_state: string
  }
): Promise<{ projectId?: string; error?: string }> {
  try {
    const role = await requireRole(['admin', 'manager'])
    if (!role) return { error: 'Unauthorized - Insufficient permissions' }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        tender_id: tenderId,
        status: 'ongoing',
        created_by: user?.id,
      } as any)
      .select('id')
      .single()

    if (insertError) return { error: insertError.message }

    await ((supabase
      .from('tenders') as any)
      .update({
        status: 'awarded',
        converted_project_id: (project as any).id,
      } as any)
      .eq('id', tenderId) as any)

    revalidatePath('/projects')
    revalidatePath('/tenders')
    return { projectId: (project as any).id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type ProjectListItem = Awaited<ReturnType<typeof getProjects>>[number]