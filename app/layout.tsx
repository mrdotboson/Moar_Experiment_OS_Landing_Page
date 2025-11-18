import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catalyst Terminal - Strategy Compiler',
  description: 'Natural language → compiled strategy logic → simulation',
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

