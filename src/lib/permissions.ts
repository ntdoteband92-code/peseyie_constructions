import type { AppRole } from '@/lib/supabase/types'

/**
 * Permission matrix: role → module → actions allowed
 * Mirrors the spec table exactly.
 * Used both server-side (in Server Actions) and client-side (for UI gating only).
 * Real enforcement is Supabase RLS — this is UX-only on the client.
 */

type Action = 'read' | 'write' | 'delete'

type ModulePermissions = {
  [module: string]: Action[]
}

const PERMISSIONS: Record<AppRole, ModulePermissions> = {
  admin: {
    users: ['read', 'write', 'delete'],
    settings: ['read', 'write'],
    tenders: ['read', 'write', 'delete'],
    projects: ['read', 'write', 'delete'],
    ra_bills: ['read', 'write', 'delete'],
    expenses: ['read', 'write', 'delete'],
    petty_cash: ['read', 'write', 'delete'],
    hr: ['read', 'write', 'delete'],
    attendance: ['read', 'write', 'delete'],
    payroll: ['read', 'write', 'delete'],
    advances: ['read', 'write', 'delete'],
    equipment: ['read', 'write', 'delete'],
    equipment_usage: ['read', 'write', 'delete'],
    fuel: ['read', 'write', 'delete'],
    materials: ['read', 'write', 'delete'],
    explosives: ['read', 'write', 'delete'],
    blasting: ['read', 'write', 'delete'],
    subcontractors: ['read', 'write', 'delete'],
    diary: ['read', 'write', 'delete'],
    documents: ['read', 'write', 'delete'],
    estimation: ['read', 'write', 'delete'],
    reports: ['read', 'write'],
  },
  manager: {
    users: [],
    settings: ['read', 'write'],
    tenders: ['read', 'write', 'delete'],
    projects: ['read', 'write', 'delete'],
    ra_bills: ['read', 'write', 'delete'],
    expenses: ['read', 'write', 'delete'],
    petty_cash: ['read', 'write', 'delete'],
    hr: ['read', 'write', 'delete'],
    attendance: ['read', 'write'],
    payroll: ['read', 'write', 'delete'],
    advances: ['read', 'write', 'delete'],
    equipment: ['read', 'write'],
    equipment_usage: ['read', 'write'],
    fuel: ['read', 'write'],
    materials: ['read', 'write'],
    explosives: ['read', 'write'],
    blasting: ['read', 'write'],
    subcontractors: ['read', 'write', 'delete'],
    diary: ['read', 'write'],
    documents: ['read', 'write'],
    estimation: ['read', 'write'],
    reports: ['read', 'write'],
  },
  accountant: {
    users: [],
    settings: [],
    tenders: ['read', 'write'],
    projects: ['read', 'write'],
    ra_bills: ['read', 'write', 'delete'],
    expenses: ['read', 'write', 'delete'],
    petty_cash: ['read', 'write', 'delete'],
    hr: ['read', 'write'],
    attendance: [],
    payroll: ['read', 'write', 'delete'],
    advances: ['read', 'write', 'delete'],
    equipment: ['read'],
    equipment_usage: ['read'],
    fuel: ['read'],
    materials: ['read'],
    explosives: ['read'],
    blasting: ['read'],
    subcontractors: ['read', 'write'],
    diary: ['read'],
    documents: ['read', 'write'],
    estimation: ['read', 'write'],
    reports: ['read', 'write'],
  },
  supervisor: {
    users: [],
    settings: [],
    tenders: ['read'],
    projects: ['read'],
    ra_bills: ['read'],
    expenses: ['read'],
    petty_cash: ['read', 'write'],
    hr: ['read'],
    attendance: ['read', 'write'],
    payroll: ['read'],
    advances: ['read'],
    equipment: ['read'],
    equipment_usage: ['read', 'write'],
    fuel: ['read', 'write'],
    materials: ['read', 'write'],
    explosives: ['read', 'write'],
    blasting: ['read', 'write'],
    subcontractors: ['read'],
    diary: ['read', 'write'],
    documents: ['read', 'write'],
    estimation: ['read'],
    reports: ['read'],
  },
  viewer: {
    users: [],
    settings: [],
    tenders: ['read'],
    projects: ['read'],
    ra_bills: ['read'],
    expenses: ['read'],
    petty_cash: ['read'],
    hr: ['read'],
    attendance: ['read'],
    payroll: ['read'],
    advances: ['read'],
    equipment: ['read'],
    equipment_usage: ['read'],
    fuel: ['read'],
    materials: ['read'],
    explosives: ['read'],
    blasting: ['read'],
    subcontractors: ['read'],
    diary: ['read'],
    documents: ['read'],
    estimation: ['read'],
    reports: ['read'],
  },
}

/**
 * Check if a role has a specific permission for a module.
 * @param role - The user's role (or null if unauthenticated)
 * @param module - Module key (e.g. 'projects', 'ra_bills')
 * @param action - Action to check ('read' | 'write' | 'delete')
 */
export function hasPermission(
  role: AppRole | null | undefined,
  module: string,
  action: Action
): boolean {
  if (!role) return false
  const perms = PERMISSIONS[role]?.[module] ?? []
  return perms.includes(action)
}

/**
 * Returns true if the role can write (insert/update) to a module.
 */
export function canWrite(role: AppRole | null | undefined, module: string): boolean {
  return hasPermission(role, module, 'write')
}

/**
 * Returns true if the role can delete from a module.
 */
export function canDelete(role: AppRole | null | undefined, module: string): boolean {
  return hasPermission(role, module, 'delete')
}

/**
 * Returns true if the role can read a module.
 */
export function canRead(role: AppRole | null | undefined, module: string): boolean {
  return hasPermission(role, module, 'read')
}

export { PERMISSIONS }
export type { AppRole, Action }
