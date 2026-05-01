'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AppRole, Database } from '@/lib/supabase/types'

// ─── Guard helper ───────────────────────────────────────────────────
async function requireRole(allowedRoles: AppRole[]): Promise<AppRole> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_role')
  if (error) {
    throw error
  }
  if (!data || !allowedRoles.includes(data)) {
    throw new Error('Unauthorized')
  }
  return data
}

// ─── Org Settings ───────────────────────────────────────────────────
const OrgSettingsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  default_retention_pct: z.coerce.number().min(0).max(100),
  default_tds_pct: z.coerce.number().min(0).max(100),
  default_labour_cess_pct: z.coerce.number().min(0).max(100),
})

export type OrgSettingsState = {
  success?: boolean
  error?: string
} | null

export async function updateOrgSettings(
  _prev: OrgSettingsState,
  formData: FormData
): Promise<OrgSettingsState> {
  try {
    await requireRole(['admin', 'manager'])
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const raw = Object.fromEntries(formData)
    const validated = OrgSettingsSchema.safeParse(raw)
    if (!validated.success) {
      return { error: validated.error.issues[0].message }
    }

    const { data: existing } = await supabase
      .from('org_settings')
      .select('id')
      .single()

    if (existing) {
      const updateData = {
        company_name: validated.data.company_name,
        address: validated.data.address,
        gstin: validated.data.gstin,
        pan: validated.data.pan,
        phone: validated.data.phone,
        email: validated.data.email,
        default_retention_pct: validated.data.default_retention_pct,
        default_tds_pct: validated.data.default_tds_pct,
        default_labour_cess_pct: validated.data.default_labour_cess_pct,
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('org_settings')
        .update(updateData)
        .eq('id', existing.id)
      if (error) return { error: error.message }
    } else {
      const insertData = {
        company_name: validated.data.company_name,
        address: validated.data.address,
        gstin: validated.data.gstin,
        pan: validated.data.pan,
        phone: validated.data.phone,
        email: validated.data.email,
        default_retention_pct: validated.data.default_retention_pct,
        default_tds_pct: validated.data.default_tds_pct,
        default_labour_cess_pct: validated.data.default_labour_cess_pct,
        updated_by: user?.id ?? null
      }

      const { error } = await supabase
        .from('org_settings')
        .insert(insertData)
      if (error) return { error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// ─── Invite User ────────────────────────────────────────────────────
const InviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'manager', 'accountant', 'supervisor', 'viewer']),
  full_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
})

export type InviteUserState = {
  success?: boolean
  error?: string
} | null

export async function inviteUser(
  _prev: InviteUserState,
  formData: FormData
): Promise<InviteUserState> {
  try {
    await requireRole(['admin'])

    const validated = InviteSchema.safeParse({
      email: formData.get('email'),
      role: formData.get('role'),
      full_name: formData.get('full_name'),
    })
    if (!validated.success) {
      return { error: validated.error.issues[0].message }
    }

    const adminClient = await createAdminClient()

    // Invite by email — sends magic link for user to set password
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
      validated.data.email,
      {
        data: { full_name: validated.data.full_name ?? '' },
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
      }
    )

    if (error) return { error: error.message }

    // Set the desired role (trigger creates 'viewer' by default; we upgrade it)
    if (data.user && validated.data.role !== 'viewer') {
      await adminClient
        .from('user_roles')
        .update({ role: validated.data.role })
        .eq('user_id', data.user.id)
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// ─── Update User Role ────────────────────────────────────────────────
export type UpdateRoleState = {
  success?: boolean
  error?: string
} | null

export async function updateUserRole(
  _prev: UpdateRoleState,
  formData: FormData
): Promise<UpdateRoleState> {
  try {
    await requireRole(['admin'])

    const userId = formData.get('user_id') as string
    const newRole = formData.get('role') as AppRole

    if (!userId || !newRole) return { error: 'Missing user ID or role' }

    const supabase = await createClient()
    const { data: adminUser } = await supabase.auth.getUser()

    // Prevent changing own role to non-admin if last admin
    if (adminUser.user?.id === userId && newRole !== 'admin') {
      const { count } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')

      if ((count ?? 0) <= 1) {
        return { error: 'Cannot remove the last administrator account.' }
      }
    }

    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole, assigned_by: adminUser.user?.id })
      .eq('user_id', userId)

    if (error) return { error: error.message }

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// ─── Deactivate User ────────────────────────────────────────────────
export type DeactivateUserState = {
  success?: boolean
  error?: string
} | null

export async function deactivateUser(
  _prev: DeactivateUserState,
  formData: FormData
): Promise<DeactivateUserState> {
  try {
    await requireRole(['admin'])

    const userId = formData.get('user_id') as string
    const activate = formData.get('activate') === 'true'

    if (!userId) return { error: 'Missing user ID' }

    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Check: don't deactivate last admin
    if (!activate) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (userRole?.role === 'admin') {
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin')
        if ((count ?? 0) <= 1) {
          return { error: 'Cannot deactivate the last administrator account.' }
        }
      }
    }

    // Update profile is_active flag
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_active: activate })
      .eq('id', userId)

    if (profileError) return { error: profileError.message }

    // Use admin client to ban/unban from Supabase Auth
    const { error: authError } = await adminClient.auth.admin.updateUserById(
      userId,
      { ban_duration: activate ? 'none' : '876600h' } // 100 years
    )

    if (authError) return { error: authError.message }

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}