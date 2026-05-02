import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import QueryProvider from '@/components/providers/QueryProvider'
import { Toaster } from 'sonner'
import LoadingOverlay from '@/components/LoadingOverlay'

export const metadata: Metadata = {
  title: {
    default: 'Pespeyie Constructions',
    template: '%s | Pespeyie Constructions',
  },
  description: 'Construction Operations Management System',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <QueryProvider>
          <AuthProvider>
            <LoadingOverlay />
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}