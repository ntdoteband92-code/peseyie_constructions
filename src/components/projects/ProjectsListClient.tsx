'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  HardHat,
  Plus,
  Search,
  MapPin,
  Phone,
  Calendar,
  IndianRupee,
  ArrowRight,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { ProjectListItem } from '@/app/actions/projects'

const STATUS_COLORS: Record<string, string> = {
  ongoing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  on_hold: 'bg-amber-100 text-amber-800',
  defect_liability: 'bg-purple-100 text-purple-800',
  terminated: 'bg-red-100 text-red-800',
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

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '?'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy')
  } catch {
    return '?'
  }
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: ProjectListItem
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const projectTypes = Array.isArray(project.project_type)
    ? project.project_type
    : []

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {project.project_name}
              </CardTitle>
              {project.contract_number && (
                <CardDescription className="text-xs">
                  Contract: {project.contract_number}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {project.status.replace('_', ' ')}
              </span>
              <DropdownMenu>
<DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.client_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <HardHat className="h-3.5 w-3.5 text-gray-400" />
              <span className="truncate">{project.client_name}</span>
            </div>
          )}

          {(project.location_district || project.location_state) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span className="truncate">
                {[project.location_district, project.location_state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {project.client_phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              <span>{project.client_phone}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>
              {formatDate(project.start_date)}
              {(project.expected_end_date || project.actual_end_date) && (
                <> ? {formatDate(project.actual_end_date ?? project.expected_end_date)}</>
              )}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 pt-2">
            {projectTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {type}
              </span>
            ))}
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
              <IndianRupee className="h-4 w-4 text-amber-600" />
              <span>{formatINR(project.contract_value)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              View <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete "{project.project_name}". The project
              and all associated data will be hidden but not permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(project.id)
                setShowDeleteDialog(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function ProjectsListClient({
  projects,
}: {
  projects: ProjectListItem[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.project_name.toLowerCase().includes(search.toLowerCase()) ||
        p.contract_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.location_district?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter

      const matchesType =
        typeFilter === 'all' ||
        (Array.isArray(p.project_type) && p.project_type.includes(typeFilter))

      return matchesSearch && matchesStatus && matchesType
    })
  }, [projects, search, statusFilter, typeFilter])

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Project deleted successfully')
      router.refresh()
    } catch {
      toast.error('Failed to delete project')
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length }
    for (const p of projects) {
      counts[p.status] = (counts[p.status] ?? 0) + 1
    }
    return counts
  }, [projects])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        <Button onClick={() => router.push('/projects/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects, contracts, clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Status ({statusCounts.all})</option>
          <option value="ongoing">Ongoing ({statusCounts.ongoing ?? 0})</option>
          <option value="completed">Completed ({statusCounts.completed ?? 0})</option>
          <option value="on_hold">On Hold ({statusCounts.on_hold ?? 0})</option>
          <option value="defect_liability">Defect Liability ({statusCounts.defect_liability ?? 0})</option>
          <option value="terminated">Terminated ({statusCounts.terminated ?? 0})</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          {PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <HardHat className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {search || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first project'}
          </p>
          {!search && statusFilter === 'all' && typeFilter === 'all' && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/projects/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
