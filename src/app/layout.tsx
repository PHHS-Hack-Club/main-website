import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CrtOverlay from '@/components/CrtOverlay'
import NavAuthButton from '@/components/NavAuthButton'
import SiteModal from '@/components/SiteModal'

export const metadata: Metadata = {
  title: 'PHHS Hack Club',
  description: "Pascack Hills High School's Hack Club chapter. A student-led place to make projects, share them, and learn by doing.",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'PHHS Hack Club',
    description: "Pascack Hills High School's Hack Club chapter. A student-led place to make projects, share them, and learn by doing.",
    images: ['https://assets.hackclub.com/flag-orpheus-top.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CrtOverlay />
        <Navbar authButton={<NavAuthButton />} />
        <SiteModal />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
