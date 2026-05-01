import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as Indian Rupees: ₹12,34,567 */
export function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Format a number as compact Indian Rupees: ₹12.3L, ₹4.2Cr */
export function formatINRCompact(amount: number | null | undefined): string {
  if (amount == null) return '₹0'
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)}L`
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`
  return formatINR(amount)
}

/** Format an ISO date string or Date object as DD/MM/YYYY */
export function formatDate(
  date: string | Date | null | undefined
): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy')
  } catch {
    return '—'
  }
}

/** Format as DD/MM/YYYY HH:mm */
export function formatDateTime(
  date: string | Date | null | undefined
): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy HH:mm')
  } catch {
    return '—'
  }
}

/** Strip ₹ and commas, return numeric value */
export function parseINR(value: string): number {
  return parseFloat(value.replace(/[₹,\s]/g, '')) || 0
}

/** Generate initials from a full name */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

/** Truncate text to maxLength with ellipsis */
export function truncate(text: string | null | undefined, maxLength = 50): string {
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}
