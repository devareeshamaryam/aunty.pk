 'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, X, Save, ArrowLeft, ImageIcon } from 'lucide-react'

// ✅ lib/api.ts se functions import kiye — token auto-attach hoga
import { apiFetch, createTopUpItem, updateTopUpItem } from '@/app/lib/api'

const CATEGORIES = ['Drinks', 'Sides', 'Bread', 'Extras', 'Desserts', 'Other']

interface TopUpFormProps {
  mode: 'add' | 'edit'
  itemId?: string
}

export default function TopUpForm({ mode, itemId }: TopUpFormProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Extras',
    description: '',
    available: true,
    order: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(mode === 'edit')

  // ── Fetch existing item for edit ───────────────────────────────────────
  useEffect(() => {
    if (mode === 'edit' && itemId) {
      // ✅ apiFetch use kiya — Bearer token auto-attach hoga
      apiFetch(`/admin/topup-items/${itemId}`)
        .then(data => {
          if (data.success) {
            const i = data.item
            setForm({
              name: i.name || '',
              price: i.price?.toString() || '',
              category: i.category || 'Extras',
              description: i.description || '',
              available: i.available ?? true,
              order: i.order?.toString() || '',
            })
            if (i.image) {
              setExistingImage(i.image)
            }
          }
        })
        .catch(() => {
          setErrors({ _server: 'Item load karne mein error aaya' })
        })
        .finally(() => setFetchLoading(false))
    }
  }, [mode, itemId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm(prev => ({ ...prev, [name]: val }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image 5MB se chhoti honi chahiye' }))
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setErrors(prev => ({ ...prev, image: '' }))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setExistingImage(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Naam zaroor dalo'
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)
      errs.price = 'Sahi price dalo'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('price', form.price)
      fd.append('category', form.category)
      fd.append('description', form.description)
      fd.append('available', String(form.available))
      if (form.order) fd.append('order', form.order)
      if (imageFile) fd.append('image', imageFile)

      // ✅ createTopUpItem / updateTopUpItem use kiye — token auto-attach hoga
      const data = mode === 'add'
        ? await createTopUpItem(fd)
        : await updateTopUpItem(itemId!, fd)

      if (data.success) {
        router.push('/dashboard/topup')
        router.refresh()
      } else {
        setErrors({ _server: 'Kuch galat ho gaya' })
      }
    } catch (err: any) {
      setErrors({ _server: err?.message || 'Server se connect nahi ho saka' })
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Item load ho raha hai...</p>
        </div>
      </div>
    )
  }

  const previewSrc = imagePreview || existingImage

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-teal-600 text-sm font-medium mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Wapas jao
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'add' ? 'Naya Top-Up Item' : 'Item Edit Karo'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'add' ? 'Cart aur checkout pe dikhne wala naya item add karo' : 'Item ki details update karo'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {errors._server && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              {errors._server}
            </div>
          )}

          <div className="space-y-5">
            {/* Image Upload */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Item ki Photo
              </label>

              {previewSrc ? (
                <div className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  <Image src={previewSrc} alt="Preview" fill className="object-contain p-4" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-44 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-teal-300 hover:bg-teal-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-teal-100 rounded-full flex items-center justify-center transition-colors">
                    <ImageIcon size={22} className="text-gray-400 group-hover:text-teal-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-teal-700">Photo upload karo</p>
                    <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP — max 5MB</p>
                  </div>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {errors.image && <p className="text-red-500 text-xs mt-2">{errors.image}</p>}

              {!previewSrc && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Upload size={15} />
                  Browse karo
                </button>
              )}
            </div>

            {/* Name & Price */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item ka Naam <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Raita, Cold Drink, Naan"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (Rs.) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rs.</span>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0"
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${errors.price ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description & Settings */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Item ke baare mein thodi info..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Display Order
                    <span className="ml-1 text-xs text-gray-400 font-normal">(1 = pehle)</span>
                  </label>
                  <input
                    name="order"
                    type="number"
                    min="1"
                    value={form.order}
                    onChange={handleChange}
                    placeholder="Auto"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="available"
                        checked={form.available}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${form.available ? 'bg-teal-500' : 'bg-gray-200'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform m-0.5 ${form.available ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Available</p>
                      <p className="text-xs text-gray-400">{form.available ? 'Cart pe dikhega' : 'Hidden hai'}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {mode === 'add' ? 'Add ho raha hai...' : 'Save ho raha hai...'}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {mode === 'add' ? 'Item Add Karo' : 'Changes Save Karo'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}