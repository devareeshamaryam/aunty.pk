 'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, Phone, MapPin, ShoppingCart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { fetchCategories } from '../lib/api'

interface NavbarProps {
  onCartOpen?: () => void
  onLocationOpen?: () => void
}

const Navbar = ({ onCartOpen = () => {}, onLocationOpen = () => {} }: NavbarProps) => {
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const { totalItems } = useCart()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileLogoHovered, setMobileLogoHovered] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <>
      <header className={`transition-all duration-300 ${isScrolled ? 'shadow-xl' : ''}`}>
        <nav className={`bg-white transition-all duration-300 ${isScrolled ? 'shadow-lg' : 'shadow-md'}`}>
          <div className="bg-teal-500 md:bg-white border-b border-gray-200">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 relative">

                {/* LEFT */}
                <div className="flex items-center flex-1 gap-3">
                  <a href="tel:03105717097" className="hidden md:flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-bold shadow-sm">
                    <Phone className="w-4 h-4" />
                    <span>0310 5717097</span>
                  </a>
                  <button onClick={onLocationOpen} className="hidden md:flex items-center gap-2 text-teal-500 hover:text-teal-600 transition-colors">
                    <MapPin className="w-5 h-5" />
                  </button>

                  {/* MOBILE — Logo + Urdu tagline */}
                  <Link
                    href="/"
                    className="flex md:hidden items-center gap-2"
                    onMouseEnter={() => setMobileLogoHovered(true)}
                    onMouseLeave={() => setMobileLogoHovered(false)}
                  >
                    <div
                      style={{
                        filter: mobileLogoHovered
                          ? 'drop-shadow(0px 7px 0px rgba(0,0,0,0.35)) drop-shadow(0px 14px 20px rgba(0,0,0,0.28)) drop-shadow(0px -1px 3px rgba(255,255,255,0.18))'
                          : 'drop-shadow(0px 4px 0px rgba(0,0,0,0.30)) drop-shadow(0px 8px 12px rgba(0,0,0,0.22)) drop-shadow(0px -1px 2px rgba(255,255,255,0.12))',
                        transform: mobileLogoHovered
                          ? 'perspective(300px) rotateX(5deg) scale(1.10)'
                          : 'perspective(300px) rotateX(5deg)',
                        transition: 'filter 0.3s ease, transform 0.3s ease',
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src="/image12.png"
                        alt="Aunty.pk Logo"
                        width={52}
                        height={52}
                        className="w-12 h-12 object-contain"
                      />
                    </div>

                    {/* Urdu tagline only */}
                    <span
                      style={{
                        fontFamily: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", serif',
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#ffffff',
                        lineHeight: '1.6',
                        textShadow: '0px 2px 6px rgba(0,0,0,0.25)',
                        whiteSpace: 'nowrap',
                        direction: 'rtl',
                      }}
                    >
                      کھانا صرف آنٹی کا
                    </span>
                  </Link>
                </div>

                {/* CENTER — Desktop logo UNCHANGED */}
                <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-[40%] z-10">
                  <Link href="/" className="block group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-105" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}>
                      <Image src="/image.png" alt="Aunty.pk Logo" width={112} height={112} className="w-full h-full object-cover scale-150" />
                    </div>
                  </Link>
                </div>

                {/* RIGHT */}
                <div className="flex-1 flex items-center justify-end gap-3">
                  <a href="tel:03105717097" className="md:hidden p-1 text-white transition-colors">
                    <Phone className="w-6 h-6" />
                  </a>
                  <button onClick={onCartOpen} className="relative p-1">
                    <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-white md:text-teal-500 hover:opacity-80 transition-opacity" strokeWidth={2} />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
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

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-[60] p-3 rounded-full bg-teal-500 text-white shadow-2xl transition-all duration-500 hover:bg-teal-600 hover:scale-110 active:scale-95 flex items-center justify-center ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <ChevronDown className="w-6 h-6 rotate-180" />
      </button>
    </>
  )
}

export default Navbar