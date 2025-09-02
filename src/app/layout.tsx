import type { Metadata } from 'next'
import { Cormorant_Garamond, Lato } from 'next/font/google'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'
import './globals.css'

const cormorantGaramond = Cormorant_Garamond({
  variable: '--font-cormorant-garamond',
  subsets: ['latin'],
})

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Ethanol Dilution Calculator',
  description:
    'Dilution calculator for herbalists and natural medicine practitioners. Create precise ethanol concentrations for tinctures and herbal extracts.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorantGaramond.variable} ${lato.variable} antialiased`}
      >
        <Navigation />
        {children}
        <Toaster
          position="top-right"
          closeButton
          offset={80}
          mobileOffset={80}
        />
      </body>
    </html>
  )
}
