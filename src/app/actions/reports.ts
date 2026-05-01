'use server'

import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/lib/supabase/types'
import { isAppRole } from '@/lib/supabase/types'

async function getMyRole(): Promise<AppRole | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_role')
  if (error || !data || !isAppRole(data)) return null
  return data
}

export async function getReportSummary() {
  const supabase = await createClient()

  const [projectsResult, raBillsResult, expensesResult, workersResult, materialsResult, diaryResult] = await Promise.all([
    supabase.from('projects').select('id, project_name, project_status, project_value, start_date, end_date', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('ra_bills').select('id, bill_no, bill_date, bill_amount, status, project_id', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('expenses').select('amount, category, project_id, expense_date', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('workers').select('id, worker_name, trade, daily_wage, is_active', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('material_inward').select('id, quantity, unit_rate, project_id, inward_date', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('diary_entries').select('id, entry_date, project_id', { count: 'exact' }).eq('is_deleted', false),
  ])

  const projects = projectsResult.data ?? []
  const raBills = raBillsResult.data ?? []
  const expenses = expensesResult.data ?? []
  const workers = workersResult.data ?? []
  const materials = materialsResult.data ?? []
  const diaryEntries = diaryResult.data ?? []

  const activeWorkers = workers.filter((w: any) => w.is_active).length

  const totalProjectValue = projects.reduce((sum: number, p: any) => sum + (p.project_value ?? 0), 0)
  const totalRAbills = raBills.reduce((sum: number, b: any) => sum + (b.bill_amount ?? 0), 0)
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0)

  const projectExpenseMap: Record<string, number> = {}
  expenses.forEach((e: any) => {
    if (e.project_id) {
      projectExpenseMap[e.project_id] = (projectExpenseMap[e.project_id] ?? 0) + e.amount
    }
  })

  const projectMaterialsMap: Record<string, number> = {}
  materials.forEach((m: any) => {
    if (m.project_id) {
      projectMaterialsMap[m.project_id] = (projectMaterialsMap[m.project_id] ?? 0) + (m.quantity ?? 0) * (m.unit_rate ?? 0)
    }
  })

  const projectDiaryCount: Record<string, number> = {}
  diaryEntries.forEach((d: any) => {
    if (d.project_id) {
      projectDiaryCount[d.project_id] = (projectDiaryCount[d.project_id] ?? 0) + 1
    }
  })

  const projectSummary = projects.map((p: any) => {
    const projectBills = raBills.filter((b: any) => b.project_id === p.id)
    const billedAmount = projectBills.reduce((sum: number, b: any) => sum + (b.bill_amount ?? 0), 0)
    return {
      id: p.id,
      name: p.project_name,
      status: p.project_status,
      value: p.project_value ?? 0,
      start_date: p.start_date,
      end_date: p.end_date,
      ra_bills_count: projectBills.length,
      billed_amount: billedAmount,
      billed_pct: p.project_value ? Math.round((billedAmount / p.project_value) * 100) : 0,
      total_expenses: projectExpenseMap[p.id] ?? 0,
      total_materials: projectMaterialsMap[p.id] ?? 0,
      diary_entries: projectDiaryCount[p.id] ?? 0,
    }
  })

  const expenseByCategory = Object.entries(
    expenses.reduce((acc: Record<string, number>, e: any) => {
      const cat = e.category ?? 'Other'
      acc[cat] = (acc[cat] ?? 0) + e.amount
      return acc
    }, {})
  ).map(([category, amount]) => ({ category, amount: amount as number })).sort((a, b) => b.amount - a.amount)

  const raBillStatusSummary = {
    pending: raBills.filter((b: any) => b.status === 'pending').reduce((s: number, b: any) => s + (b.bill_amount ?? 0), 0),
    certified: raBills.filter((b: any) => b.status === 'certified').reduce((s: number, b: any) => s + (b.bill_amount ?? 0), 0),
    approved: raBills.filter((b: any) => b.status === 'approved').reduce((s: number, b: any) => s + (b.bill_amount ?? 0), 0),
    paid: raBills.filter((b: any) => b.status === 'paid').reduce((s: number, b: any) => s + (b.bill_amount ?? 0), 0),
    rejected: raBills.filter((b: any) => b.status === 'rejected').reduce((s: number, b: any) => s + (b.bill_amount ?? 0), 0),
    count: raBills.length,
  }

  return {
    stats: {
      total_projects: projects.length,
      active_projects: projects.filter((p: any) => p.project_status === 'in_progress').length,
      total_project_value,
      total_ra_bills: totalRAbills,
      total_expenses: totalExpenses,
      active_workers: activeWorkers,
      total_workers: workers.length,
      total_ra_bill_count: raBills.length,
    },
    projectSummary,
    expenseByCategory,
    raBillStatusSummary,
  }
}

export type ReportSummary = Awaited<ReturnType<typeof getReportSummary>>