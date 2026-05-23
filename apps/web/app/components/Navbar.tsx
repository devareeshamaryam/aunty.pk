 'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Search, X } from 'lucide-react'
import AccountMenu from './AccountMenu'

interface NavbarProps {
  onCartOpen?: () => void
  /** @deprecated kept for backward compat — location is now captured silently. */
  onLocationOpen?: () => void
}

const Navbar = ({ onCartOpen = () => {} }: NavbarProps) => {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setSearchOpen(false)
    setSearchQuery('')
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const logoStyle = {
    filter: logoHovered
      ? 'drop-shadow(0px 7px 0px rgba(0,0,0,0.35)) drop-shadow(0px 14px 20px rgba(0,0,0,0.28)) drop-shadow(0px -1px 3px rgba(255,255,255,0.18))'
      : 'drop-shadow(0px 5px 0px rgba(0,0,0,0.30)) drop-shadow(0px 10px 15px rgba(0,0,0,0.22)) drop-shadow(0px -1px 2px rgba(255,255,255,0.12))',
    transform: logoHovered
      ? 'perspective(300px) rotateX(5deg) scale(1.10)'
      : 'perspective(300px) rotateX(5deg)',
    transition: 'filter 0.3s ease, transform 0.3s ease',
    flexShrink: 0,
  }

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all duration-300 relative ${isScrolled ? 'shadow-md' : ''}`}>
        <nav className={`bg-white/95 backdrop-blur-md transition-all duration-300 ${isScrolled ? 'md:border-b md:border-gray-200' : 'md:border-b md:border-gray-100'}`}>
          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 md:bg-none md:bg-white md:border-b md:border-gray-200">
            <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6">
              <div className="flex items-center justify-between h-16 md:h-16 relative">

                {/* LEFT — Account dropdown */}
                <div className="flex items-center flex-1 gap-2">
                  <AccountMenu variant="dark" />
                </div>

                {/* CENTER — Logo (Mobile & Desktop) */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-[45%] z-20">
                  <Link
                    href="/"
                    className="block"
                    onMouseEnter={() => setLogoHovered(true)}
                    onMouseLeave={() => setLogoHovered(false)}
                  >
                    <div style={logoStyle} className="translate-y-2 md:translate-y-0">
                      <Image
                        src="/image63.png"
                        alt="Aunty.pk Logo"
                        width={300}
                        height={300}
                        className="w-28 h-28 sm:w-36 sm:h-36 object-contain"
                      />
                    </div>
                  </Link>
                </div>

                {/* RIGHT — Search toggle */}
                <div className="flex-1 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSearchOpen((v) => !v)}
                    aria-label={searchOpen ? 'Close search' : 'Open search'}
                    className="relative p-2 rounded-full hover:bg-white/15 md:hover:bg-cyan-50 transition-all duration-200 active:scale-95"
                  >
                    {searchOpen ? (
                      <X className="w-6 h-6 text-white md:text-cyan-600" strokeWidth={2} />
                    ) : (
                      <Search className="w-6 h-6 text-white md:text-cyan-600" strokeWidth={2} />
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </nav>

        {/* Search overlay */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-xl z-50 py-3 px-4 animate-fadeIn">
            <form onSubmit={handleSearch} className="max-w-[600px] mx-auto">
              <div className="flex items-center border-2 border-cyan-500 rounded-full overflow-hidden bg-white">
                <div className="pl-4 pr-2 flex items-center">
                  <Search className="w-5 h-5 text-cyan-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 py-3 pr-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
                />
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-3 text-sm font-semibold transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-[60] p-3 rounded-full bg-cyan-500 text-white shadow-2xl transition-all duration-500 hover:bg-cyan-600 hover:scale-110 active:scale-95 flex items-center justify-center ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <ChevronDown className="w-6 h-6 rotate-180" />
      </button>
    </>
  )
}

export default Navbar
