'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Loader2, X, AlertTriangle, Check, Plus, Upload } from 'lucide-react';
import {
  fetchProduct,
  updateProduct,
  fetchCategories,
  uploadFiles,
  getImageUrl,
  type CategoryItem,
} from '../../../../lib/api';
import RelatedProductsPicker from '../../RelatedProductsPicker';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [variantType, setVariantType] = useState('');
  const [variants, setVariants] = useState<{ name: string; price: number; stock: number }[]>([]);
  const [isVariable, setIsVariable] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    Promise.all([fetchProduct(id), fetchCategories()])
      .then(([p, cats]) => {
        setName(p.name);
        setDescription(p.description || '');
        setPrice(p.price);
        setStock(p.stock);
        setIsFeatured(!!p.isFeatured);
        setCategory(typeof p.category === 'object' ? p.category?._id || '' : '');
        setImages(p.images || []);
        setVariantType(p.variantType || '');
        setVariants(p.variants || []);
        setIsVariable(!!(p.variants && p.variants.length > 0));
        setRelatedProducts(
          (p.relatedProducts || []).map((r: any) => (typeof r === 'string' ? r : r._id)),
        );
        setCategories(cats.filter((c) => c.isActive));
      })
      .catch((e) => setError(e.message || 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const uploaded = await uploadFiles(Array.from(files));
      setImages((prev) => [...prev, ...uploaded.map((u) => u.url)]);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        isFeatured,
        category: category || undefined,
        images,
        relatedProducts: relatedProducts as any,
      };
      if (isVariable) {
        payload.variantType = variantType || undefined;
        payload.variants = variants.length ? variants : undefined;
      } else {
        payload.variantType = undefined;
        payload.variants = undefined;
      }
      await updateProduct(id, payload);
      setToast('Saved!');
      setTimeout(() => router.push('/dashboard/products'), 1000);
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-teal-400" /> {toast}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/products"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-500">Update product details and related items</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Base price (PKR)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
              />
              <span className="text-sm font-semibold text-gray-700">Featured product</span>
            </label>
          </div>
        </div>

        {/* Product Type Toggle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type</label>
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-1.5 w-fit">
            <button
              type="button"
              onClick={() => { setIsVariable(false); setVariants([]); setVariantType(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                !isVariable ? 'bg-teal-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => setIsVariable(true)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isVariable ? 'bg-teal-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Variable
            </button>
          </div>
        </div>

        {/* Variants — only shown when Variable */}
        {isVariable && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Variant Type
              </label>
              <input
                value={variantType}
                onChange={(e) => setVariantType(e.target.value)}
                placeholder="e.g. Size, Weight, Flavor, Pack"
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input
                    value={v.name}
                    onChange={(e) =>
                      setVariants((arr) =>
                        arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    placeholder="Variant name"
                    className="col-span-5 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                  />
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) =>
                      setVariants((arr) =>
                        arr.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)),
                      )
                    }
                    placeholder="Price"
                    className="col-span-3 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                  />
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) =>
                      setVariants((arr) =>
                        arr.map((x, j) => (j === i ? { ...x, stock: Number(e.target.value) } : x)),
                      )
                    }
                    placeholder="Stock"
                    className="col-span-3 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setVariants((arr) => arr.filter((_, j) => j !== i))}
                    className="col-span-1 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setVariants((v) => [...v, { name: '', price: 0, stock: 0 }])}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors mt-1"
              >
                <Plus className="w-4 h-4" /> Add variant
              </button>
            </div>
          </div>
        )}

        {/* Images */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Images</label>
          <div className="grid grid-cols-4 gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image src={getImageUrl(url)} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((a) => a.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 hover:bg-white shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-teal-400 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-teal-500">
              <Upload className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-semibold">Upload</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Related products picker */}
        <div className="pt-2 border-t border-gray-100">
          <RelatedProductsPicker
            value={relatedProducts}
            onChange={setRelatedProducts}
            excludeId={id}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Link
            href="/dashboard/products"
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
