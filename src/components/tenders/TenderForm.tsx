'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createTender, updateTender, convertTenderToProject, type TenderFormState } from '@/app/actions/tenders'
import type { TenderListItem } from '@/app/actions/tenders'

const STATUS_OPTIONS = [
  { value: 'identified', label: 'Identified' },
  { value: 'documents_purchased', label: 'Documents Purchased' },
  { value: 'bid_submitted', label: 'Bid Submitted' },
  { value: 'l1_lowest_bidder', label: 'L1 (Lowest Bidder)' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'lost', label: 'Lost' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

const EMD_STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'forfeited', label: 'Forfeited' },
]

const INITIAL_STATE: TenderFormState = null

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Saving...' : isEdit ? 'Update Tender' : 'Create Tender'}
    </Button>
  )
}

export default function TenderForm({
  tender,
  isEdit = false,
}: {
  tender?: TenderListItem
  isEdit?: boolean
}) {
  const router = useRouter()
  const action = isEdit && tender ? updateTender.bind(null, tender.id) : createTender
  const [state, formAction] = useActionState(action, INITIAL_STATE)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [convertState, convertAction] = useActionState(convertTenderToProject.bind(null, tender?.id ?? ''), INITIAL_STATE)

  if (state?.success) {
    toast.success(isEdit ? 'Tender updated' : 'Tender created')
    router.push('/tenders')
    router.refresh()
  }

  if (state?.error && !state.errors) {
    toast.error(state.error)
  }

  if (convertState?.success) {
    toast.success('Tender converted to project!')
    router.push('/projects')
    router.refresh()
  }

  if (convertState?.error) {
    toast.error(convertState.error)
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        {state?.errors && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {Object.entries(state.errors).map(([field, messages]) => (
              <p key={field}>{field}: {Array.isArray(messages) ? messages.join(', ') : messages}</p>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tender Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="tender_name">Tender Name *</Label>
                <Input id="tender_name" name="tender_name" defaultValue={tender?.tender_name ?? ''} required className="mt-1" />
              </div>

              <div>
                <Label htmlFor="nit_number">NIT Number</Label>
                <Input id="nit_number" name="nit_number" defaultValue={tender?.nit_number ?? ''} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="department">Issuing Department / Agency</Label>
                <Input id="department" name="department" defaultValue={tender?.department ?? ''} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="tender_value">Tender Value (₹)</Label>
                <Input id="tender_value" name="tender_value" type="number" min="0" step="1" defaultValue={tender?.tender_value ?? ''} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="duration_months">Estimated Duration (months)</Label>
                <Input id="duration_months" name="duration_months" type="number" min="0" defaultValue={tender?.duration_months ?? ''} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="submission_deadline">Submission Deadline</Label>
                <Input id="submission_deadline" name="submission_deadline" type="datetime-local" defaultValue={tender?.submission_deadline ? tender.submission_deadline.slice(0, 16) : ''} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="tender_fee">Tender Fee (₹)</Label>
                <Input id="tender_fee" name="tender_fee" type="number" min="0" step="1" defaultValue={tender?.tender_fee ?? ''} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">EMD & Bid Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="emd_amount">EMD Amount (₹)</Label>
                <Input id="emd_amount" name="emd_amount" type="number" min="0" step="1" defaultValue={tender?.emd_amount ?? ''} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="emd_status">EMD Status</Label>
                <select id="emd_status" name="emd_status" defaultValue={tender?.emd_status ?? ''} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select status</option>
                  {EMD_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="bid_submission_date">Bid Submission Date</Label>
                <Input id="bid_submission_date" name="bid_submission_date" type="datetime-local" defaultValue={tender?.bid_submission_date ? tender.bid_submission_date.slice(0, 16) : ''} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="bid_opening_date">Bid Opening Date</Label>
                <Input id="bid_opening_date" name="bid_opening_date" type="datetime-local" defaultValue={tender?.bid_opening_date ? tender.bid_opening_date.slice(0, 16) : ''} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="our_quoted_amount">Our Quoted Amount (₹)</Label>
                <Input id="our_quoted_amount" name="our_quoted_amount" type="number" min="0" step="1" defaultValue={tender?.our_quoted_amount ?? ''} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="rival_l1_amount">Rival L1 Amount (₹)</Label>
                <Input id="rival_l1_amount" name="rival_l1_amount" type="number" min="0" step="1" defaultValue={tender?.rival_l1_amount ?? ''} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status & Remarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" defaultValue={tender?.status ?? 'identified'} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <textarea id="remarks" name="remarks" rows={3} defaultValue={tender?.remarks ?? ''} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <SubmitButton isEdit={isEdit} />
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          {isEdit && tender?.status === 'awarded' && !tender?.converted_project_id && (
            <Button type="button" variant="default" onClick={() => setShowConvertDialog(true)} className="bg-green-600 hover:bg-green-700">
              Convert to Project
            </Button>
          )}
        </div>
      </form>

      {showConvertDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Convert to Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={convertAction} className="space-y-4">
                <p className="text-sm text-gray-500">
                  Create a new project from "{tender?.tender_name}" which has been awarded.
                </p>
                <div>
                  <Label htmlFor="contract_value">Contract Value (₹)</Label>
                  <Input id="contract_value" name="contract_value" type="number" min="0" step="1" defaultValue={tender?.tender_value ?? ''} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="contract_date">Contract Date</Label>
                  <Input id="contract_date" name="contract_date" type="date" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" name="start_date" type="date" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="expected_end_date">Expected End Date</Label>
                  <Input id="expected_end_date" name="expected_end_date" type="date" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="location_district">District</Label>
                  <Input id="location_district" name="location_district" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="location_state">State</Label>
                  <Input id="location_state" name="location_state" defaultValue="Nagaland" className="mt-1" />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">Convert</Button>
                  <Button type="button" variant="outline" onClick={() => setShowConvertDialog(false)} className="flex-1">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
