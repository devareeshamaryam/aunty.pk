'use client'

import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import CategorySection from '../components/CategorySection'
import FAQ from '../components/FAQ'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      
      // Fetch active categories
      const categoriesRes = await fetch(`${API_URL}/categories`)
      const categoriesData = await categoriesRes.json()
      setCategories(categoriesData.filter((cat: Category) => cat.isActive))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Head>
        <link rel="canonical" href="https://aunty.pk" />
        <meta name="description" content="Shop authentic Pakistani homemade food - Biryani, Shami Kabab, and more. Fresh, hygienic, and delivered across Multan." />
        <meta property="og:title" content="Aunty.pk - Premium Pakistani Homemade Food" />
        <meta property="og:description" content="Shop authentic Pakistani homemade food - Biryani, Shami Kabab, and more. Fresh, hygienic, and delivered across Multan." />
        <meta property="og:url" content="https://aunty.pk" />
        <meta property="og:type" content="website" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Popular Items Section - Using same component */}
        <CategorySection
          categoryName="Popular Items"
          isPopular={true}
        />

        {/* Dynamic Category Sections - Automatically added when you create categories */}
        {categories.map((category) => (
          <CategorySection
            key={category._id}
            categoryId={category._id}
            categoryName={category.name}
            categorySlug={category.slug}
            categoryImage={category.image}
            categoryDescription={category.description}
          />
        ))}

        {/* FAQ Section */}
        <FAQ />
      </div>
    </>
  )
}
