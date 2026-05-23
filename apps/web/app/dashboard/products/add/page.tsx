 'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Check, AlertTriangle, Plus } from 'lucide-react';
import Link from 'next/link';
import RelatedProductsPicker from '../RelatedProductsPicker';
import { uploadFile } from '@/app/lib/api';

interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [relatedProducts, setRelatedProducts] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    isVariable: false,
    variantType: '',
  });
  const [variants, setVariants] = useState<{ name: string; price: string; stock: string }[]>([]);

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      setCategories(data.filter((c: Category) => c.isActive));
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Starting product creation...');
      
      // Validate
      if (!formData.category) throw new Error('Please select a category');
      if (!formData.name) throw new Error('Please enter product name');
      if (!formData.isVariable) {
        if (!formData.price) throw new Error('Please enter a price');
        if (!formData.stock) throw new Error('Please enter stock quantity');
      } else {
        if (!formData.variantType.trim()) throw new Error('Please enter a variant type (e.g. Size, Weight)');
        if (variants.length === 0) throw new Error('Please add at least one variant');
        const emptyVariant = variants.find((v) => !v.name.trim() || !v.price);
        if (emptyVariant) throw new Error('All variants must have a name and price');
      }
      if (!mainImage) throw new Error('Please upload a main image');

      console.log('Validation passed, uploading images...');

      // Upload images first
      const uploadedImages: string[] = [];
      
      // Upload main image to CDN
      const mainUploadData = await uploadFile(mainImage);
      uploadedImages.push(mainUploadData.url);

      // Upload additional images to CDN
      for (const img of additionalImages) {
        try {
          const imgUploadData = await uploadFile(img);
          uploadedImages.push(imgUploadData.url);
        } catch (e) {
          console.error('Additional image upload failed:', e);
        }
      }

      // Build payload
      const productPayload: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        images: uploadedImages,
        relatedProducts,
      };

      if (formData.isVariable) {
        const builtVariants = variants.map((v) => ({
          name: v.name.trim(),
          price: parseFloat(v.price),
          stock: parseInt(v.stock || '0', 10),
        }));
        productPayload.variantType = formData.variantType.trim();
        productPayload.variants = builtVariants;
        productPayload.price = builtVariants[0]?.price ?? 0;
        productPayload.stock = builtVariants.reduce((sum, v) => sum + v.stock, 0);
      } else {
        productPayload.price = parseFloat(formData.price);
        productPayload.stock = parseInt(formData.stock || '0', 10);
      }

      const productRes = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productPayload),
      });

      if (!productRes.ok) {
        const errorData = await productRes.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create product: ${productRes.statusText}`);
      }

      setToast('Product created successfully!');
      setTimeout(() => {
        router.push('/dashboard/products');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-fadeIn flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl bg-gray-900 text-white text-sm font-medium">
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/products"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details below</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Product Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
            placeholder="E.g., Luxury 3 Bedroom Apartment in DHA"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all resize-none"
            placeholder="Brief description of the product"
          />
        </div>

        {/* Product Type Toggle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type</label>
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-1.5 w-fit">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isVariable: false })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                !formData.isVariable
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isVariable: true })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                formData.isVariable
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Variable
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            {formData.isVariable
              ? 'Add multiple variants (e.g. Small, Medium, Large, 500g, 1kg, etc.)'
              : 'Single price and stock — no variants.'}
          </p>
        </div>

        {/* Simple Product: Price + Stock */}
        {!formData.isVariable && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Price (PKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                placeholder="Rs."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                placeholder="Quantity"
                required
              />
            </div>
          </div>
        )}

        {/* Variable Product: Variant Type + Dynamic Rows */}
        {formData.isVariable && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Variant Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.variantType}
                onChange={(e) => setFormData({ ...formData, variantType: e.target.value })}
                placeholder="e.g. Size, Weight, Flavor, Pack"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
              />
            </div>

            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input
                    value={v.name}
                    onChange={(e) =>
                      setVariants((arr) =>
                        arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                      )
                    }
                    placeholder="Variant name"
                    className="col-span-5 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={v.price}
                    onChange={(e) =>
                      setVariants((arr) =>
                        arr.map((x, j) => (j === i ? { ...x, price: e.target.value } : x))
                      )
                    }
                    placeholder="Price"
                    className="col-span-3 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  />
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) =>
                      setVariants((arr) =>
                        arr.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x))
                      )
                    }
                    placeholder="Stock"
                    className="col-span-3 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setVariants((arr) => arr.filter((_, j) => j !== i))}
                    className="col-span-1 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setVariants((v) => [...v, { name: '', price: '', stock: '' }])}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors mt-1"
              >
                <Plus className="w-4 h-4" /> Add variant
              </button>
            </div>
          </div>
        )}

        {/* Main Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Main Image <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-teal-400 transition-colors">
            {mainImagePreview ? (
              <div className="relative inline-block">
                <img src={mainImagePreview} alt="Preview" className="max-h-48 rounded-lg" />
                <button
                  type="button"
                  onClick={() => {
                    setMainImage(null);
                    setMainImagePreview('');
                  }}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">Click below to upload main photo</p>
                <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                <label className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold cursor-pointer hover:bg-gray-800 transition-all">
                  <Upload className="w-4 h-4" />
                  Select Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Additional Images */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Additional Photos (Optional)
          </label>
          <div className="grid grid-cols-4 gap-4">
            {additionalPreviews.map((preview, idx) => (
              <div key={idx} className="relative">
                <img src={preview} alt={`Additional ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeAdditionalImage(idx)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 transition-colors">
              <Upload className="w-6 h-6 text-gray-300 mb-1" />
              <span className="text-xs text-gray-500">Add Photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Related products */}
        <div className="pt-2 border-t border-gray-100">
          <RelatedProductsPicker value={relatedProducts} onChange={setRelatedProducts} />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Link
            href="/dashboard/products"
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 text-center transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}