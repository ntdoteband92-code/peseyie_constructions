'use client'

import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
  LayoutDashboard,
  TrendingUp,
  IndianRupee,
  HardHat,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type DashboardData = {
  activeProjectsCount: number
  contractValueSum: number
  equipmentCount: number
  billedThisMonth: number
  receivedThisMonth: number
  pendingRetention: number
  statusCounts: Record<string, number>
  topCategories: { category: string; amount: number }[]
  cashflow: { month: string; income: number; expenses: number }[]
  recentActivity: {
    id: string
    entry_date: string
    weather: string
    work_summary: string
    project?: { project_name: string } | null
    created_by_user?: { full_name: string } | null
  }[]
  projects: { id: string; project_name: string; status: string; contract_value: number }[]
}

const CHART_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444']

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatINRCompact(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Ongoing',
  completed: 'Completed',
  on_hold: 'On Hold',
  defect_liability: 'Defect Liability',
  terminated: 'Terminated',
}

const STATUS_COLORS: Record<string, string> = {
  ongoing: '#3b82f6',
  completed: '#10b981',
  on_hold: '#f59e0b',
  defect_liability: '#8b5cf6',
  terminated: '#ef4444',
}

export default function DashboardClient({ data }: { data: DashboardData | null }) {
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <LayoutDashboard className="h-5 w-5 text-[#1a1f2e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  const pieData = Object.entries(data.statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    value: count,
    color: STATUS_COLORS[status] ?? '#6b7280',
  }))

  const cashflowData = data.cashflow.map(c => ({
    month: c.month,
    Income: c.income,
    Expenses: c.expenses,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <LayoutDashboard className="h-5 w-5 text-[#1a1f2e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Operations overview — Peseyie Constructions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Active Projects"
          value={data.activeProjectsCount.toString()}
          subValue={formatINRCompact(data.contractValueSum)}
          icon={HardHat}
          color="bg-blue-50 border-blue-200"
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="Billed This Month"
          value={formatINRCompact(data.billedThisMonth)}
          subValue={`Received: ${formatINRCompact(data.receivedThisMonth)}`}
          icon={IndianRupee}
          color="bg-green-50 border-green-200"
          iconColor="text-green-600"
        />
        <SummaryCard
          title="Pending Retention"
          value={formatINRCompact(data.pendingRetention)}
          icon={Clock}
          color="bg-amber-50 border-amber-200"
          iconColor="text-amber-600"
        />
        <SummaryCard
          title="Equipment On Ground"
          value={data.equipmentCount.toString()}
          icon={Activity}
          color="bg-purple-50 border-purple-200"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cashflow Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              Monthly Income vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cashflowData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashflowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={formatINRCompact} />
                    <Tooltip formatter={(value: any) => formatINR(value)} />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No cashflow data available</div>
            )}
          </CardContent>
        </Card>

        {/* Project Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                      <span className="ml-auto font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No project data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top 5 Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topCategories.length > 0 ? (
              <div className="space-y-3">
                {data.topCategories.map((cat, i) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize">{cat.category.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{formatINRCompact(cat.amount)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (cat.amount / (data.topCategories[0]?.amount ?? 1)) * 100)}%`,
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No expense data</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Projects</CardTitle>
            <Link href="/projects" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.projects.length > 0 ? (
              <div className="space-y-3">
                {data.projects.slice(0, 6).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <HardHat className="h-4 w-4 text-[#1a1f2e]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.project_name}</p>
                        <p className="text-xs text-gray-500">{STATUS_LABELS[project.status] ?? project.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatINRCompact(project.contract_value)}</p>
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No projects yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Site Diary Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.slice(0, 8).map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.project?.project_name ?? 'Unknown Project'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {entry.entry_date ? formatDistanceToNow(new Date(entry.entry_date), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {entry.work_summary || 'No work summary'}
                    </p>
                    {entry.created_by_user && (
                      <p className="text-xs text-gray-400 mt-1">
                        By {entry.created_by_user.full_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  subValue,
  icon: Icon,
  color,
  iconColor,
}: {
  title: string
  value: string
  subValue?: string
  icon: React.ElementType
  color: string
  iconColor: string
}) {
  return (
    <Card className={color}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="w-12 h-12 rounded-xl bg-white/50 flex items-center justify-center">
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  )
}