'use client'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Fixed Navbar Only */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      
      {/* Main content with padding for navbar */}
      <main className="pt-[70px]">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </>
  )
}
