'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createProject, updateProject, type ProjectFormState } from '@/app/actions/projects'
import type { ProjectListItem } from '@/app/actions/projects'

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

const STATUS_OPTIONS = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'defect_liability', label: 'Defect Liability Period' },
  { value: 'terminated', label: 'Terminated' },
]

const INITIAL_STATE: ProjectFormState = null

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
    </Button>
  )
}

export default function ProjectForm({
  project,
  isEdit = false,
}: {
  project?: ProjectListItem
  isEdit?: boolean
}) {
  const router = useRouter()
  const action = isEdit && project ? updateProject.bind(null, project.id) : createProject
  const [state, formAction] = useActionState(action, INITIAL_STATE)

  if (state?.success) {
    toast.success(isEdit ? 'Project updated' : 'Project created')
    router.push('/projects')
    router.refresh()
  }

  if (state?.error && !state.errors) {
    toast.error(state.error)
  }

  const selectedTypes = project?.project_type ?? []

  return (
    <form action={formAction} className="space-y-6">
      {state?.errors && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {Object.entries(state.errors).map(([field, messages]) => (
            <p key={field}>{field}: {Array.isArray(messages) ? messages.join(', ') : messages}</p>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Name */}
        <div className="md:col-span-2">
          <Label htmlFor="project_name">Project Name *</Label>
          <Input
            id="project_name"
            name="project_name"
            defaultValue={project?.project_name ?? ''}
            required
            className="mt-1"
          />
        </div>

        {/* Contract Number */}
        <div>
          <Label htmlFor="contract_number">Contract Number</Label>
          <Input
            id="contract_number"
            name="contract_number"
            defaultValue={project?.contract_number ?? ''}
            className="mt-1"
          />
        </div>

        {/* Client Name */}
        <div>
          <Label htmlFor="client_name">Client / Department</Label>
          <Input
            id="client_name"
            name="client_name"
            defaultValue={project?.client_name ?? ''}
            className="mt-1"
          />
        </div>

        {/* Client Contact Person */}
        <div>
          <Label htmlFor="client_contact_person">Contact Person</Label>
          <Input
            id="client_contact_person"
            name="client_contact_person"
            defaultValue={project?.client_contact_person ?? ''}
            className="mt-1"
          />
        </div>

        {/* Client Phone */}
        <div>
          <Label htmlFor="client_phone">Contact Phone</Label>
          <Input
            id="client_phone"
            name="client_phone"
            defaultValue={project?.client_phone ?? ''}
            className="mt-1"
          />
        </div>

        {/* Contract Value */}
        <div>
          <Label htmlFor="contract_value">Contract Value (₹)</Label>
          <Input
            id="contract_value"
            name="contract_value"
            type="number"
            min="0"
            step="1"
            defaultValue={project?.contract_value ?? 0}
            className="mt-1"
          />
        </div>

        {/* Contract Date */}
        <div>
          <Label htmlFor="contract_date">Contract Date</Label>
          <Input
            id="contract_date"
            name="contract_date"
            type="date"
            defaultValue={project?.contract_date ?? ''}
            className="mt-1"
          />
        </div>

        {/* Start Date */}
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={project?.start_date ?? ''}
            className="mt-1"
          />
        </div>

        {/* Expected End Date */}
        <div>
          <Label htmlFor="expected_end_date">Expected Completion</Label>
          <Input
            id="expected_end_date"
            name="expected_end_date"
            type="date"
            defaultValue={project?.expected_end_date ?? ''}
            className="mt-1"
          />
        </div>

        {/* Actual End Date */}
        <div>
          <Label htmlFor="actual_end_date">Actual Completion</Label>
          <Input
            id="actual_end_date"
            name="actual_end_date"
            type="date"
            defaultValue={project?.actual_end_date ?? ''}
            className="mt-1"
          />
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={project?.status ?? 'ongoing'}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Security Deposit */}
        <div>
          <Label htmlFor="security_deposit">Security Deposit (₹)</Label>
          <Input
            id="security_deposit"
            name="security_deposit"
            type="number"
            min="0"
            step="1"
            defaultValue={project?.security_deposit ?? ''}
            className="mt-1"
          />
        </div>

        {/* Security Deposit Status */}
        <div>
          <Label htmlFor="security_deposit_status">SD Status</Label>
          <Input
            id="security_deposit_status"
            name="security_deposit_status"
            defaultValue={project?.security_deposit_status ?? ''}
            placeholder="Submitted / Released"
            className="mt-1"
          />
        </div>

        {/* Location District */}
        <div>
          <Label htmlFor="location_district">District</Label>
          <Input
            id="location_district"
            name="location_district"
            defaultValue={project?.location_district ?? ''}
            className="mt-1"
          />
        </div>

        {/* Location State */}
        <div>
          <Label htmlFor="location_state">State</Label>
          <Input
            id="location_state"
            name="location_state"
            defaultValue={project?.location_state ?? ''}
            className="mt-1"
          />
        </div>

        {/* Project Types */}
        <div className="md:col-span-2">
          <Label>Project Types</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROJECT_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="project_type"
                  value={type}
                  defaultChecked={selectedTypes.includes(type)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Scope of Work */}
        <div className="md:col-span-2">
          <Label htmlFor="scope_of_work">Scope of Work</Label>
          <textarea
            id="scope_of_work"
            name="scope_of_work"
            rows={4}
            defaultValue={project?.scope_of_work ?? ''}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SubmitButton isEdit={isEdit} />
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}