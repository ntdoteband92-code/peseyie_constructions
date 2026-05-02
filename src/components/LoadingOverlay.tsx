'use client'

import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function LoadingOverlay() {
  const { isLoading } = useAuth()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )
}