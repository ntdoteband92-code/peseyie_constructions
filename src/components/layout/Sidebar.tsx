'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  HardHat,
  Banknote,
  Truck,
  Users,
  Package,
  Flame,
  Handshake,
  BookOpen,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { canRead } from '@/lib/permissions'

import type { AppRole } from '@/lib/supabase/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  module: string
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, module: 'projects' },
  { label: 'Tenders', href: '/tenders', icon: FileText, module: 'tenders' },
  { label: 'Projects', href: '/projects', icon: HardHat, module: 'projects' },
  { label: 'Financials', href: '/financials', icon: Banknote, module: 'expenses' },
  { label: 'Equipment', href: '/equipment', icon: Truck, module: 'equipment' },
  { label: 'HR & Payroll', href: '/hr', icon: Users, module: 'hr' },
  { label: 'Materials', href: '/materials', icon: Package, module: 'materials' },
  { label: 'Blasting', href: '/blasting', icon: Flame, module: 'blasting' },
  { label: 'Subcontractors', href: '/subcontractors', icon: Handshake, module: 'subcontractors' },
  { label: 'Site Diary', href: '/diary', icon: BookOpen, module: 'diary' },
  { label: 'Documents', href: '/documents', icon: FolderOpen, module: 'documents' },
  { label: 'Reports', href: '/reports', icon: BarChart3, module: 'projects' },
  { label: 'Settings', href: '/settings', icon: Settings, module: 'settings' },
]

function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem
  collapsed: boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive =
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
        isActive
          ? 'text-[#1a1f2e] shadow-sm'
          : 'text-white/60 hover:text-white hover:bg-white/8'
      )}
      style={
        isActive
          ? {
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#1a1f2e',
            }
          : undefined
      }
    >
      <item.icon
        className={cn('h-4.5 w-4.5 shrink-0 transition-colors', isActive ? 'text-[#1a1f2e]' : 'text-white/50 group-hover:text-white')}
        style={{ width: '18px', height: '18px' }}
      />
      {!collapsed && (
        <span className="truncate leading-none">{item.label}</span>
      )}
      {isActive && !collapsed && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
          style={{ background: 'rgba(0,0,0,0.3)' }}
        />
      )}
    </Link>
  )
}

function SidebarContent({
  collapsed,
  setCollapsed,
  role,
  visibleItems,
  onLinkClick,
}: {
  collapsed: boolean
  setCollapsed: (val: boolean) => void
  role: AppRole | null
  visibleItems: NavItem[]
  onLinkClick?: () => void
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#1a1f2e' }}>
      {/* Logo / Header */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5 border-b shrink-0',
          collapsed ? 'justify-center' : 'justify-between'
        )}
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <HardHat className="h-4.5 w-4.5 text-[#1a1f2e]" style={{ width: '18px', height: '18px' }} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate">
                Peseyie
              </p>
              <p className="text-xs leading-tight truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Constructions
              </p>
            </div>
          )}
        </div>
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'hidden md:flex items-center justify-center w-6 h-6 rounded-md transition-colors hover:bg-white/10',
            collapsed ? 'mx-auto mt-1' : ''
          )}
          style={{ color: 'rgba(255,255,255,0.4)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            onClick={onLinkClick}
          />
        ))}
      </nav>

      {/* Bottom: role indicator */}
      {!collapsed && role && (
        <div
          className="px-4 py-3 border-t shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <span
            className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize"
            style={{
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            {role}
          </span>
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { role } = useAuth()

  const visibleItems = NAV_ITEMS.filter((item) => canRead(role, item.module))

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-lg shadow-lg"
        style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-4.5 w-4.5 text-white" style={{ width: '18px', height: '18px' }} />
      </button>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'md:hidden fixed top-0 left-0 z-50 h-full w-72 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="relative h-full">
          <SidebarContent
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            role={role}
            visibleItems={visibleItems}
            onLinkClick={() => setMobileOpen(false)}
          />
          <button
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          'hidden md:flex flex-col h-full shrink-0 transition-all duration-300',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          role={role}
          visibleItems={visibleItems}
        />
      </div>
    </>
  )
}
