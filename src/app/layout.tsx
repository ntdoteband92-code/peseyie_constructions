import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import QueryProvider from '@/components/providers/QueryProvider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: {
    default: 'Peseyie Constructions',
    template: '%s | Peseyie Constructions',
  },
  description:
    'Construction Operations Management System — Peseyie Constructions, Northeast India',
  robots: { index: false, follow: false }, // Private internal tool
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
      >
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
