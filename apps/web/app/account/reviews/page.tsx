'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowLeft, Star, Loader2, BadgeCheck } from 'lucide-react';
import { useGuest } from '../../context/GuestContext';
import {
  fetchMyReviews,
  getImageUrl,
  type ReviewItem,
} from '../../lib/api';

const STATUS_STYLE: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
};

const STATUS_LABEL: Record<string, string> = {
  approved: 'Live',
  pending: 'Pending review',
  rejected: 'Hidden',
};

export default function MyReviewsPage() {
  const { guestId } = useGuest();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!guestId) return;
    let cancelled = false;
    setLoading(true);
    setErr('');
    fetchMyReviews(guestId)
      .then((r) => {
        if (!cancelled) setReviews(r);
      })
      .catch((e: any) => {
        if (!cancelled) setErr(e.message || 'Failed to load reviews');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guestId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-3 sm:px-5 py-4 flex items-center gap-3">
          <Link
            href="/account"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">My Reviews</h1>
            <p className="text-xs text-gray-500">
              Reviews you have posted · one per product · cannot be edited
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-6">
        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading reviews…
          </div>
        ) : err ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
            {err}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No reviews yet</h3>
            <p className="text-sm text-gray-500 mb-5">
              You can review a product once you receive it.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm"
            >
              Browse menu
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li
                key={r._id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-2">
                  {typeof r.product === 'object' && (r.product as any).images?.[0] && (
                    <Link
                      href={`/product/${(r.product as any).slug}`}
                      className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0"
                    >
                      <Image
                        src={getImageUrl((r.product as any).images[0])}
                        alt={(r.product as any).name}
                        fill
                        sizes="48px"
                        className="object-contain p-0.5"
                      />
                    </Link>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={
                          typeof r.product === 'object'
                            ? `/product/${(r.product as any).slug}`
                            : '#'
                        }
                        className="font-semibold text-sm text-gray-900 truncate hover:text-cyan-600 transition-colors"
                      >
                        {typeof r.product === 'object' ? (r.product as any).name : 'Product'}
                      </Link>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ring-1 ${STATUS_STYLE[r.status] || ''}`}
                      >
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                      {r.isVerified && (
                        <BadgeCheck className="w-3.5 h-3.5 text-cyan-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= r.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {r.comment && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {r.comment}
                  </p>
                )}

                {r.photos && r.photos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {r.photos.map((p, i) => (
                      <a
                        key={i}
                        href={getImageUrl(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getImageUrl(p)} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {r.ownerReply && (
                  <div className="mt-3 bg-cyan-50 border border-cyan-100 rounded-xl p-2.5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-cyan-700 mb-0.5">
                      Reply from Aunty.pk
                    </p>
                    <p className="text-xs text-gray-700 leading-relaxed">{r.ownerReply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
