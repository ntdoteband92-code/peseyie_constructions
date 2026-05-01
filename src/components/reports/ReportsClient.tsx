'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  BarChart3,
  FileText,
  Download,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { ReportSummary } from '@/app/actions/reports'
import ReportsPDF from '@/components/reports/ReportsPDF'
import { pdf } from '@react-pdf/renderer'

function formatINR(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  on_hold: 'bg-red-50 text-red-700',
  certified: 'bg-purple-50 text-purple-700',
  approved: 'bg-indigo-50 text-indigo-700',
  paid: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
}

const RA_STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-600',
  certified: 'text-purple-600',
  approved: 'text-indigo-600',
  paid: 'text-green-600',
  rejected: 'text-red-600',
}

export default function ReportsClient({ data }: { data: ReportSummary }) {
  const [exporting, setExporting] = useState(false)

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const doc = <ReportsPDF data={data} />
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Pespeyie-Report-${format(new Date(), 'ddMMMyyyy')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch (err) {
      console.error(err)
      toast.error('PDF export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">As of {format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
        </div>
        <Button onClick={handleExportPDF} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Generating...' : 'Export PDF'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={String(data.stats.total_projects)} sub={`${data.stats.active_projects} active`} />
        <StatCard label="Total Project Value" value={formatINR(data.stats.total_project_value)} />
        <StatCard label="RA Bills Raised" value={formatINR(data.stats.total_ra_bills)} sub={`${data.stats.total_ra_bill_count} bills`} />
        <StatCard label="Total Expenses" value={formatINR(data.stats.total_expenses)} />
        <StatCard label="Active Workers" value={String(data.stats.active_workers)} sub={`${data.stats.total_workers} total registered`} />
        <StatCard
          label="Bill Collection"
          value={data.stats.total_project_value > 0
            ? Math.round((data.stats.total_ra_bills / data.stats.total_project_value) * 100) + '%'
            : '0%'}
          sub="of total project value"
        />
        <StatCard
          label="Net Position"
          value={formatINR(data.stats.total_ra_bills - data.stats.total_expenses)}
          sub="bills minus expenses"
        />
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Project Summary</TabsTrigger>
          <TabsTrigger value="ra-bills">RA Bill Status</TabsTrigger>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-500">Project</th>
                    <th className="text-left p-3 font-medium text-gray-500">Status</th>
                    <th className="text-right p-3 font-medium text-gray-500">Value</th>
                    <th className="text-right p-3 font-medium text-gray-500">Billed</th>
                    <th className="text-right p-3 font-medium text-gray-500">Billed %</th>
                    <th className="text-right p-3 font-medium text-gray-500">Expenses</th>
                    <th className="text-right p-3 font-medium text-gray-500">Materials</th>
                    <th className="text-right p-3 font-medium text-gray-500">Diary Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projectSummary.map((p: any) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {p.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">{formatINR(p.value)}</td>
                      <td className="p-3 text-right">{formatINR(p.billed_amount)}</td>
                      <td className="p-3 text-right">
                        <span className={`text-xs ${p.billed_pct > 80 ? 'text-green-600' : p.billed_pct > 30 ? 'text-amber-600' : 'text-gray-500'}`}>
                          {p.billed_pct}%
                        </span>
                      </td>
                      <td className="p-3 text-right text-red-600">{formatINR(p.total_expenses)}</td>
                      <td className="p-3 text-right text-blue-600">{formatINR(p.total_materials)}</td>
                      <td className="p-3 text-right text-gray-600">{p.diary_entries}</td>
                    </tr>
                  ))}
                  {data.projectSummary.length === 0 && (
                    <tr><td colSpan={8} className="p-6 text-center text-gray-400">No projects found</td></tr>
                  )}
                </tbody>
                {data.projectSummary.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="p-3">Total ({data.projectSummary.length})</td>
                      <td />
                      <td className="p-3 text-right">{formatINR(data.stats.total_project_value)}</td>
                      <td className="p-3 text-right">{formatINR(data.stats.total_ra_bills)}</td>
                      <td className="p-3 text-right">
                        {data.stats.total_project_value > 0
                          ? Math.round((data.stats.total_ra_bills / data.stats.total_project_value) * 100) + '%'
                          : '0%'}
                      </td>
                      <td className="p-3 text-right text-red-600">{formatINR(data.stats.total_expenses)}</td>
                      <td />
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ra-bills">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {(['pending', 'certified', 'approved', 'paid', 'rejected'] as const).map(status => (
                  <div key={status} className="text-center p-4 rounded-lg bg-gray-50">
                    <p className={`text-lg font-bold ${RA_STATUS_COLORS[status]}`}>
                      {formatINR(data.raBillStatusSummary[status] ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize mt-1">{status}</p>
                  </div>
                ))}
              </div>
              <div className="h-3 rounded-full bg-gray-200 overflow-hidden flex">
                {(['pending', 'certified', 'approved', 'paid', 'rejected'] as const).map(status => {
                  const pct = data.stats.total_ra_bills > 0
                    ? ((data.raBillStatusSummary[status] ?? 0) / data.stats.total_ra_bills) * 100
                    : 0
                  if (pct === 0) return null
                  const colors: Record<string, string> = {
                    pending: 'bg-amber-400',
                    certified: 'bg-purple-400',
                    approved: 'bg-indigo-400',
                    paid: 'bg-green-400',
                    rejected: 'bg-red-400',
                  }
                  return (
                    <div key={status} className={`${colors[status]} h-full`} style={{ width: `${pct}%` }} title={`${status}: ${pct.toFixed(1)}%`} />
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">{data.stats.total_ra_bill_count} total RA Bills — {formatINR(data.stats.total_ra_bills)} total billed value</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-500">Category</th>
                    <th className="text-right p-3 font-medium text-gray-500">Amount</th>
                    <th className="text-right p-3 font-medium text-gray-500">% of Total</th>
                    <th className="p-3 font-medium text-gray-500">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenseByCategory.map((row: any, i: number) => {
                    const pct = data.stats.total_expenses > 0
                      ? (row.amount / data.stats.total_expenses) * 100
                      : 0
                    return (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{row.category}</td>
                        <td className="p-3 text-right font-medium">{formatINR(row.amount)}</td>
                        <td className="p-3 text-right text-gray-500">{pct.toFixed(1)}%</td>
                        <td className="p-3">
                          <div className="w-32 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {data.expenseByCategory.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-400">No expenses found</td></tr>
                  )}
                </tbody>
                {data.expenseByCategory.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="p-3">Total</td>
                      <td className="p-3 text-right">{formatINR(data.stats.total_expenses)}</td>
                      <td className="p-3 text-right">100%</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}