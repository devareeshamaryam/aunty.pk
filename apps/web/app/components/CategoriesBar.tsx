 'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { fetchCategories, type CategoryItem } from '../lib/api'

const CategoriesBar = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCategories()
  }, [])

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

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [categories])

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="bg-teal-500 shadow-md py-2">
        <div className="flex items-center px-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-teal-500 shadow-md">
      <div className="flex items-center">

        {/* Left Arrow */}
        <button
          onClick={scrollLeft}
          className={`flex-shrink-0 px-2 py-2 transition-all
            ${canScrollLeft
              ? 'text-white opacity-100'
              : 'text-teal-300 opacity-40 cursor-default'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 py-2 justify-start"
        >
          <Link
            href="/"
            className="flex-shrink-0 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 rounded-md text-white font-bold text-sm uppercase tracking-wide transition-all"
          >
            HOME
          </Link>

          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/collections/${category.slug}`}
              className="flex-shrink-0 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 rounded-md text-white font-bold text-sm uppercase tracking-wide transition-all"
            >
              {category.name}
            </Link>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={scrollRight}
          className={`flex-shrink-0 px-2 py-2 transition-all
            ${canScrollRight
              ? 'text-white opacity-100'
              : 'text-teal-300 opacity-40 cursor-default'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>
    </div>
  )
}

export default CategoriesBar