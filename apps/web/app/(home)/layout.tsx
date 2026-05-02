 'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'
import CategoriesBar from '../components/CategoriesBar'
import SearchBar from '../components/Searchbar'
import Footer from '../components/Footer'
import CartSidebar from '../components/CartSidebar'
import LocationModal from '../components/Locationmodal'
import FloatingCartBar from '../components/Floatingcartbar'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
  const [selectedLocation, setSelectedLocation] = useState('')

  return (
    <>
      <Navbar
        onCartOpen={() => setIsCartOpen(true)}
        onLocationOpen={() => setIsLocationOpen(true)}
      />
      <CategoriesBar />
      <SearchBar />

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        orderType={orderType}
        setOrderType={setOrderType}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        onConfirm={() => setIsLocationOpen(false)}
      />

      <main className="pb-24">
        {children}
      </main>

      <Footer />

      {/* Floating Cart Bar */}
      <FloatingCartBar onOpenCart={() => setIsCartOpen(true)} />
    </>
  )
}