import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catalyst - Event-Aware Conditional Orders',
  description: 'React faster to the world\'s changing probabilities. Trade automatically when Polymarket events trigger and market conditions align.',
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

