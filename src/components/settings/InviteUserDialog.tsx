'use client'

import { useState, useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { inviteUser, type InviteUserState } from '@/app/actions/settings'
import { toast } from 'sonner'
import { UserPlus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      id="invite-user-submit-btn"
      className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 px-4 text-sm font-semibold transition-all disabled:opacity-60"
      style={{
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#1a1f2e',
      }}
    >
      {pending ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Sending Invite…</>
      ) : (
        <><UserPlus className="h-4 w-4" /> Send Invite Email</>
      )}
    </button>
  )
}

export default function InviteUserDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState<InviteUserState, FormData>(inviteUser, null)

  useEffect(() => {
    if (state?.success) {
      toast.success('Invite email sent! The user will receive a link to set their password.')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false)
    }
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        id="open-invite-user-dialog-btn"
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
        style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#1a1f2e',
        }}
      >
        <UserPlus className="h-4 w-4" />
        Invite User
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            They&apos;ll receive an email with a link to set their password and log in.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="invite-full-name">Full Name</Label>
            <Input
              id="invite-full-name"
              name="full_name"
              placeholder="e.g. Vikho Swü"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email Address *</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role *</Label>
            <Select name="role" required defaultValue="viewer">
              <SelectTrigger id="invite-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — Full access including user management</SelectItem>
                <SelectItem value="manager">Manager — Full access except user management</SelectItem>
                <SelectItem value="accountant">Accountant — Finance modules + read-only elsewhere</SelectItem>
                <SelectItem value="supervisor">Supervisor — Field ops (attendance, fuel, diary, materials)</SelectItem>
                <SelectItem value="viewer">Viewer — Read-only across all modules</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state?.error && (
            <div className="rounded-lg px-3 py-2.5 text-sm bg-red-50 border border-red-200 text-red-700">
              {state.error}
            </div>
          )}

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  )
}
