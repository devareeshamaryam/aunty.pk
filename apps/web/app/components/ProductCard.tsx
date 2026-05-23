'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../lib/api';
import { Prefs } from '../lib/preferences';

interface Variant {
  name: string;
  price: number;
  stock: number;
}

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  subtitle?: string;
  variants?: Variant[];
  isFeatured?: boolean;
  stock?: number;
  avgRating?: number;
  reviewCount?: number;
}

/**
 * Compact product card.
 *  - Slightly tinted card body so it stands out from the page
 *  - Image sits INSIDE the card at the top (real aspect, not circular)
 *  - Title → price + "+" button. Tight vertical rhythm.
 */
export default function ProductCard({
  id,
  name,
  price,
  image,
  slug,
  variants,
  isFeatured,
  stock,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const hasVariants = Array.isArray(variants) && variants.length > 0;
  const startPrice = hasVariants ? variants![0].price : price;
  const outOfStock = stock === 0;
  const showVariantPrompt = hasVariants && variants!.length > 1;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || added) return;
    if (showVariantPrompt) {
      window.location.href = `/product/${slug}`;
      return;
    }
    addItem({
      productId: id,
      name,
      price: startPrice,
      quantity: 1,
      image,
      variant: hasVariants ? variants![0].name : undefined,
    } as any);
    Prefs.addedToCart(id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  };

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="relative bg-gray-50 hover:bg-gray-100/70 rounded-2xl shadow-[0_3px_14px_-8px_rgba(0,0,0,0.10)] hover:shadow-[0_8px_22px_-12px_rgba(0,0,0,0.18)] border border-gray-100 transition-all overflow-hidden flex flex-col"
    >
      {/* In-card image — bigger, real aspect (not cropped to circle) */}
      <Link
        href={`/product/${slug}`}
        className="relative w-full aspect-[4/3] block"
      >
        <Image
          src={getImageUrl(image)}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className={`object-cover transition-transform duration-300 hover:scale-[1.04] ${
            outOfStock ? 'grayscale opacity-70' : ''
          }`}
        />
        {isFeatured && !outOfStock && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-400 text-amber-900 rounded-full text-[10px] font-extrabold shadow">
            ★ Popular
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            Sold out
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col px-2.5 pt-1.5 pb-2.5 sm:px-3 sm:pt-2 sm:pb-3">
        <Link href={`/product/${slug}`} className="block">
          <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 uppercase tracking-tight leading-[1.2] line-clamp-2 min-h-[2.4em] hover:text-cyan-700 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Price + Add button — tight, right under title */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[14px] sm:text-base font-extrabold text-cyan-600 leading-none">
            {showVariantPrompt && (
              <span className="text-[10px] text-gray-400 font-medium mr-0.5">from</span>
            )}
            Rs. {startPrice.toLocaleString()}
          </span>
          <motion.button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`Add ${name}`}
            whileTap={{ scale: 0.9 }}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors flex-shrink-0 ${
              added
                ? 'bg-emerald-500 text-white'
                : outOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-600 text-white'
            }`}
          >
            {added ? (
              <Check className="w-4 h-4" strokeWidth={3} />
            ) : (
              <Plus className="w-4 h-4" strokeWidth={3} />
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
