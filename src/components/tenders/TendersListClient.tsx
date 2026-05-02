'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  FileText,
  Plus,
  Search,
  Building2,
  Calendar,
  IndianRupee,
  ArrowRight,
  MoreHorizontal,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
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
import { toast } from 'sonner'
import type { TenderListItem } from '@/app/actions/tenders'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  identified: { label: 'Identified', color: 'bg-gray-100 text-gray-700', icon: FileText },
  documents_purchased: { label: 'Documents Purchased', color: 'bg-blue-100 text-blue-700', icon: FileText },
  bid_submitted: { label: 'Bid Submitted', color: 'bg-amber-100 text-amber-700', icon: Clock },
  l1_lowest_bidder: { label: 'L1 (Lowest Bidder)', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  awarded: { label: 'Awarded', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700', icon: XCircle },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-500', icon: XCircle },
}

function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '—'
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

export default function TendersListClient({
  tenders,
}: {
  tenders: TenderListItem[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredTenders = useMemo(() => {
    return tenders.filter((t) => {
      const matchesSearch =
        search === '' ||
        t.tender_name.toLowerCase().includes(search.toLowerCase()) ||
        t.nit_number?.toLowerCase().includes(search.toLowerCase()) ||
        t.department?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [tenders, search, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tenders.length }
    for (const t of tenders) {
      counts[t.status] = (counts[t.status] ?? 0) + 1
    }
    return counts
  }, [tenders])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenders</h1>
          <p className="text-sm text-gray-500">
            {filteredTenders.length} of {tenders.length} tenders
          </p>
        </div>
        <Button onClick={() => router.push('/tenders/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Tender
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tenders, NIT numbers, departments..."
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
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label} ({statusCounts[key] ?? 0})
            </option>
          ))}
        </select>
      </div>

      {/* Tenders Grid */}
      {filteredTenders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No tenders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first tender'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTenders.map((tender) => {
            const status = STATUS_CONFIG[tender.status] ?? STATUS_CONFIG.identified
            const StatusIcon = status.icon

            return (
              <Card key={tender.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {tender.tender_name}
                      </CardTitle>
                      {tender.nit_number && (
                        <CardDescription className="text-xs">
                          NIT: {tender.nit_number}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/tenders/${tender.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/tenders/${tender.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {tender.department && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{tender.department}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-600">
                    <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {formatINR(tender.tender_value)}
                    </span>
                    {tender.tender_value && tender.our_quoted_amount && (
                      <span className="text-xs text-gray-500">
                        (Quoted: {formatINR(tender.our_quoted_amount)})
                      </span>
                    )}
                  </div>

                  {tender.submission_deadline && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>Deadline: {formatDate(tender.submission_deadline)}</span>
                    </div>
                  )}

                  {tender.emd_amount && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>EMD: {formatINR(tender.emd_amount)}</span>
                      {tender.emd_status && (
                        <span className={`rounded px-1.5 py-0.5 text-xs ${
                          tender.emd_status === 'paid' ? 'bg-blue-50 text-blue-600' :
                          tender.emd_status === 'refunded' ? 'bg-green-50 text-green-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {tender.emd_status}
                        </span>
                      )}
                    </div>
                  )}

                  {tender.converted_project_id && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Converted to Project
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}