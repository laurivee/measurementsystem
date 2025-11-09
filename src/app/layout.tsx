import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Measurement System',
  description: 'Tap-only measurement web app for manufacturing',
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

