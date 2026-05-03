'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import {
  Users,
  Plus,
  Search,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Employee } from '@/app/actions/hr'
import dynamic from 'next/dynamic'

const MusterRollClient = dynamic(() => import('./MusterRollClient'), { ssr: false })

const ROLES = [
  'Site Engineer', 'Supervisor', 'Surveyor', 'Machine Operator', 'Skilled Worker',
  'Unskilled Worker', 'Driver', 'Blasting Foreman', 'Safety Officer', 'Office Staff',
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-700' },
  left: { bg: 'bg-red-100', text: 'text-red-800' },
}

function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export default function HRClient({
  employees,
  projects,
  advances,
}: {
  employees: Employee[]
  projects: { id: string; project_name: string }[]
  advances: any[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false)
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false)
  const [tab, setTab] = useState<'employees' | 'advances' | 'muster'>('employees')

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = search === '' ||
        e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.contact_number?.includes(search)
      const matchesRole = roleFilter === 'all' || e.role === roleFilter
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? e.is_active : !e.is_active)
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [employees, search, roleFilter, statusFilter])

  const advanceStats = useMemo(() => {
    const total = advances.reduce((s, a) => s + (a.amount_given ?? 0), 0)
    const activeEmployees = employees.filter(e => e.is_active).length
    return { total, activeEmployees, count: advances.length }
  }, [advances, employees])

  const handleSubmit = async (formData: FormData, action: string) => {
    try {
      const payload = Object.fromEntries(formData)
      const res = await fetch(`/api/hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast.success('Created successfully')
      setShowEmployeeDialog(false)
      setShowAdvanceDialog(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & Payroll</h1>
          <p className="text-sm text-gray-500">{employees.length} workers, {advanceStats.activeEmployees} active</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab('employees')} className={tab === 'employees' ? 'bg-amber-50 border-amber-200' : ''}>
            <Users className="mr-2 h-4 w-4" />Workers
          </Button>
          <Button variant="outline" onClick={() => setTab('advances')} className={tab === 'advances' ? 'bg-amber-50 border-amber-200' : ''}>
            <TrendingUp className="mr-2 h-4 w-4" />Advances
          </Button>
          <Button variant="outline" onClick={() => setTab('muster')} className={tab === 'muster' ? 'bg-amber-50 border-amber-200' : ''}>
            <Calendar className="mr-2 h-4 w-4" />Muster Roll
          </Button>
          <Button onClick={() => tab === 'employees' ? setShowEmployeeDialog(true) : setShowAdvanceDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {tab === 'employees' ? 'Add Worker' : 'Give Advance'}
          </Button>
        </div>
      </div>

      {tab === 'employees' && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-xs text-blue-600">Total Workers</p>
                <p className="text-xl font-bold text-blue-700">{employees.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-xs text-green-600">Active</p>
                <p className="text-xl font-bold text-green-700">{advanceStats.activeEmployees}</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <p className="text-xs text-amber-600">Outstanding Advances</p>
                <p className="text-xl font-bold text-amber-700">{formatINR(advanceStats.total)}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <p className="text-xs text-purple-600">Advance Records</p>
                <p className="text-xl font-bold text-purple-700">{advanceStats.count}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search workers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="left">Left</option>
            </select>
          </div>

          {/* Employee Grid */}
          {filteredEmployees.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No workers found</h3>
            </CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map(emp => {
                const status = emp.is_active ? 'active' : 'inactive'
                  return (
                    <Card key={emp.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-amber-700 font-semibold text-sm">
                              {emp.full_name?.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${status ? STATUS_COLORS.active.bg + ' ' + STATUS_COLORS.active.text : STATUS_COLORS.inactive.bg + ' ' + STATUS_COLORS.inactive.text}`}>
                            {emp.is_active ? 'Active' : 'Inactive'}
                          </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{emp.full_name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{emp.role}</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        {emp.contact_number && <p>📞 {emp.contact_number}</p>}
                        <p className="text-xs">
                          Wage: {emp.wage_type === 'daily_rate' ? `${formatINR(emp.wage_rate)}/day` : `${formatINR(emp.wage_rate)}/month`}
                        </p>
                        {emp.employment_type && (
                          <span className={`inline-block rounded bg-gray-100 px-2 py-0.5 text-xs ${emp.employment_type === 'direct' ? 'text-blue-600' : 'text-purple-600'}`}>
                            {emp.employment_type}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'advances' && (
        <>
          {advances.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-16">
              <TrendingUp className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No advance records</h3>
              <p className="mt-1 text-sm text-gray-500">Give advances to workers here</p>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-500">Date</th>
                      <th className="text-left p-3 font-medium text-gray-500">Worker</th>
                      <th className="text-left p-3 font-medium text-gray-500">Project</th>
                      <th className="text-right p-3 font-medium text-gray-500">Amount</th>
                      <th className="text-left p-3 font-medium text-gray-500">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.map(a => (
                      <tr key={a.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{a.advance_date ? format(new Date(a.advance_date), 'dd/MM/yyyy') : '—'}</td>
                        <td className="p-3 font-medium">{a.employee?.full_name ?? '—'}</td>
                        <td className="p-3 text-gray-600">{a.project?.project_name ?? '—'}</td>
                        <td className="p-3 text-right font-medium text-red-600">{formatINR(a.amount_given)}</td>
                        <td className="p-3 text-gray-500">{a.reason ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {tab === 'muster' && (
        <MusterRollClient projects={projects} />
      )}

      {/* Add Employee Dialog */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Worker</DialogTitle></DialogHeader>
          <form action={(fd) => handleSubmit(fd, 'employee')} className="space-y-4">
            <input type="hidden" name="action" value="createEmployee" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <input name="full_name" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Role *</label>
                <select name="role" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Contact Number</label>
                <input name="contact_number" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Joining Date</label>
                <input type="date" name="joining_date" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Employment Type</label>
                <select name="employment_type" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="direct">Direct</option>
                  <option value="contractual">Contractual</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Wage Type</label>
                <select name="wage_type" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="daily_rate">Daily Rate</option>
                  <option value="monthly_salary">Monthly Salary</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Wage Rate (₹)</label>
                <input type="number" name="wage_rate" min="0" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select name="status" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Bank Account No.</label>
                <input name="bank_account_no" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">IFSC Code</label>
                <input name="bank_ifsc" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <input name="address" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEmployeeDialog(false)}>Cancel</Button>
              <Button type="submit">Add Worker</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Advance Dialog */}
      <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Give Advance</DialogTitle></DialogHeader>
          <form action={(fd) => handleSubmit(fd, 'advance')} className="space-y-4">
            <input type="hidden" name="action" value="createAdvance" />
            <div>
              <label className="text-sm font-medium">Employee *</label>
              <select name="employee_id" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select employee</option>
                {employees.filter(e => e.is_active).map(e => (
                  <option key={e.id} value={e.id}>{e.full_name} ({e.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Project *</label>
              <select name="project_id" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount (₹) *</label>
              <input type="number" name="amount_given" min="1" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Date *</label>
              <input type="date" name="advance_date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <input name="reason" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdvanceDialog(false)}>Cancel</Button>
              <Button type="submit">Give Advance</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}