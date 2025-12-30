import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Deploy Terminal - Autonomous Terminal',
  description: 'Your autonomous terminal.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: '/catalyst-logo.svg',
    apple: '/catalyst-logo.svg',
  },
  themeColor: '#111111',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

