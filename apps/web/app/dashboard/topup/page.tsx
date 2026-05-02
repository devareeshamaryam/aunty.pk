 'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Search, Package, AlertCircle, CheckCircle2,
} from 'lucide-react'
import {
  fetchAdminTopUpItems,
  toggleTopUpItem,
  deleteTopUpItem,
  getImageUrl,
  type TopUpItem,
} from '@/app/lib/api'

// ── Toast helper ──────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${type === 'success' ? 'bg-teal-600' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {msg}
    </div>
  )
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Item?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          "<span className="font-medium text-gray-700">{name}</span>" delete ho jayega. Yeh action undo nahi ho sakti.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">Delete</button>
        </div>
      </div>
    </div>
  )
}

const CATEGORY_EMOJI: Record<string, string> = {
  Drinks: '🥤', Sides: '🥛', Bread: '🫓', Extras: '🍢', default: '🍽️',
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TopUpListPage() {
  const [items, setItems] = useState<TopUpItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<TopUpItem | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type })

  const loadItems = async () => {
    setLoading(true)
    try {
      const data = await fetchAdminTopUpItems()
      if (data.success) setItems(data.items)
    } catch (err: any) {
      showToast(err?.message || 'Items load nahi hue', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadItems() }, [])

  const handleToggle = async (item: TopUpItem) => {
    setActionLoading(item._id + '_toggle')
    try {
      const data = await toggleTopUpItem(item._id)
      if (data.success) {
        // ✅ FIX: available use karo, isAvailable nahi
        setItems(prev => prev.map(i =>
          i._id === item._id ? { ...i, available: data.item.available } : i
        ))
        showToast(`"${item.name}" ${data.item.available ? 'active' : 'inactive'} kar diya`)
      }
    } catch (err: any) {
      showToast(err?.message || 'Toggle nahi hua', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (item: TopUpItem) => {
    setConfirmDelete(null)
    setActionLoading(item._id + '_delete')
    try {
      const data = await deleteTopUpItem(item._id)
      if (data.success) {
        setItems(prev => prev.filter(i => i._id !== item._id))
        showToast(`"${item.name}" delete ho gaya`)
      }
    } catch (err: any) {
      showToast(err?.message || 'Delete nahi hua', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const categories = ['All', ...Array.from(new Set(items.map(i => (i as any).category).filter(Boolean)))]

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'All' || (i as any).category === filterCat
    return matchSearch && matchCat
  })

  // ✅ FIX: i.available use karo
  const activeCount = items.filter(i => i.available).length

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {confirmDelete && (
        <ConfirmModal
          name={confirmDelete.name}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Top-Up Items</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeCount} active • {items.length} total items
            </p>
          </div>
          <Link
            href="/dashboard/topup/add"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
          >
            <Plus size={18} />
            Naya Item Add Karo
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Items', value: items.length, color: 'bg-blue-50 text-blue-700' },
            { label: 'Active', value: activeCount, color: 'bg-teal-50 text-teal-700' },
            { label: 'Inactive', value: items.length - activeCount, color: 'bg-red-50 text-red-600' },
            { label: 'Categories', value: categories.length - 1, color: 'bg-purple-50 text-purple-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-1 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Item search karo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterCat === cat ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
                <div className="w-14 h-14 bg-gray-100 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-40 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
            <Package size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Koi item nahi mila</p>
            <p className="text-sm text-gray-400 mt-1">Search ya filter change karo, ya naya item add karo</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-5">Item</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {filtered.map(item => {
                const isToggling = actionLoading === item._id + '_toggle'
                const isDeleting = actionLoading === item._id + '_delete'
                const imgSrc = item.image ? getImageUrl(item.image) : null
                const category = (item as any).category as string | undefined

                return (
                  <div
                    key={item._id}
                    // ✅ FIX: item.available use karo
                    className={`grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50 transition-colors ${!item.available ? 'opacity-60' : ''}`}
                  >
                    {/* Item info */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                        {imgSrc ? (
                          <Image src={imgSrc} alt={item.name} width={56} height={56} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-2xl">{CATEGORY_EMOJI[category || ''] || CATEGORY_EMOJI.default}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        {category || '—'}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-2">
                      <span className="font-bold text-gray-900">Rs. {item.price.toLocaleString()}</span>
                    </div>

                    {/* Status toggle */}
                    <div className="col-span-1">
                      <button
                        onClick={() => handleToggle(item)}
                        disabled={!!isToggling}
                        // ✅ FIX: item.available use karo
                        title={item.available ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                        className="transition-colors disabled:opacity-50"
                      >
                        {/* ✅ FIX: item.available use karo */}
                        {item.available
                          ? <ToggleRight size={28} className="text-teal-500" />
                          : <ToggleLeft size={28} className="text-gray-300" />}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/topup/edit/${item._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-medium transition-colors"
                      >
                        <Pencil size={13} />
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(item)}
                        disabled={isDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        {isDeleting ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}