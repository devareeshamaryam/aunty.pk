'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { fetchProducts, type ProductItem } from '../lib/api';

function SearchContent() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProducts({ search: q, limit: 50 })
      .then((res) => setProducts(res.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <SearchIcon className="w-5 h-5 text-cyan-500 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 truncate">
                {q ? `Results for "${q}"` : 'Search'}
              </h1>
              {!loading && q && (
                <p className="text-xs text-gray-500">
                  {products.length} item{products.length === 1 ? '' : 's'} found
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-3 sm:px-5 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-700 mb-1">No products found</h2>
            <p className="text-sm text-gray-500">
              {q ? `Try a different search term.` : `Type something to search.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {products.map((p) => (
              <ProductCard
                key={p._id}
                id={p._id}
                name={p.name}
                price={p.price}
                image={p.images?.[0] || ''}
                slug={p.slug}
                variants={p.variants}
                isFeatured={p.isFeatured}
                stock={p.stock}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading…</div></div>}>
      <SearchContent />
    </Suspense>
  );
}
