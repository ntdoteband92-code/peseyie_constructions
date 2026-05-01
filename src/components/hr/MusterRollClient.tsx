'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Users,
  Download,
  Save,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MusterPDF } from '@/components/hr/MusterPDF'
import { pdf } from '@react-pdf/renderer'
import type { MusterData } from '@/app/actions/muster-roll'

function getDaysArray(month: string, daysInMonth: number) {
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    return `${month}-${String(d).padStart(2, '0')}`
  })
}

function isSunday(dateStr: string) {
  const [, m, day] = dateStr.split('-')
  const d = new Date(`${m}/${day}/${dateStr.split('-')[0]}`)
  return d.getDay() === 0
}

function getMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy'),
    })
  }
  return options
}

export default function MusterRollClient({ projects }: { projects: { id: string; project_name: string }[] }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? '')
  const [month, setMonth] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<MusterData | null>(null)
  const [loading, setLoading] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [attendance, setAttendance] = useState<Record<string, Record<string, 'P' | 'A' | ''>>>({})

  const loadData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/muster-roll?projectId=${projectId}&month=${month}`)
      const json = await res.json()
      setData(json)
      setDirty(false)
      const attMap: Record<string, Record<string, 'P' | 'A' | ''>> = {}
      json.workers.forEach((w: { id: string }) => {
        attMap[w.id] = {}
        for (let d = 1; d <= json.daysInMonth; d++) {
          const dateStr = `${month}-${String(d).padStart(2, '0')}`
          attMap[w.id][dateStr] = ''
        }
      })
      setAttendance(attMap)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [projectId, month])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const toggleDay = (workerId: string, dateStr: string) => {
    setAttendance(prev => {
      const next = { ...prev }
      next[workerId] = { ...next[workerId] }
      const current = next[workerId][dateStr]
      next[workerId][dateStr] = current === 'P' ? 'A' : current === 'A' ? '' : 'P'
      return next
    })
    setDirty(true)
  }

  const saveAttendance = async () => {
    const records: { workerId: string; date: string; status: string }[] = []
    for (const [workerId, days] of Object.entries(attendance)) {
      for (const [date, status] of Object.entries(days)) {
        if (status) {
          records.push({ workerId, date, status })
        }
      }
    }
    try {
      const res = await fetch('/api/muster-roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, records }),
      })
      if (!res.ok) throw new Error()
      toast.success('Attendance saved')
      setDirty(false)
    } catch {
      toast.error('Failed to save')
    }
  }

  const exportPDF = async () => {
    const res = await fetch(`/api/muster-roll/export?projectId=${projectId}&month=${month}`)
    const json = await res.json()
    if (!res.ok) { toast.error('Failed to generate PDF'); return }
    try {
      const doc = <MusterPDF data={json} daysInMonth={data?.daysInMonth ?? 31} month={month} />
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `MusterRoll-${projects.find(p => p.id === projectId)?.project_name ?? 'Project'}-${month}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF export failed')
    }
  }

  const days = data ? getDaysArray(month, data.daysInMonth) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Muster Roll</h1>
          <p className="text-sm text-gray-500">Attendance tracking & wage calculation</p>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <Button onClick={saveAttendance} variant="outline">
              <Save className="mr-2 h-4 w-4" />Save Attendance
            </Button>
          )}
          <Button onClick={exportPDF} disabled={!data}>
            <Download className="mr-2 h-4 w-4" />Export PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Project</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Month</label>
          <select value={month} onChange={e => setMonth(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {getMonthOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {!data && !loading && (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">Select a project and month to load muster data</h3>
        </CardContent></Card>
      )}

      {loading && (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-gray-500">Loading...</p>
        </CardContent></Card>
      )}

      {data && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{data.workers.length}</p>
              <p className="text-xs text-gray-500">Total Workers</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {data.workers.reduce((s, w: any) => s + w.present, 0)}
              </p>
              <p className="text-xs text-gray-500">Total Present Days</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                ₹{data.workers.reduce((s, w: any) => s + w.totalWages, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500">Total Wages</p>
            </CardContent></Card>
          </div>

          {/* Grid */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 sticky top-0">
                    <th className="p-2 text-left font-medium text-gray-500 border border-gray-200 whitespace-nowrap">#</th>
                    <th className="p-2 text-left font-medium text-gray-500 border border-gray-200 whitespace-nowrap">Worker Name</th>
                    <th className="p-2 text-left font-medium text-gray-500 border border-gray-200 whitespace-nowrap">Trade</th>
                    <th className="p-2 text-right font-medium text-gray-500 border border-gray-200 whitespace-nowrap">Wage/Day</th>
                    {days.map(d => (
                      <th key={d} className={`p-1 text-center font-medium border border-gray-200 w-8 ${isSunday(d) ? 'bg-red-50 text-red-500' : 'text-gray-500'}`}>
                        {parseInt(d.split('-')[2])}
                      </th>
                    ))}
                    <th className="p-2 text-center font-medium text-gray-500 border border-gray-200 bg-gray-50">P</th>
                    <th className="p-2 text-center font-medium text-gray-500 border border-gray-200 bg-gray-50">A</th>
                    <th className="p-2 text-right font-medium text-gray-500 border border-gray-200 bg-gray-50">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workers.map((worker: any, idx: number) => (
                    <tr key={worker.id} className="hover:bg-amber-50/30">
                      <td className="p-2 border border-gray-200 text-gray-400">{idx + 1}</td>
                      <td className="p-2 border border-gray-200 font-medium whitespace-nowrap">{worker.name}</td>
                      <td className="p-2 border border-gray-200 text-gray-500 whitespace-nowrap">{worker.trade ?? '—'}</td>
                      <td className="p-2 border border-gray-200 text-right font-mono">₹{worker.dailyWage.toLocaleString('en-IN')}</td>
                      {days.map(d => {
                        const val = attendance[worker.id]?.[d] ?? ''
                        const sunday = isSunday(d)
                        return (
                          <td
                            key={d}
                            onClick={() => !sunday && toggleDay(worker.id, d)}
                            className={`p-1 border border-gray-200 text-center cursor-pointer select-none font-mono font-bold transition-colors ${
                              sunday ? 'bg-red-50 text-red-300 cursor-not-allowed' :
                              val === 'P' ? 'bg-green-100 text-green-700' :
                              val === 'A' ? 'bg-red-100 text-red-600' :
                              'bg-white hover:bg-gray-50 text-gray-400'
                            }`}
                          >
                            {sunday ? '—' : val}
                          </td>
                        )
                      })}
                      <td className="p-2 border border-gray-200 text-center bg-green-50 font-bold text-green-700">{worker.present}</td>
                      <td className="p-2 border border-gray-200 text-center bg-red-50 font-bold text-red-700">{worker.absent}</td>
                      <td className="p-2 border border-gray-200 text-right font-mono font-bold bg-blue-50">
                        ₹{worker.totalWages.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="p-2 border border-gray-200">TOTAL ({data.workers.length} workers)</td>
                    <td colSpan={days.length + 2} className="border border-gray-200" />
                    <td className="p-2 border border-gray-200 text-center bg-green-100">
                      {data.workers.reduce((s: number, w: any) => s + w.present, 0)}
                    </td>
                    <td className="p-2 border border-gray-200 text-center bg-red-100">
                      {data.workers.reduce((s: number, w: any) => s + w.absent, 0)}
                    </td>
                    <td className="p-2 border border-gray-200 text-right bg-blue-100">
                      ₹{data.workers.reduce((s: number, w: any) => s + w.totalWages, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
          <p className="text-xs text-gray-400 text-center">
            Click cells to toggle P/A — Sundays are marked in red and cannot be edited
          </p>
        </>
      )}
    </div>
  )
}