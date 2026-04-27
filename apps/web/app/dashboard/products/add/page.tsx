 'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

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

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    description: '',
    smallPrice: '',
    mediumPrice: '',
    largePrice: '',
  });

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
      if (!formData.smallPrice && !formData.mediumPrice && !formData.largePrice) {
        throw new Error('Please add at least one size price');
      }
      if (!mainImage) throw new Error('Please upload a main image');

      console.log('Validation passed, uploading images...');

      // Upload images first
      const uploadedImages: string[] = [];
      
      // Upload main image
      const mainFormData = new FormData();
      mainFormData.append('file', mainImage);
      
      const mainUploadRes = await fetch(`${API_URL}/uploads/single`, {
        method: 'POST',
        body: mainFormData,
      });
      
      if (!mainUploadRes.ok) {
        console.error('Upload failed:', mainUploadRes.status, mainUploadRes.statusText);
        throw new Error(`Upload failed: ${mainUploadRes.statusText}`);
      }
      const mainUploadData = await mainUploadRes.json();
      const mainImageUrl = mainUploadData.url.startsWith('http') 
        ? mainUploadData.url 
        : `http://localhost:4000${mainUploadData.url}`;
      uploadedImages.push(mainImageUrl);

      // Upload additional images
      for (const img of additionalImages) {
        const imgFormData = new FormData();
        imgFormData.append('file', img);
        
        const imgUploadRes = await fetch(`${API_URL}/uploads/single`, {
          method: 'POST',
          body: imgFormData,
        });
        
        if (imgUploadRes.ok) {
          const imgUploadData = await imgUploadRes.json();
          const imgUrl = imgUploadData.url.startsWith('http')
            ? imgUploadData.url
            : `${API_URL}${imgUploadData.url}`;
          uploadedImages.push(imgUrl);
        }
      }

      // Build variants
      const variants: { name: string; price: number; stock: number }[] = [];
      if (formData.smallPrice) variants.push({ name: 'Small', price: parseFloat(formData.smallPrice), stock: 100 });
      if (formData.mediumPrice) variants.push({ name: 'Medium', price: parseFloat(formData.mediumPrice), stock: 100 });
      if (formData.largePrice) variants.push({ name: 'Large', price: parseFloat(formData.largePrice), stock: 100 });

      // Create product
      const productPayload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: variants[0]?.price ?? 0,
        stock: 100,
        images: uploadedImages,
        variantType: 'Size',
        variants,
      };

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

        {/* Prices */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Prices (Add at least one)
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">Small</label>
              <input
                type="number"
                step="0.01"
                value={formData.smallPrice}
                onChange={(e) => setFormData({ ...formData, smallPrice: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                placeholder="Rs."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">Medium</label>
              <input
                type="number"
                step="0.01"
                value={formData.mediumPrice}
                onChange={(e) => setFormData({ ...formData, mediumPrice: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                placeholder="Rs."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">Large</label>
              <input
                type="number"
                step="0.01"
                value={formData.largePrice}
                onChange={(e) => setFormData({ ...formData, largePrice: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                placeholder="Rs."
              />
            </div>
          </div>
        </div>

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