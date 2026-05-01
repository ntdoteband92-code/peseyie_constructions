'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { signIn } from '@/app/actions/auth'
import { HardHat, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      id="login-submit-btn"
      className="w-full flex items-center justify-center gap-2 rounded-lg py-3 px-4 font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: '#1a1f2e',
        boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
      }}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in…
        </>
      ) : (
        'Sign In'
      )}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(signIn, null)

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f1623 0%, #1a1f2e 50%, #0f1623 100%)',
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Logo / Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                <HardHat className="h-8 w-8 text-[#1a1f2e]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Peseyie Constructions
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Operations Management System
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:ring-2"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  '--tw-ring-color': '#f59e0b',
                } as React.CSSProperties}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:ring-2"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  '--tw-ring-color': '#f59e0b',
                } as React.CSSProperties}
              />
            </div>

            {state?.error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                }}
                role="alert"
              >
                {state.error}
              </div>
            )}

            <SubmitButton />
          </form>

          {/* Footer note */}
          <p
            className="text-center text-xs mt-6"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Access restricted to authorised personnel only.
            <br />
            Contact your administrator to request access.
          </p>
        </div>

        {/* Version tag */}
        <p
          className="text-center text-xs mt-4"
          style={{ color: 'rgba(255,255,255,0.15)' }}
        >
          Peseyie Constructions © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
