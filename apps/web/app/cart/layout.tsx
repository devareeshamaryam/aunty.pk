 'use client'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <main className="pt-[70px]">
        {children}
      </main>
      <Footer />
    </>
  )
}