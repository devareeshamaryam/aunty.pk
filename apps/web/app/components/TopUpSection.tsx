 'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Minus, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { fetchTopUpItems, getImageUrl, type TopUpItem } from '../lib/api'

export interface SelectedTopUp {
  item: TopUpItem
  quantity: number
}

export function computeTopUpTotal(selected: SelectedTopUp[]): number {
  return selected.reduce((sum, s) => sum + s.item.price * s.quantity, 0)
}

interface TopUpSectionProps {
  onChange: (selected: SelectedTopUp[]) => void
  initialSelected?: SelectedTopUp[]
}

export default function TopUpSection({ onChange, initialSelected = [] }: TopUpSectionProps) {
  const [items, setItems] = useState<TopUpItem[]>([])
  const [selected, setSelected] = useState<SelectedTopUp[]>(initialSelected)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    fetchTopUpItems()
      .then(data => {
        if (data.success) setItems(data.items)
        else setError('load nahi hue')
      })
      .catch(err => {
        console.error('TopUp fetch error:', err)
        setError('load nahi hue')
      })
      .finally(() => setLoading(false))
  }, [])

  const updateSelected = (next: SelectedTopUp[]) => {
    setSelected(next)
    onChange(next)
  }

  const getQty = (id: string) => selected.find(s => s.item._id === id)?.quantity ?? 0

  const increment = (item: TopUpItem) => {
    const existing = selected.find(s => s.item._id === item._id)
    if (existing) {
      updateSelected(selected.map(s => s.item._id === item._id ? { ...s, quantity: s.quantity + 1 } : s))
    } else {
      updateSelected([...selected, { item, quantity: 1 }])
    }
  }

  const decrement = (item: TopUpItem) => {
    const existing = selected.find(s => s.item._id === item._id)
    if (!existing) return
    if (existing.quantity <= 1) {
      updateSelected(selected.filter(s => s.item._id !== item._id))
    } else {
      updateSelected(selected.map(s => s.item._id === item._id ? { ...s, quantity: s.quantity - 1 } : s))
    }
  }

  const totalSelected = selected.reduce((sum, s) => sum + s.quantity, 0)

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
        {[1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error || items.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">

      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-teal-500" />
          <span className="font-semibold text-sm text-gray-900">Add-ons &amp; Extras</span>
          {totalSelected > 0 && (
            <span className="bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalSelected}
            </span>
          )}
        </div>
        {collapsed
          ? <ChevronDown size={16} className="text-gray-400" />
          : <ChevronUp size={16} className="text-gray-400" />}
      </button>

      {/* Items — horizontal card same as product card style */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {items.map(item => {
            const qty = getQty(item._id)
            const imgSrc = item.image ? getImageUrl(item.image) : null

            return (
              <div
                key={item._id}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                  qty > 0
                    ? 'border-teal-200 bg-teal-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                }`}
              >
                {/* Image */}
                <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-gray-100">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={item.name}
                      fill
                      className="object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                  )}
                </div>

                {/* Name + Price */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-xs font-bold text-teal-600 mt-0.5">Rs. {item.price.toLocaleString()}</p>
                </div>

                {/* + button / counter — same circular style as product cards */}
                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => increment(item)}
                    className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm transition-all hover:scale-110"
                  >
                    <Plus size={16} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => decrement(item)}
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold text-teal-700 w-5 text-center">{qty}</span>
                    <button
                      type="button"
                      onClick={() => increment(item)}
                      className="w-7 h-7 rounded-full bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Summary */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 px-1">
              <span className="text-xs text-gray-500">
                {totalSelected} add-on{totalSelected > 1 ? 's' : ''} added
              </span>
              <span className="text-xs font-bold text-teal-600">
                + Rs. {computeTopUpTotal(selected).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}