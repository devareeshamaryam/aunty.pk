'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { fetchCategories, getImageUrl, type CategoryItem } from '../lib/api'

const CategoriesBar = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await fetchCategories()
      const activeCategories = data.filter((cat: CategoryItem) => cat.isActive)
      setCategories(activeCategories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [categories, checkScroll])

  const scrollToSection = (slug: string) => {
    const element = document.getElementById(`category-${slug}`)
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) {
    return (
      <div className="bg-white py-3 px-2">
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (categories.length === 0) return null

  return (
    <section aria-label="Shop by category" className="relative bg-white py-2 sm:py-3">
      {/* Left arrow (desktop) */}
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
          className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md text-gray-600 items-center justify-center hover:bg-cyan-50 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {/* Right arrow (desktop) */}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
          className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md text-gray-600 items-center justify-center hover:bg-cyan-50 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-3 py-1"
      >
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => scrollToSection(category.slug)}
            className="group snap-start flex flex-col items-center flex-shrink-0 w-[68px] md:w-[88px] focus:outline-none"
          >
            {/* Image — clean, no border, no radius, exact as uploaded */}
            <div className="relative w-[56px] h-[56px] md:w-[76px] md:h-[76px] flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110 group-active:scale-95">
              {category.image ? (
                <Image
                  src={getImageUrl(category.image)}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 56px, 76px"
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-700 font-bold text-lg md:text-xl">
                  {category.name.trim().charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="mt-1.5 text-[10px] md:text-xs text-center text-gray-700 font-medium group-hover:text-cyan-600 transition-colors line-clamp-2 leading-tight">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default CategoriesBar