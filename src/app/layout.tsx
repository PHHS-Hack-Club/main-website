import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CrtOverlay from '@/components/CrtOverlay'
import NavAuthButton from '@/components/NavAuthButton'

export const metadata: Metadata = {
  title: 'PHHS Hack Club',
  description: "Pascack Hills High School's coding club. Build, break, and learn together.",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'PHHS Hack Club',
    description: "Pascack Hills High School's coding club. Build, break, and learn together.",
    images: ['https://assets.hackclub.com/flag-orpheus-top.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CrtOverlay />
        <Navbar authButton={<NavAuthButton />} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
