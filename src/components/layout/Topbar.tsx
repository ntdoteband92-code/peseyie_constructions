'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/app/actions/auth'
import { getInitials } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, ChevronRight } from 'lucide-react'
import Link from 'next/link'

function getBreadcrumbs(pathname: string) {
  if (pathname === '/') return [{ label: 'Dashboard', href: '/' }]
  const segments = pathname.split('/').filter(Boolean)
  const crumbs = [{ label: 'Home', href: '/' }]
  let path = ''
  for (const seg of segments) {
    path += `/${seg}`
    const label = seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    // Skip UUIDs in breadcrumbs
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(seg)) {
      crumbs.push({ label: 'Detail', href: path })
    } else {
      crumbs.push({ label: label, href: path })
    }
  }
  return crumbs
}

export default function Topbar() {
  const pathname = usePathname()
  const { user, profile, role } = useAuth()
  const breadcrumbs = getBreadcrumbs(pathname)
  const displayName = profile?.full_name ?? user?.email ?? 'User'

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 h-14 shrink-0 border-b"
      style={{
        background: 'rgba(255,255,255,0.98)',
        borderColor: 'rgba(0,0,0,0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0 ml-10 md:ml-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && (
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: '#94a3b8' }}
              />
            )}
            {i === breadcrumbs.length - 1 ? (
              <span className="text-sm font-semibold text-gray-900 truncate">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors truncate"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

{/* Right side: user avatar dropdown */}
      <div className="flex items-center gap-3 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 outline-none cursor-pointer"
            aria-label="User menu"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#1a1f2e',
              }}
            >
              {getInitials(displayName)}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                {displayName}
              </p>
              {role && (
                <p className="text-xs text-gray-400 capitalize">{role}</p>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Link href="/settings" className="flex items-center w-full">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
