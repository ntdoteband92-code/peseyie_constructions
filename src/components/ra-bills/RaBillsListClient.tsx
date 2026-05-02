'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  FileText,
  Plus,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  Trash2,
  Receipt,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { RaBillWithRelations } from '@/app/actions/ra-bills'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Clock },
  under_measurement: { label: 'Under Measurement', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  certified: { label: 'Certified', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  payment_released: { label: 'Payment Released', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  partially_paid: { label: 'Partially Paid', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
}

const DEDUCTION_LABELS: Record<string, string> = {
  retention: 'Retention Money',
  tds: 'Income Tax (TDS)',
  labour_cess: 'Labour Cess',
  royalty: 'Royalty',
  material_recovery: 'Material Recovery',
  other: 'Other Deduction',
}

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

export default function RaBillsListClient({
  bills,
  projectId,
  projectName,
}: {
  bills: RaBillWithRelations[]
  projectId: string
  projectName: string
}) {
  const router = useRouter()
  const [showPaymentDialog, setShowPaymentDialog] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentRef, setPaymentRef] = useState('')

  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => {
      const aNum = parseInt(a.bill_number.replace(/\D/g, '')) || 0
      const bNum = parseInt(b.bill_number.replace(/\D/g, '')) || 0
      return aNum - bNum
    })
  }, [bills])

  const totals = useMemo(() => {
    return {
      gross: bills.reduce((sum, b) => sum + (b.gross_amount ?? 0), 0),
      net: bills.reduce((sum, b) => sum + (b.net_payable ?? 0), 0),
      certified: bills.reduce((sum, b) => sum + (b.certified_amount ?? 0), 0),
      received: bills.reduce((sum, b) => {
        const payments = (b.ra_bill_payments ?? []) as { amount_received: number }[]
        return sum + payments.reduce((s, p) => s + p.amount_received, 0)
      }, 0),
      pending: bills.reduce((sum, b) => {
        const payments = (b.ra_bill_payments ?? []) as { amount_received: number }[]
        const received = payments.reduce((s, p) => s + p.amount_received, 0)
        return sum + ((b.net_payable ?? 0) - received)
      }, 0),
    }
  }, [bills])

  async function handleAddPayment(billId: string) {
    if (!paymentAmount || !paymentDate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/bills/${billId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_received: parseFloat(paymentAmount),
          payment_date: paymentDate,
          reference_no: paymentRef,
        }),
      })

      if (!res.ok) throw new Error('Failed to add payment')

      toast.success('Payment recorded successfully')
      setShowPaymentDialog(null)
      setPaymentAmount('')
      setPaymentDate('')
      setPaymentRef('')
      router.refresh()
    } catch {
      toast.error('Failed to add payment')
    }
  }

  async function handleDelete(billId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/bills/${billId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      toast.success('RA Bill deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete RA Bill')
    }
  }

  async function handleExportPDF(billId: string, billNumber: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/bills/${billId}/export`)
      if (!res.ok) throw new Error('Failed to fetch bill data')
      const bill = await res.json()
      const { pdf } = await import('@react-pdf/renderer')
      const { RaBillPDF } = await import('./RaBillPDF')
      const blob = await pdf(<RaBillPDF bill={bill} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `RA-Bill-${billNumber}-${bill.bill_date ?? 'draft'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch (err) {
      console.error(err)
      toast.error('PDF export failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">RA Bills</h2>
          <p className="text-sm text-gray-500">{projectName}</p>
        </div>
        <Button onClick={() => router.push(`/projects/${projectId}/bills/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          New RA Bill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Total Gross" value={formatINR(totals.gross)} color="text-gray-900" />
        <SummaryCard label="Total Net Payable" value={formatINR(totals.net)} color="text-blue-600" />
        <SummaryCard label="Certified Amount" value={formatINR(totals.certified)} color="text-purple-600" />
        <SummaryCard label="Total Received" value={formatINR(totals.received)} color="text-green-600" />
        <SummaryCard label="Pending Payment" value={formatINR(totals.pending)} color="text-amber-600" />
      </div>

      {/* Bills Table */}
      {sortedBills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Receipt className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No RA Bills yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first RA bill to start tracking payments
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/projects/${projectId}/bills/new`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New RA Bill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedBills.map((bill) => {
            const status = STATUS_CONFIG[bill.status] ?? STATUS_CONFIG.draft
            const StatusIcon = status.icon
            const deductions = (bill.ra_bill_deductions ?? []) as {
              deduction_type: string
              amount: number
              percentage: number | null
            }[]
            const payments = (bill.ra_bill_payments ?? []) as {
              amount_received: number
              payment_date: string
              reference_no: string | null
            }[]
            const totalReceived = payments.reduce((s, p) => s + p.amount_received, 0)
            const pendingAmount = (bill.net_payable ?? 0) - totalReceived

            return (
              <Card key={bill.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold">{bill.bill_number}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(bill.bill_date)}</span>
                      </div>

                      {bill.submitted_to && (
                        <p className="text-xs text-gray-500 mb-1">Submitted to: {bill.submitted_to}</p>
                      )}

                      {/* Financial breakdown */}
                      <div className="flex flex-wrap gap-4 text-xs mt-2">
                        <span className="text-gray-500">
                          Gross: <span className="font-medium text-gray-900">{formatINR(bill.gross_amount)}</span>
                        </span>
                        {deductions.length > 0 && (
                          <span className="text-gray-500">
                            Deductions: <span className="font-medium text-red-600">
                              -{formatINR(deductions.reduce((s, d) => s + d.amount, 0))}
                            </span>
                          </span>
                        )}
                        <span className="text-gray-500">
                          Net Payable: <span className="font-medium text-blue-600">{formatINR(bill.net_payable)}</span>
                        </span>
                        {bill.certified_amount != null && (
                          <span className="text-gray-500">
                            Certified: <span className="font-medium text-purple-600">{formatINR(bill.certified_amount)}</span>
                          </span>
                        )}
                        <span className="text-gray-500">
                          Received: <span className="font-medium text-green-600">{formatINR(totalReceived)}</span>
                        </span>
                        {pendingAmount > 0 && (
                          <span className="text-gray-500">
                            Pending: <span className="font-medium text-amber-600">{formatINR(pendingAmount)}</span>
                          </span>
                        )}
                      </div>

                      {/* Deductions detail */}
                      {deductions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {deductions.map((d) => (
                            <span key={d.deduction_type} className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {DEDUCTION_LABELS[d.deduction_type] ?? d.deduction_type}
                              {d.percentage ? ` @${d.percentage}%` : ''}: {formatINR(d.amount)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Payment history */}
                      {payments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {payments.map((p, i) => (
                            <span key={i} className="inline-flex items-center rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                              Paid {formatINR(p.amount_received)} on {formatDate(p.payment_date)}
                              {p.reference_no && ` (${p.reference_no})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/projects/${projectId}/bills/${bill.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {bill.status !== 'payment_released' && pendingAmount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowPaymentDialog(bill.id)
                            setPaymentAmount(pendingAmount.toFixed(2))
                            setPaymentDate(new Date().toISOString().split('T')[0])
                          }}
                        >
                          Add Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Payment Dialog */}
      <Dialog open={!!showPaymentDialog} onOpenChange={() => setShowPaymentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment_amount">Amount Received (₹)</Label>
              <Input
                id="payment_amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="payment_ref">UTR / Cheque No.</Label>
              <Input
                id="payment_ref"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Optional"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(null)}>
              Cancel
            </Button>
            <Button onClick={() => showPaymentDialog && handleAddPayment(showPaymentDialog)}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-lg font-semibold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}