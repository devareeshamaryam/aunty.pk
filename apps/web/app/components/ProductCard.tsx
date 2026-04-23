'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useState } from 'react'

interface ProductCardProps {
  id: string
  name: string
  price: number
  image: string
  slug: string
  subtitle?: string
  variants?: Array<{
    name: string
    price: number
    stock: number
  }>
}

export default function ProductCard({
  id,
  name,
  price,
  image,
  slug,
  subtitle,
  variants,
}: ProductCardProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    addItem({
      productId: id,
      name,
      price,
      quantity: 1,
      image,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden w-full cursor-pointer group flex flex-row items-stretch min-h-[130px]">
      {/* ── MOBILE & DESKTOP: image right side ── */}
      <div className="order-2 relative w-[110px] flex-shrink-0 md:w-[160px] overflow-hidden rounded-r-2xl">
        <Image
          src={image || 'https://placehold.co/300x320/f5f5f5/ccc?text=Item'}
          alt={name}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* ── MOBILE & DESKTOP: text left side ── */}
      <div className="order-1 flex flex-col justify-start gap-1 flex-1 min-w-0 px-4 py-4 pb-12">
        <Link href={`/product/${slug}`} className="hover:no-underline">
          <h3 className="font-extrabold text-[1rem] md:text-[1.05rem] text-gray-900 leading-snug group-hover:text-teal-600 transition-colors duration-200 line-clamp-2">
            {name}
          </h3>
        </Link>
        {subtitle && (
          <p className="text-xs text-gray-400 font-medium line-clamp-1 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* + Button - right bottom */}
      <button
        onClick={handleAddToCart}
        className={`absolute bottom-3 right-3 w-8 h-8 md:w-9 md:h-9 rounded-full ${
          added ? 'bg-green-500' : 'bg-teal-500 hover:bg-teal-600'
        } active:scale-95 text-white flex items-center justify-center shadow-md transition-all duration-200 z-10`}
        aria-label={`Add ${name}`}
      >
        {added ? (
          <span className="text-xs font-bold">✓</span>
        ) : (
          <Plus size={17} strokeWidth={3} />
        )}
      </button>
    </div>
  )
}
