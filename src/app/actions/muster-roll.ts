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

export async function getMusterRollData(projectId: string, month: string) {
  const supabase = await createClient()

  const startDate = `${month}-01`
  const [year, m] = month.split('-')
  const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

  const [workersResult, attendanceResult, diariesResult] = await Promise.all([
    supabase.from('workers').select('*').eq('is_deleted', false).eq('is_active', true).order('worker_name'),
    supabase
      .from('attendance')
      .select('*')
      .eq('project_id', projectId)
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('diary_entries')
      .select('entry_date, workers_present')
      .eq('project_id', projectId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate),
  ])

  const workers = workersResult.data ?? []
  const attendance = attendanceResult.data ?? []
  const diaries = diariesResult.data ?? []

  const diaryWorkersMap: Record<string, number> = {}
  diaries.forEach((d: any) => {
    if (d.entry_date && d.workers_present) {
      diaryWorkersMap[d.entry_date] = d.workers_present
    }
  })

  const daysInMonth = lastDay
  const presentDays: Record<string, Record<string, boolean>> = {}
  workers.forEach((w: any) => { presentDays[w.id] = {} })
  attendance.forEach((a: any) => {
    if (presentDays[a.worker_id]) {
      presentDays[a.worker_id][a.date] = a.status === 'present'
    }
  })

  const summary = workers.map((w: any) => {
    const days = presentDays[w.id] ?? {}
    let present = 0, absent = 0
    const half = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${month}-${String(d).padStart(2, '0')}`
      if (days[dateStr] === true) present++
      else if (days[dateStr] === false) absent++
    }
    const wages = present * (w.daily_wage ?? 0) + half * ((w.daily_wage ?? 0) / 2)
    constOT = 0
    const wagesOT = wages
    return {
      id: w.id,
      name: w.worker_name,
      trade: w.trade,
      dailyWage: w.daily_wage ?? 0,
      present,
      absent,
      half,
      totalWages: wages,
      wagesOT,
      dateOfJoining: w.date_of_joining,
    }
  })

  return { workers: summary, daysInMonth, month, projectId }
}

export type MusterData = Awaited<ReturnType<typeof getMusterRollData>>

export async function saveAttendance(projectId: string, records: { workerId: string; date: string; status: string }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await requireRole(['admin', 'manager', 'supervisor'])

  const toInsert = records.map(r => ({
    project_id: projectId,
    worker_id: r.workerId,
    date: r.date,
    status: r.status,
    created_by: user.id,
  }))

  const { error } = await supabase.from('attendance').upsert(toInsert, { onConflict: 'project_id,worker_id,date' })
  if (error) throw error
  revalidatePath('/hr')
}

export async function getMusterExportData(projectId: string, month: string) {
  const supabase = await createClient()

  const projectResult = await supabase.from('projects').select('project_name').eq('id', projectId).single()
  const projectName = projectResult.data?.project_name ?? 'Unknown Project'

  const [workersResult, attendanceResult, diariesResult] = await Promise.all([
    supabase.from('workers').select('*').eq('is_deleted', false).eq('is_active', true).order('worker_name'),
    supabase.from('attendance').select('*').eq('project_id', projectId).gte('date', `${month}-01`).lte('date', `${month}-31`),
    supabase.from('diary_entries').select('entry_date, workers_present').eq('project_id', projectId).gte('entry_date', `${month}-01`).lte('entry_date', `${month}-31`),
  ])

  const workers = workersResult.data ?? []
  const attendance = attendanceResult.data ?? []
  const diaries = diariesResult.data ?? []

  const diaryWorkersMap: Record<string, number> = {}
  diaries.forEach((d: any) => {
    if (d.entry_date && d.workers_present) diaryWorkersMap[d.entry_date] = d.workers_present
  })

  const [year, m] = month.split('-')
  const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate()

  const presentDays: Record<string, Record<string, boolean>> = {}
  workers.forEach((w: any) => { presentDays[w.id] = {} })
  attendance.forEach((a: any) => { if (presentDays[a.worker_id]) presentDays[a.worker_id][a.date] = a.status === 'present' })

  const rows = workers.map((w: any) => {
    let present = 0
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${month}-${String(d).padStart(2, '0')}`
      if (presentDays[w.id]?.[dateStr]) present++
    }
    const wages = present * (w.daily_wage ?? 0)
    return {
      sl: 0,
      name: w.worker_name,
      fatherName: w.father_name ?? '',
      trade: w.trade ?? '',
      dateOfJoining: w.date_of_joining ?? '',
      dailyWage: w.daily_wage ?? 0,
      present,
      absent: lastDay - present,
      totalWages: wages,
    }
  })

  return { workers: rows, projectName, month, lastDay, totalWorkers: workers.length }
}

export type MusterExportData = Awaited<ReturnType<typeof getMusterExportData>>