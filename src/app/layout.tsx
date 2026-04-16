import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Sidebar from '@/components/Sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'JARVIS — Angel OS Console',
  description: 'Headless Angel OS client · Offline-first · Ad Astra',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'JARVIS' },
}

export const viewport: Viewport = {
  themeColor: '#0a0a14',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {/* Deep-space backdrop */}
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(245,166,35,0.06),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(68,136,204,0.06),transparent_60%)]" />
        <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#0a0a14,#0f0f1e)]" />

        <Sidebar />

        {/* Main content — offset by sidebar width (w-56 = 14rem) */}
        <main className="ml-56 min-h-screen flex flex-col">
          <div className="flex-1 p-6 max-w-screen-2xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
