 'use client'

import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import CategoriesBar from '../components/CategoriesBar'
import SearchBar from '../components/Searchbar'
import Footer from '../components/Footer'
import CartSidebar from '../components/CartSidebar'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <div className="w-full">
      {/* Fixed Header Wrapper */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className={`transition-transform duration-500 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <Navbar onCartOpen={() => setIsCartOpen(true)} />
          <CategoriesBar />
          <SearchBar />
        </div>
      </div>

      {/* Cart Sidebar - outside fixed header, directly in body flow */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Main content */}
      <main className="pt-[180px] sm:pt-[185px]">
        {children}
      </main>

      <Footer />
    </div>
  )
}