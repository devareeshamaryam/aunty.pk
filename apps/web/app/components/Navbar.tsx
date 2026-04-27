 'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, ShoppingCart, Menu, X, ChevronDown, Phone, User, LogOut, LogIn, Package, LayoutDashboard, Settings, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { fetchCategories, type CategoryItem } from '../lib/api'

interface NavbarProps {
  onCartOpen: () => void
}

const Navbar = ({ onCartOpen }: NavbarProps) => {
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const { totalItems } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [categories, setCategories] = useState<{ name: string, href: string }[]>([])
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories()
        const items = [
          { name: 'Home', href: '/' },
          ...data.map(cat => ({ name: cat.name, href: `/collections/${cat.slug}` }))
        ]
        setCategories(items)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        setIsLocationOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Searching for:', searchQuery)
  }

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      console.log('Order type:', orderType)
      console.log('Location confirmed:', selectedLocation)
      setIsLocationOpen(false)
    }
  }

  const handleUseCurrentLocation = () => {
    console.log('Using current location')
  }

  return (
    <>
      <header
        className={`transition-all duration-300 ease-in-out ${
          isScrolled ? 'shadow-xl' : ''
        }`}
      >
        <nav className={`bg-white transition-all duration-300 overflow-visible ${isScrolled ? 'shadow-lg' : 'shadow-md'}`}>
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 relative">

                {/* LEFT */}
                <div className="flex items-center flex-1 gap-3">
                  <a
                    href="tel:03105717097"
                    className="hidden md:flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-bold shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                    <span>0310 5717097</span>
                  </a>

                  <button
                    onClick={() => setIsLocationOpen(true)}
                    className="hidden md:flex items-center gap-2 text-teal-500 hover:text-teal-600 transition-colors"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>

                  <Link href="/" className="block group md:hidden">
                    <div
                      className="w-14 h-14 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-105"
                      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }}
                    >
                      <Image
                        src="/image.png"
                        alt="Aunty.pk Logo"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover scale-150"
                      />
                    </div>
                  </Link>
                </div>

                {/* CENTER */}
                <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-[40%] z-10">
                  <Link href="/" className="block group">
                    <div
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-105"
                      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}
                    >
                      <Image
                        src="/image.png"
                        alt="Aunty.pk Logo"
                        width={112}
                        height={112}
                        className="w-full h-full object-cover scale-150"
                      />
                    </div>
                  </Link>
                </div>

                {/* RIGHT */}
                <div className="flex-1 flex items-center justify-end gap-3">
                  <a
                    href="tel:03105717097"
                    className="md:hidden p-1 text-teal-500 hover:text-teal-600 transition-colors"
                    aria-label="Call us"
                  >
                    <Phone className="w-6 h-6" />
                  </a>

                  {/* Cart button — calls onCartOpen from layout */}
                  <button
                    onClick={onCartOpen}
                    className="relative p-1"
                  >
                    <ShoppingCart
                      className="w-6 h-6 sm:w-7 sm:h-7 text-teal-500 hover:text-teal-600 transition-colors"
                      strokeWidth={2}
                    />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse-gentle">
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Location Modal */}
      {isLocationOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsLocationOpen(false)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsLocationOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <Image src="/image.png" alt="Logo" width={64} height={64} className="w-full h-full object-cover" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Select your order type</h2>

            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setOrderType('delivery')}
                className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${orderType === 'delivery' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                DELIVERY
              </button>
              <button
                onClick={() => setOrderType('pickup')}
                className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${orderType === 'pickup' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                PICK-UP
              </button>
            </div>

            {orderType === 'pickup' ? (
              <>
                <p className="text-center text-sm text-gray-600 mb-3">Which outlet would you like to pick-up from?</p>
                <button
                  onClick={handleUseCurrentLocation}
                  className="w-full mb-3 py-2.5 px-4 bg-teal-500 text-white rounded-full font-bold text-sm hover:bg-teal-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Use Current Location
                </button>
                <div className="relative mb-3">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:outline-none text-sm text-gray-700 appearance-none bg-white pr-9"
                  >
                    <option value="">Select location</option>
                    <option value="Aunty.pk Multan">Aunty.pk Multan</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                {selectedLocation && (
                  <div className="mb-4 px-4 py-2.5 bg-teal-50 rounded-xl border border-teal-100">
                    <p className="text-xs font-semibold text-teal-600 mb-0.5">Location:</p>
                    <p className="text-xs text-gray-600">Multan, Pakistan</p>
                  </div>
                )}
                <button
                  onClick={handleConfirmLocation}
                  disabled={!selectedLocation}
                  className={`w-full py-2.5 rounded-full font-bold text-white text-sm transition-all ${selectedLocation ? 'bg-teal-500 hover:bg-teal-600 active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  Select
                </button>
              </>
            ) : (
              <>
                <p className="text-center text-sm text-gray-600 mb-3">Enter your delivery location</p>
                <input
                  type="text"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  placeholder="Enter your location"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:outline-none text-sm mb-4"
                />
                <button
                  onClick={handleConfirmLocation}
                  disabled={!selectedLocation}
                  className={`w-full py-2.5 rounded-full font-bold text-white text-sm transition-all ${selectedLocation ? 'bg-teal-500 hover:bg-teal-600 active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  Confirm Location
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-[60] p-3 rounded-full bg-teal-500 text-white shadow-2xl transition-all duration-500 hover:bg-teal-600 hover:scale-110 active:scale-95 flex items-center justify-center ${
          isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ChevronDown className="w-6 h-6 rotate-180" />
      </button>
    </>
  )
}

export default Navbar