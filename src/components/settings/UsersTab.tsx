'use client'

import { useState } from 'react'
import { useActionState, useEffect } from 'react'
import { deactivateUser, updateUserRole } from '@/app/actions/settings'
import { toast } from 'sonner'
import { Users, MoreHorizontal, UserX, UserCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import InviteUserDialog from '@/components/settings/InviteUserDialog'
import { formatDate, getInitials } from '@/lib/utils'
import type { AppRole } from '@/lib/supabase/types'

type UserWithRole = {
  id: string
  full_name: string
  phone: string | null
  is_active: boolean
  created_at: string
  user_roles: { role: AppRole }[] | null
}

function UserRow({
  user,
  currentUserId,
}: {
  user: UserWithRole
  currentUserId: string
}) {
  const role = (user.user_roles?.[0]?.role ?? 'viewer') as AppRole
  const isSelf = user.id === currentUserId
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const [deactivateState, deactivateAction] = useActionState(deactivateUser, null)
  const [roleState, roleAction] = useActionState(updateUserRole, null)

  useEffect(() => {
    if (deactivateState?.success)
      toast.success(user.is_active ? 'User deactivated.' : 'User reactivated.')
    if (deactivateState?.error) toast.error(deactivateState.error)
  }, [deactivateState, user.is_active])

  useEffect(() => {
    if (roleState?.success) toast.success('Role updated.')
    if (roleState?.error) toast.error(roleState.error)
  }, [roleState])

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
        {/* Avatar + Name */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: user.is_active
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : '#e5e7eb',
                color: user.is_active ? '#1a1f2e' : '#9ca3af',
              }}
            >
              {getInitials(user.full_name)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                {user.full_name}
                {isSelf && (
                  <span className="text-xs text-gray-400 font-normal">(you)</span>
                )}
              </p>
              <p className="text-xs text-gray-400">
                Joined {formatDate(user.created_at)}
              </p>
            </div>
          </div>
        </td>

        {/* Role selector */}
        <td className="px-4 py-3.5">
          <form action={roleAction}>
            <input type="hidden" name="user_id" value={user.id} />
            <Select
              name="role"
              defaultValue={role}
              onValueChange={() => {
                const form = document.querySelector(`form[data-user="${user.id}"]`) as HTMLFormElement
                form?.requestSubmit()
              }}
              disabled={isSelf}
            >
              <SelectTrigger className="h-8 w-36 text-xs" data-user={user.id}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['admin', 'manager', 'accountant', 'supervisor', 'viewer'] as AppRole[]).map(
                  (r) => (
                    <SelectItem key={r} value={r} className="text-xs capitalize">
                      {r}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </form>
        </td>

        {/* Status badge */}
        <td className="px-4 py-3.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              user.is_active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5 text-right">
          {!isSelf && (
            <DropdownMenu>
              <DropdownMenuTrigger
                id={`user-actions-${user.id}`}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors ml-auto"
                aria-label="User actions"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setConfirmDeactivate(true)}
                  className={user.is_active ? 'text-red-600 focus:text-red-600' : 'text-emerald-600 focus:text-emerald-600'}
                >
                  {user.is_active ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" /> Reactivate
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </td>
      </tr>

      {/* Confirm deactivate dialog */}
      <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.is_active ? 'Deactivate' : 'Reactivate'} {user.full_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.is_active
                ? 'This will prevent the user from logging in. Their data will not be deleted. You can reactivate at any time.'
                : 'This will restore the user\'s ability to log in.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={deactivateAction}>
              <input type="hidden" name="user_id" value={user.id} />
              <input type="hidden" name="activate" value={String(!user.is_active)} />
              <AlertDialogAction
                type="submit"
                className={user.is_active ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {user.is_active ? 'Deactivate' : 'Reactivate'}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function UsersTab({
  users,
  currentUserId,
}: {
  users: UserWithRole[]
  currentUserId: string
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription className="mt-0.5">
                {users.length} user{users.length !== 1 ? 's' : ''} — invite new users and manage roles.
              </CardDescription>
            </div>
          </div>
          <InviteUserDialog />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: '#fef3c7' }}
            >
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">No users yet</p>
            <p className="text-sm text-gray-500 max-w-xs">
              Invite team members to give them access to the system.
            </p>
            <InviteUserDialog />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
