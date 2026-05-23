'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, Plus, X, Check } from 'lucide-react';
import { fetchProducts, getImageUrl, type ProductItem } from '../../lib/api';

interface Props {
  value: string[]; // selected product IDs
  onChange: (ids: string[]) => void;
  excludeId?: string; // hide the product being edited from picker
  max?: number;
}

/**
 * Admin multi-select picker for "related products" / upsells.
 * Foodpanda-style: customer sees these above the Order Now button on the product page.
 */
export default function RelatedProductsPicker({
  value,
  onChange,
  excludeId,
  max = 12,
}: Props) {
  const [all, setAll] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProducts({ limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setAll(res.products);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, ProductItem>();
    for (const p of all) m.set(p._id, p);
    return m;
  }, [all]);

  const selected = useMemo(
    () => value.map((id) => byId.get(id)).filter(Boolean) as ProductItem[],
    [value, byId],
  );

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (p) =>
        p._id !== excludeId &&
        !value.includes(p._id) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [all, value, excludeId, query]);

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (value.length < max) onChange([...value, id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Related Products
          </label>
          <p className="text-xs text-gray-500">
            Shown to customers above the order button (max {max}).
          </p>
        </div>
        <span className="text-xs font-bold text-teal-600">
          {value.length} / {max}
        </span>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((p) => (
            <div
              key={p._id}
              className="flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-full bg-teal-50 border border-teal-200"
            >
              {p.images?.[0] && (
                <Image
                  src={getImageUrl(p.images[0])}
                  alt=""
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full object-cover"
                />
              )}
              <span className="text-xs font-semibold text-teal-800 truncate max-w-[140px]">
                {p.name}
              </span>
              <button
                type="button"
                onClick={() => toggle(p._id)}
                className="p-0.5 rounded-full text-teal-600 hover:bg-teal-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Open picker */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/30 hover:bg-teal-50 text-teal-700 text-sm font-semibold inline-flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" />
          {selected.length ? 'Add more' : 'Pick related products'}
        </button>
      )}

      {/* Picker dropdown */}
      {open && (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="flex-1 text-sm bg-transparent border-none outline-none"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2"
            >
              Close
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-6">Loading products…</p>
            ) : candidates.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                {query ? 'No matches' : 'No more products to add'}
              </p>
            ) : (
              <ul>
                {candidates.map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => toggle(p._id)}
                      disabled={value.length >= max}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-teal-50 transition-colors disabled:opacity-50"
                    >
                      {p.images?.[0] ? (
                        <Image
                          src={getImageUrl(p.images[0])}
                          alt=""
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Rs. {p.price?.toLocaleString()}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
