import type { Metadata } from 'next'
import { Instrument_Sans } from 'next/font/google'
import '@/styles/styles.scss'
import GlobalProvider from './GlobalProvider'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const instrument = Instrument_Sans({ subsets: ['latin'] })

// Dynamically import modals with no SSR to avoid hydration issues
const ModalCart = dynamic(() => import('@/components/Modal/ModalCart'), { ssr: false })
const ModalWishlist = dynamic(() => import('@/components/Modal/ModalWishlist'), { ssr: false })
const ModalSearch = dynamic(() => import('@/components/Modal/ModalSearch'), { ssr: false })
const ModalQuickview = dynamic(() => import('@/components/Modal/ModalQuickview'), { ssr: false })
const ModalCompare = dynamic(() => import('@/components/Modal/ModalCompare'), { ssr: false })

export const metadata: Metadata = {
  title: 'Anvogue',
  description: 'Multipurpose eCommerce Template',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GlobalProvider>
      <html lang="en">
        <body className={instrument.className}>
          {children}
          <Suspense fallback={null}>
            <ModalCart />
            <ModalWishlist />
            <ModalSearch />
            <ModalQuickview />
            <ModalCompare />
          </Suspense>
        </body>
      </html>
    </GlobalProvider>
  )
}
