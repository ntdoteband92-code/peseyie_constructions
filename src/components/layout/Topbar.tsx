'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/app/actions/auth'
import { getInitials } from '@/lib/utils'
import { LogOut, Settings, ChevronRight, ChevronDown } from 'lucide-react'
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
  const router = useRouter()
  const { user, profile, role, signOut: authSignOut } = useAuth()
  const breadcrumbs = getBreadcrumbs(pathname)
  const displayName = profile?.full_name ?? user?.email ?? 'User'

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    setIsOpen(false)
    await authSignOut()
    router.push('/auth/login')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 h-14 shrink-0 border-b"
      style={{
        background: 'rgba(255,255,255,0.98)',
        borderColor: 'rgba(0,0,0,0.06)',
      }}
    >
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0 ml-10 md:ml-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: '#94a3b8' }} />
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

      <div className="flex items-center gap-3 shrink-0" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 outline-none cursor-pointer"
            aria-label="User menu"
            aria-expanded={isOpen}
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
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {isOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border py-1 z-50"
              style={{ borderColor: 'rgba(0,0,0,0.08)' }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/settings')
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}