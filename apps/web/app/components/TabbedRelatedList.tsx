'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../lib/api';
import type { ProductItem } from '../lib/api';

export interface RelatedTab {
  id: string;
  label: string;
  products: ProductItem[];
}

interface Props {
  tabs: RelatedTab[];
  /** Optional outer heading rendered above the tab strip. */
  heading?: string;
}

/**
 * KFC-style tabbed recommendations.
 *  - Horizontally-scrolling tab strip on mobile, normal flex on desktop
 *  - Active tab gets a coloured pill background
 *  - Each tab renders a *list*-style strip of products (compact rows) so
 *    multiple items fit without dominating the page
 *  - Empty tabs are filtered out automatically; if only one tab remains,
 *    the tab strip hides and only the list shows
 */
export default function TabbedRelatedList({ tabs, heading }: Props) {
  const visible = useMemo(
    () => tabs.filter((t) => t.products && t.products.length > 0),
    [tabs],
  );
  const [active, setActive] = useState(0);

  if (visible.length === 0) return null;

  const safeActive = Math.min(active, visible.length - 1);
  const current = visible[safeActive];

  return (
    <section className="space-y-3">
      {heading && (
        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 px-1">
          {heading}
        </h3>
      )}

      {/* Tabs strip (hidden when only one tab) */}
      {visible.length > 1 && (
        <div className="flex gap-2 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide pb-1">
          {visible.map((t, i) => {
            const isActive = i === safeActive;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(i)}
                className={`relative px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                {t.label}
                <span
                  className={`ml-1.5 text-[10px] font-bold ${
                    isActive ? 'text-white/80' : 'text-gray-400'
                  }`}
                >
                  {t.products.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.ul
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="divide-y divide-gray-100 border-y border-gray-100 sm:border sm:rounded-2xl sm:divide-y sm:bg-white"
        >
          {current.products.map((p) => (
            <RelatedListItem key={p._id} product={p} />
          ))}
        </motion.ul>
      </AnimatePresence>
    </section>
  );
}

function RelatedListItem({ product: p }: { product: ProductItem }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
  const price = hasVariants ? p.variants![0].price : p.price;
  const img = p.images?.[0];
  const showVariantPrompt = hasVariants && p.variants!.length > 1;
  const showRating = (p.reviewCount ?? 0) > 0 && (p.avgRating ?? 0) > 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showVariantPrompt) {
      window.location.href = `/product/${p.slug}`;
      return;
    }
    addItem({
      productId: p._id,
      name: p.name,
      price,
      quantity: 1,
      image: img,
      variant: hasVariants ? p.variants![0].name : undefined,
    } as any);
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  };

  return (
    <li>
      <Link
        href={`/product/${p.slug}`}
        className="flex items-center gap-3 px-2 sm:px-3 py-2.5 hover:bg-cyan-50/40 transition-colors"
      >
        {/* Square thumbnail */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
          {img ? (
            <Image
              src={getImageUrl(img)}
              alt={p.name}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{p.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-extrabold text-cyan-600">
              {showVariantPrompt && (
                <span className="text-[10px] text-gray-400 font-medium mr-1">from</span>
              )}
              Rs. {price?.toLocaleString()}
            </span>
            {showRating && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {p.avgRating!.toFixed(1)}
                <span className="text-gray-400">·{p.reviewCount}</span>
              </span>
            )}
          </div>
        </div>

        {/* Add button (right-aligned) */}
        <motion.button
          type="button"
          onClick={handleAdd}
          whileTap={{ scale: 0.9 }}
          aria-label={`Add ${p.name}`}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 transition-colors ${
            added
              ? 'bg-emerald-500 text-white'
              : 'bg-cyan-500 hover:bg-cyan-600 text-white'
          }`}
        >
          {added ? (
            <Check className="w-4 h-4" strokeWidth={3} />
          ) : (
            <Plus className="w-4 h-4" strokeWidth={3} />
          )}
        </motion.button>
      </Link>
    </li>
  );
}
