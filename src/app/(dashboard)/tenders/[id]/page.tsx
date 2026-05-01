import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getTender, updateTenderStatus } from '@/app/actions/tenders'
import {
  ArrowLeft,
  Building2,
  Calendar,
  IndianRupee,
  Edit,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const tender = await getTender(id).catch(() => null)
  return { title: tender ? tender.tender_name : 'Tender' }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  identified: { label: 'Identified', color: 'bg-gray-100 text-gray-700', icon: FileText },
  documents_purchased: { label: 'Documents Purchased', color: 'bg-blue-100 text-blue-700', icon: FileText },
  bid_submitted: { label: 'Bid Submitted', color: 'bg-amber-100 text-amber-700', icon: Clock },
  l1_lowest_bidder: { label: 'L1 (Lowest Bidder)', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  awarded: { label: 'Awarded', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700', icon: XCircle },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-500', icon: XCircle },
}

function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'dd/MM/yyyy') } catch { return '—' }
}

export default async function TenderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const tender = await getTender(id).catch(() => null)
  if (!tender) notFound()

  const status = STATUS_CONFIG[tender.status] ?? STATUS_CONFIG.identified
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/tenders">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{tender.tender_name}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                <StatusIcon className="h-3 w-3" />{status.label}
              </span>
            </div>
            {tender.nit_number && <p className="text-sm text-gray-500 mt-1">NIT: {tender.nit_number}</p>}
          </div>
        </div>
        <Link href={`/tenders/${id}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="mr-2 h-4 w-4" />Edit</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Tender Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tender.department && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 w-36">Department</span>
                <span>{tender.department}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500 w-36">Tender Value</span>
              <span className="font-medium">{formatINR(tender.tender_value)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500 w-36">Duration</span>
              <span>{tender.duration_months ? `${tender.duration_months} months` : '—'}</span>
            </div>
            {tender.tender_fee && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-36">Tender Fee</span>
                <span>{formatINR(tender.tender_fee)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Bid & EMD Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-36">Our Quoted Amount</span>
              <span className="font-medium text-blue-600">{formatINR(tender.our_quoted_amount)}</span>
            </div>
            {tender.rival_l1_amount && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-36">Rival L1 Amount</span>
                <span className="text-red-600">{formatINR(tender.rival_l1_amount)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-36">EMD Amount</span>
              <span>{formatINR(tender.emd_amount)}</span>
            </div>
            {tender.emd_status && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-36">EMD Status</span>
                <span className={`rounded px-2 py-0.5 text-xs ${
                  tender.emd_status === 'paid' ? 'bg-blue-50 text-blue-600' :
                  tender.emd_status === 'refunded' ? 'bg-green-50 text-green-600' :
                  'bg-red-50 text-red-600'
                }`}>{tender.emd_status}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Important Dates</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-36">Submission Deadline</span>
              <span>{formatDate(tender.submission_deadline)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-36">Bid Submission</span>
              <span>{formatDate(tender.bid_submission_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-36">Bid Opening</span>
              <span>{formatDate(tender.bid_opening_date)}</span>
            </div>
            {tender.emd_refund_date && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-36">EMD Refund Date</span>
                <span>{formatDate(tender.emd_refund_date)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Remarks</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{tender.remarks || 'No remarks'}</p>
          </CardContent>
        </Card>
      </div>

      {tender.converted_project_id && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">
              This tender has been converted to a project.{' '}
              <Link href={`/projects/${tender.converted_project_id}`} className="font-medium underline">View Project →</Link>
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  )
}