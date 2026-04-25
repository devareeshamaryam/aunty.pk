 'use client'

import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import CategoriesBar from '../components/CategoriesBar'
import SearchBar from '../components/Searchbar'
import Footer from '../components/Footer'
 
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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
    <div className="overflow-x-hidden w-full">  {/* 👈 yeh add kiya */}
      {/* Fixed Header Wrapper - Always stays at top */}
      <div className="fixed top-0 left-0 right-0 z-50 overflow-x-hidden">  {/* 👈 overflow-x-hidden add kiya */}
        <div className={`transition-transform duration-500 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <Navbar />
          <CategoriesBar />
          <SearchBar />
        </div>
      </div>
      
      {/* Main content with fixed padding - Never changes */}
      <main className="pt-[180px] sm:pt-[185px] overflow-x-hidden">  {/* 👈 overflow-x-hidden add kiya */}
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}