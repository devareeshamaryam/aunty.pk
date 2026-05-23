'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { fetchProducts, type ProductItem } from '../lib/api';
import { Prefs } from '../lib/preferences';

/**
 * Personalised "Picks for you" row on the homepage.
 *
 * Algorithm (all client-side, no server changes):
 *   1. Read top categories from Prefs (browser-local).
 *   2. Fetch products from those categories first, fall back to the
 *      featured/latest pool if the user has no signal yet.
 *   3. Rank the pool by `Prefs.productScore`, mixing in light randomness
 *      so the row isn't identical every visit.
 *   4. Take the top N.
 *
 * Title swaps between "Picks for you" (signal) and "Try these" (cold start).
 */
export default function PicksForYou({ limit = 12 }: { limit?: number }) {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [hasSignal, setHasSignal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const signal = Prefs.hasSignal();
      setHasSignal(signal);
      const topCats = Prefs.topCategoryIds(3);

      // Build a candidate pool: first sample preferred categories,
      // then top up with featured / latest.
      const pool: ProductItem[] = [];
      const seen = new Set<string>();

      const addToPool = (arr: ProductItem[] | undefined) => {
        if (!arr) return;
        for (const p of arr) {
          if (!p?._id || seen.has(p._id)) continue;
          seen.add(p._id);
          pool.push(p);
        }
      };

      // Personalised slice
      for (const catId of topCats) {
        if (pool.length >= limit * 2) break;
        try {
          const r = await fetchProducts({ category: catId, limit: 16 });
          addToPool(r.products);
        } catch {
          /* ignore single-category failure */
        }
      }

      // Always blend in some featured + latest so cold-start works and there's
      // variety for returning users too.
      if (pool.length < limit * 2) {
        try {
          const f = await fetchProducts({ featured: true, limit: 16 });
          addToPool(f.products);
        } catch {}
      }
      if (pool.length < limit) {
        try {
          const latest = await fetchProducts({ limit: 24 });
          addToPool(latest.products);
        } catch {}
      }

      // Rank: score + tiny jitter so the row feels alive between visits
      const ranked = pool
        .map((p) => {
          const catId =
            p.category && typeof p.category === 'object'
              ? (p.category as any)._id
              : undefined;
          const score = Prefs.productScore(p._id, catId);
          return { p, score: score + Math.random() * 0.3 };
        })
        .sort((a, b) => b.score - a.score)
        .map((x) => x.p)
        .slice(0, limit);

      if (!cancelled) {
        setItems(ranked);
        setLoaded(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (!loaded) {
    return (
      <section className="py-5 sm:py-7 px-2 sm:px-4 lg:px-6">
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

  if (items.length === 0) return null;

  const title = hasSignal ? 'Picks for you' : 'Try these favourites';

  return (
    <section
      id="picks-for-you"
      className="py-3 sm:py-5 px-2 sm:px-4 lg:px-6 scroll-mt-24"
    >
      <div className="flex items-end justify-between mb-1 px-1 sm:px-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 sm:gap-x-4 gap-y-4 sm:gap-y-5 stagger-children">
        {items.map((p) => {
          const price = p.variants?.[0]?.price ?? p.price;
          return (
            <ProductCard
              key={p._id}
              id={p._id}
              name={p.name}
              price={price}
              image={p.images?.[0] || ''}
              slug={p.slug}
              variants={p.variants}
              isFeatured={p.isFeatured}
              stock={p.stock}
              avgRating={p.avgRating}
              reviewCount={p.reviewCount}
            />
          );
        })}
      </div>
    </section>
  );
}
