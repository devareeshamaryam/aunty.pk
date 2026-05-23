'use client';

import { useEffect, useState } from 'react';
import { fetchProducts, type ProductItem } from '../lib/api';
import TabbedRelatedList, { type RelatedTab } from './TabbedRelatedList';

interface Props {
  /** IDs already in cart — filtered out from recommendations. */
  cartProductIds: string[];
}

/**
 * "Pair it with" recommendations shown on the cart page.
 * Reuses the same compact list component the single-product page uses,
 * so cards/lists feel consistent across the site.
 */
export default function CartRecommendations({ cartProductIds }: Props) {
  const [recs, setRecs] = useState<ProductItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const featured = await fetchProducts({ featured: true, limit: 12 });
        let pool = featured.products || [];
        if (pool.length < 4) {
          const latest = await fetchProducts({ limit: 12 });
          pool = [...pool, ...(latest.products || [])];
        }
        const seen = new Set<string>();
        const cartSet = new Set(cartProductIds);
        const list = pool
          .filter((p) => {
            if (!p?._id) return false;
            if (cartSet.has(p._id)) return false;
            if (seen.has(p._id)) return false;
            seen.add(p._id);
            return true;
          })
          .slice(0, 10);
        if (!cancelled) setRecs(list);
      } catch {
        if (!cancelled) setRecs([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cartProductIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded || recs.length === 0) return null;

  const tabs: RelatedTab[] = [{ id: 'picks', label: 'Pair it with', products: recs }];
  return <TabbedRelatedList tabs={tabs} heading="Pair it with" />;
}
