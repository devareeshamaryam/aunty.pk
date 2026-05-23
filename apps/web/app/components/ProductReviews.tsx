'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Star,
  Camera,
  X,
  Send,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
  BadgeCheck,
} from 'lucide-react';
import {
  fetchProductReviews,
  fetchProductReviewStats,
  submitReview,
  uploadReviewPhoto,
  canReviewProduct,
  getImageUrl,
  type ReviewItem,
  type ReviewStats,
} from '../lib/api';
import { useGuest } from '../context/GuestContext';

const RATING_LABELS = ['', 'Poor', 'Below average', 'Average', 'Good', 'Excellent'];
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

interface Props {
  productId: string;
  productName?: string;
}

export default function ProductReviews({ productId, productName }: Props) {
  const { guestId } = useGuest();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null);
  const [eligibility, setEligibility] = useState<{
    canReview: boolean;
    reason: 'ok' | 'already' | 'no-order' | 'invalid';
    orderId: string | null;
  } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        fetchProductReviews(productId),
        fetchProductReviewStats(productId),
      ]);
      setReviews(r);
      setStats(s);
    } catch (e) {
      // best-effort
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) load();
  }, [productId]);

  useEffect(() => {
    if (productId && guestId) {
      canReviewProduct(productId, guestId)
        .then(setEligibility)
        .catch(() => setEligibility({ canReview: false, reason: 'invalid', orderId: null }));
    }
  }, [productId, guestId]);

  const avg = stats?.averageRating ?? 0;
  const total = stats?.reviewCount ?? reviews.length;

  return (
    <section className="space-y-4">
      {/* Summary header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-br from-amber-50 to-cyan-50/50 rounded-2xl p-4 border border-amber-100">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-none">
              {avg.toFixed(1)}
            </div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-1">
              out of 5
            </p>
          </div>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Based on <span className="font-semibold">{total}</span>{' '}
              {total === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {eligibility?.canReview ? (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm shadow-md shadow-cyan-500/30 transition-all active:scale-95"
          >
            <Star className="w-4 h-4 fill-current" />
            Write a review
          </button>
        ) : eligibility?.reason === 'already' ? (
          <span className="text-xs text-gray-500 inline-flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            You&apos;ve reviewed this
          </span>
        ) : null}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-gray-400 text-center py-8">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-10 text-center">
          <Star className="w-9 h-9 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500">No reviews yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to share your thoughts.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard
              key={r._id}
              review={r}
              onPhotoClick={(images, idx) => setLightbox({ images, idx })}
            />
          ))}
        </ul>
      )}

      {showModal && (
        <ReviewModal
          productId={productId}
          productName={productName || 'this product'}
          onClose={() => setShowModal(false)}
          onSubmitted={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {lightbox && (
        <ReviewLightbox
          images={lightbox.images}
          startIndex={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}

// ─── Review card ──────────────────────────────────────────────────────
function ReviewCard({
  review,
  onPhotoClick,
}: {
  review: ReviewItem;
  onPhotoClick: (images: string[], idx: number) => void;
}) {
  const name = review.reviewerName || (review as any).user?.name || 'Guest';
  const initial = name.charAt(0).toUpperCase();

  return (
    <li className="rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-1 truncate">
              {name}
              {review.isVerified && (
                <BadgeCheck className="w-3.5 h-3.5 text-cyan-500" />
              )}
            </p>
            <p className="text-[11px] text-gray-400">
              {new Date(review.createdAt).toLocaleDateString('en-PK', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3.5 h-3.5 ${
                s <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {review.comment}
        </p>
      )}

      {review.photos && review.photos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {review.photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => onPhotoClick(review.photos!.map(getImageUrl), i)}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:scale-[1.04] transition-transform"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {review.ownerReply && (
        <div className="mt-3 rounded-xl bg-cyan-50 border border-cyan-100 p-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-cyan-700 mb-0.5">
            Reply from Aunty.pk
          </p>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
            {review.ownerReply}
          </p>
        </div>
      )}
    </li>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────
function ReviewModal({
  productId,
  productName,
  onClose,
  onSubmitted,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { guestId, profile, setProfile } = useGuest();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [photos, setPhotos] = useState<{ key: string; file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setErr('');
    const slots = MAX_PHOTOS - photos.length;
    if (slots <= 0) return setErr(`Max ${MAX_PHOTOS} photos.`);
    const next: typeof photos = [];
    for (const f of Array.from(files).slice(0, slots)) {
      if (!f.type.startsWith('image/')) {
        setErr('Only image files allowed.');
        continue;
      }
      if (f.size > MAX_PHOTO_BYTES) {
        setErr('Each image must be under 5MB.');
        continue;
      }
      next.push({
        key: `${f.name}-${f.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        preview: URL.createObjectURL(f),
      });
    }
    setPhotos((p) => [...p, ...next]);
  };

  const removePhoto = (key: string) => {
    setPhotos((arr) => {
      const x = arr.find((p) => p.key === key);
      if (x) URL.revokeObjectURL(x.preview);
      return arr.filter((p) => p.key !== key);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (rating === 0) return setErr('Please select a rating.');
    if (!name.trim()) return setErr('Please enter your name.');
    if (!phone.trim() || !/^03\d{9}$/.test(phone.replace(/[-\s]/g, ''))) {
      return setErr('Valid Pakistani mobile number required (03xxxxxxxxx).');
    }
    if (comment.trim().length < 5) return setErr('Please write at least 5 characters.');

    setSubmitting(true);
    try {
      const uploaded: string[] = [];
      for (const p of photos) {
        const res = await uploadReviewPhoto(p.file);
        uploaded.push(res.url);
      }
      await submitReview({
        product: productId,
        rating,
        comment: comment.trim(),
        reviewerName: name.trim(),
        reviewerPhone: phone.trim(),
        guestId,
        photos: uploaded,
      });
      setProfile({ ...profile, name: name.trim(), phone: phone.trim() });
      setSuccess(true);
      setTimeout(() => onSubmitted(), 1500);
    } catch (e: any) {
      setErr(e?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(
    () => () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-3xl">
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900">Write a review</h2>
            <p className="text-[11px] text-gray-500 truncate max-w-[260px]">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-900">Thank you!</h3>
            <p className="text-sm text-gray-500 mt-1">Your review has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
                {err}
              </div>
            )}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Your rating
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        s <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-gray-500">
                  {RATING_LABELS[hoverRating || rating] || ''}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">
                Your review
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="What did you like about this product?"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 outline-none resize-none"
              />
              <p className="text-[10px] text-gray-400 text-right mt-0.5">
                {comment.length}/2000
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">
                  Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ali Khan"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">
                  Mobile *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03xxxxxxxxx"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Photos (optional, max {MAX_PHOTOS})
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {photos.map((p) => (
                  <div
                    key={p.key}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(p.key)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/90 text-white flex items-center justify-center"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 hover:border-cyan-400 hover:bg-cyan-50/40 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-cyan-500 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-[9px] font-semibold mt-0.5">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => addPhotos(e.target.files)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-60 text-white font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all active:scale-[0.98]"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────
function ReviewLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
      >
        <X className="w-5 h-5" />
      </button>
      <span className="absolute top-5 left-4 text-white/70 text-xs font-semibold">
        {idx + 1} / {images.length}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx]}
        alt=""
        className="max-h-[88vh] max-w-[92vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
