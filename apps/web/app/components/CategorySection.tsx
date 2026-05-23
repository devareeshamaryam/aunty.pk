'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  slug: string;
  stock?: number;
  isFeatured?: boolean;
  variants?: Array<{ name: string; price: number; stock: number }>;
  avgRating?: number;
  reviewCount?: number;
}

interface CategorySectionProps {
  categoryId?: string;
  categoryName: string;
  categorySlug?: string;
  categoryImage?: string;
  categoryDescription?: string;
  isPopular?: boolean;
}

export default function CategorySection({
  categoryId,
  categoryName,
  categorySlug,
  categoryDescription,
  isPopular = false,
}: CategorySectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
        const url = isPopular
          ? `${API_URL}/products/latest?limit=24`
          : categoryId
          ? `${API_URL}/products?category=${categoryId}&limit=200`
          : '';
        if (!url) return;

        const res = await fetch(url);
        const data = await res.json();
        setProducts(isPopular ? data || [] : data.products || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId, isPopular]);

  if (loading) {
    return (
      <section className="py-5 px-2 sm:px-4 lg:px-6">
        <div className="skeleton h-7 w-44 mb-0" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 sm:gap-x-4 gap-y-4 sm:gap-y-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <div className="skeleton aspect-[4/3] rounded-none" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isPopular && products.length === 0) return null;

  return (
    <section
      id={isPopular ? 'category-popular' : `category-${categorySlug}`}
      className="py-3 sm:py-5 px-2 sm:px-4 lg:px-6 scroll-mt-24"
    >
      {/* Section header */}
      <div className="flex items-end justify-between mb-1 px-1 sm:px-0">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
            {isPopular && <span className="mr-1.5">🔥</span>}
            {categoryName}
          </h2>
          {categoryDescription && (
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {categoryDescription}
            </p>
          )}
          {!categoryDescription && isPopular && (
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Most ordered right now
            </p>
          )}
        </div>
        <span className="text-[11px] sm:text-xs font-semibold text-gray-400 whitespace-nowrap">
          {products.length} {products.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 sm:gap-x-4 gap-y-4 sm:gap-y-5 stagger-children">
          {products.map((p) => (
            <ProductCard
              key={p._id}
              id={p._id}
              name={p.name}
              price={p.variants?.[0]?.price ?? p.price}
              image={p.images?.[0] ?? ''}
              slug={p.slug}
              variants={p.variants}
              isFeatured={p.isFeatured}
              stock={p.stock}
              avgRating={p.avgRating}
              reviewCount={p.reviewCount}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-400 font-medium">
            No products in this category yet.
          </p>
        </div>
      )}
    </section>
  );
}
