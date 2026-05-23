 'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'
import CategoriesBar from '../components/CategoriesBar'
import Footer from '../components/Footer'
import CartSidebar from '../components/CartSidebar'
import FloatingCartBar from '../components/Floatingcartbar'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <>
      <Navbar onCartOpen={() => setIsCartOpen(true)} />
      <CategoriesBar />

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="pb-24">
        {children}
      </main>

      <Footer />

      {/* Floating Cart Bar */}
      <FloatingCartBar onOpenCart={() => setIsCartOpen(true)} />
    </>
  )
}