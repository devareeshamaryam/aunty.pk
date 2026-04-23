 'use client'

import React, { useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import MainCard from './MainCard'

interface Product {
  _id: string
  name: string
  price: number
  images: string[]
  slug: string
  variants?: Array<{
    name: string
    price: number
    stock: number
  }>
}

interface CategorySectionProps {
  categoryId?: string
  categoryName: string
  categorySlug?: string
  categoryImage?: string
  categoryDescription?: string
  isPopular?: boolean
}

export default function CategorySection({ 
  categoryId, 
  categoryName, 
  categorySlug,
  categoryImage,
  categoryDescription,
  isPopular = false
}: CategorySectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [categoryId, isPopular])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      
      let url = ''
      if (isPopular) {
        url = `${API_URL}/products/latest?limit=8`
      } else if (categoryId) {
        url = `${API_URL}/products?category=${categoryId}&limit=12`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (isPopular) {
        setProducts(data || [])
      } else {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  if (isPopular && products.length === 0) {
    return null
  }

  return (
    <section className="bg-gray-50 py-4 mt-6">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-black text-gray-600 mb-2">
            {categoryName}
          </h2>
          <p className="text-sm text-gray-500">
            {categoryDescription || (isPopular ? 'Most ordered right now' : `Explore our delicious ${categoryName.toLowerCase()} collection`)}
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className={isPopular
            /* Mobile: 1 col full width | Desktop: 4 cols full width, no max-w limit */
            ? "grid grid-cols-1 md:grid-cols-4 gap-4 pb-8"
            : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-8"
          }>
            {products.map((product, index) => (
              isPopular ? (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.variants && product.variants.length > 0 ? product.variants[0].price : product.price}
                  image={product.images && product.images.length > 0 ? product.images[0] : ''}
                  slug={product.slug}
                  variants={product.variants}
                />
              ) : (
                <MainCard
                  key={product._id}
                  name={product.name}
                  price={product.variants && product.variants.length > 0 ? product.variants[0].price : product.price}
                  imageUrl={product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/300x320/f5f5f5/ccc?text=Product'}
                  slug={product.slug}
                  productId={product._id}
                  isPopular={index === 0}
                />
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-200 mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Yet</h3>
            <p className="text-gray-500">Products will appear here once they are added to this category.</p>
          </div>
        )}
      </div>
    </section>
  )
}