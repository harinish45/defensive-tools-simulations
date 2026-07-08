import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CyberVerse - Cybersecurity Demo Platform',
  description: 'Educational cybersecurity simulation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-darker min-h-screen">{children}</body>
    </html>
  )
}
