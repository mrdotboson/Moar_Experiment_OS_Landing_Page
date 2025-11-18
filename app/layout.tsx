import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catalyst Terminal - Strategy Compiler',
  description: 'Natural language → compiled strategy logic → simulation',
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
  themeColor: '#0A0A0A',
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

