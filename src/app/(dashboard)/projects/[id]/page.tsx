import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getProject, getProjectFinancialSummary, getMyRole } from '@/app/actions/projects'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  HardHat,
  Building2,
  Edit,
  ArrowRight,
  FileText,
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const project = await getProject(id).catch(() => null)
  return { title: project ? project.project_name : 'Project' }
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  ongoing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
  completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  on_hold: { bg: 'bg-amber-100', text: 'text-amber-800', icon: AlertTriangle },
  defect_liability: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Clock },
  terminated: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
}

const PROJECT_TYPES = [
  'Road Construction',
  'Blasting',
  'Earthwork',
  'Structural',
  'Drainage',
  'Bridge',
  'Building',
  'Other',
]

function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy')
  } catch {
    return '—'
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [project, finSummary, role] = await Promise.all([
    getProject(id).catch(() => null),
    getProjectFinancialSummary(id).catch(() => null),
    getMyRole(),
  ])

  if (!project) notFound()

  const statusInfo = STATUS_COLORS[project.status] ?? STATUS_COLORS.ongoing
  const StatusIcon = statusInfo.icon
  const projectTypes = Array.isArray(project.project_type) ? project.project_type : []
  const canEdit = role && ['admin', 'manager', 'accountant'].includes(role)
  const hasBlasting = projectTypes.includes('Blasting')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.project_name}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                <StatusIcon className="h-3 w-3" />
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              {project.contract_number && (
                <span>Contract: {project.contract_number}</span>
              )}
              {project.client_name && (
                <span>{project.client_name}</span>
              )}
            </div>
          </div>
        </div>
        {canEdit && (
          <Link href={`/projects/${id}/edit`} className={buttonVariants({ variant: "outline" })}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-10 flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ra-bills">RA Bills</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="attendance">Labour & Attendance</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="subcontractors">Subcontractors</TabsTrigger>
          {hasBlasting && (
            <TabsTrigger value="blasting">Blasting Ops</TabsTrigger>
          )}
          <TabsTrigger value="diary">Site Diary</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Financial Summary Card */}
          {finSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Contract Value</p>
                    <p className="text-lg font-semibold">{formatINR(finSummary.contract_value)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Total Billed</p>
                    <p className="text-lg font-semibold text-blue-600">{formatINR(finSummary.total_billed)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Total Received</p>
                    <p className="text-lg font-semibold text-green-600">{formatINR(finSummary.total_received)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Retention Held</p>
                    <p className="text-lg font-semibold text-amber-600">{formatINR(finSummary.retention_held)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="text-lg font-semibold text-red-600">{formatINR(finSummary.total_spent)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Gross Margin</p>
                    <p className={`text-lg font-semibold ${(finSummary.gross_margin_pct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {finSummary.gross_margin_pct ?? 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {project.client_name && (
                  <div className="flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 w-32">Client</span>
                    <span>{project.client_name}</span>
                  </div>
                )}
                {project.client_contact_person && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 w-32">Contact</span>
                    <span>{project.client_contact_person}</span>
                  </div>
                )}
                {project.client_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 w-32">Phone</span>
                    <span>{project.client_phone}</span>
                  </div>
                )}
                {(project.location_district || project.location_state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 w-32">Location</span>
                    <span>{[project.location_district, project.location_state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 w-32">Contract Date</span>
                  <span>{formatDate(project.contract_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 w-32">Duration</span>
                  <span>{formatDate(project.start_date)} → {formatDate(project.actual_end_date ?? project.expected_end_date)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  {projectTypes.map((type: any) => (
                    <span
                      key={type}
                      className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                {project.scope_of_work && (
                  <div>
                    <p className="text-gray-500 mb-1">Scope of Work</p>
                    <p className="text-gray-700">{project.scope_of_work}</p>
                  </div>
                )}
                {project.security_deposit && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Security Deposit:</span>
                    <span className="font-medium">{formatINR(project.security_deposit)}</span>
                    {project.security_deposit_status && (
                      <span className="text-xs text-gray-500">({project.security_deposit_status})</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLinkCard
              href={`/projects/${id}/bills`}
              icon={FileText}
              title="RA Bills"
              description="Running account bills and payments"
              color="bg-blue-50 border-blue-200"
            />
            <QuickLinkCard
              href={`/projects/${id}?tab=expenses`}
              icon={IndianRupee}
              title="Expenses"
              description="Log expenses and track spending"
              color="bg-red-50 border-red-200"
            />
            <QuickLinkCard
              href={`/projects/${id}?tab=attendance`}
              icon={Calendar}
              title="Attendance"
              description="Muster roll and wage calculation"
              color="bg-green-50 border-green-200"
            />
            <QuickLinkCard
              href={`/projects/${id}?tab=diary`}
              icon={FileText}
              title="Site Diary"
              description="Daily log entries and reports"
              color="bg-purple-50 border-purple-200"
            />
          </div>
        </TabsContent>

        {/* Placeholder content for other tabs */}
        {['ra-bills', 'expenses', 'attendance', 'equipment', 'materials', 'subcontractors', 'blasting', 'diary', 'documents'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <PlaceholderCard tab={tab} projectId={id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function QuickLinkCard({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string
  icon: React.ElementType
  title: string
  description: string
  color: string
}) {
  return (
    <Link href={href}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer border ${color}`}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-white/50 p-2">
            <Icon className="h-5 w-5 text-gray-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-gray-500 truncate">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </CardContent>
      </Card>
    </Link>
  )
}

function PlaceholderCard({ tab, projectId }: { tab: string; projectId: string }) {
  const tabInfo: Record<string, { title: string; description: string }> = {
    'ra-bills': {
      title: 'RA Bills',
      description: 'Running Account Bills for this project',
    },
    expenses: {
      title: 'Expenses',
      description: 'Expenses for this project',
    },
    attendance: {
      title: 'Labour & Attendance',
      description: 'Muster roll and attendance tracking',
    },
    equipment: {
      title: 'Equipment Deployed',
      description: 'Equipment assigned to this project',
    },
    materials: {
      title: 'Materials',
      description: 'Material movements for this project',
    },
    subcontractors: {
      title: 'Subcontractors',
      description: 'Subcontractor work orders and payments',
    },
    blasting: {
      title: 'Blasting Operations',
      description: 'Blasting shot records and explosives log',
    },
    diary: {
      title: 'Site Diary',
      description: 'Daily site log entries',
    },
    documents: {
      title: 'Documents',
      description: 'Project documents and photos',
    },
  }

  const info = tabInfo[tab] ?? { title: tab, description: '' }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-sm font-medium text-gray-900">{info.title}</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm">{info.description}</p>
        <Link href={`/projects/${projectId}?tab=${tab}`} className={buttonVariants({ variant: "outline", className: "mt-4" })}>
            Go to {info.title} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
      </CardContent>
    </Card>
  )
}