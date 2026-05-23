'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  fetchAllReviews,
  updateReviewStatus,
  updateReview,
  deleteReview,
  adminCreateReview,
  uploadReviewPhoto,
  fetchProducts,
  getImageUrl,
  type ReviewItem,
  type ProductItem,
} from '../../lib/api';
import {
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Trash2,
  MessageSquare,
  Edit2,
  Plus,
  Loader2,
  Camera,
  BadgeCheck,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
};

export default function AdminReviewsPage() {
  const [data, setData] = useState<{
    reviews: ReviewItem[];
    total: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'approved' | 'pending' | 'rejected'>('ALL');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ReviewItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllReviews({
        page,
        limit: 20,
        status: filter === 'ALL' ? undefined : filter,
      });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2200);
  };

  const handleStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      await updateReviewStatus(id, status);
      showToast(`Marked as ${status}`);
      load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await deleteReview(id);
      showToast('Deleted');
      load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-teal-400" /> {toast}
        </div>
      )}

      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            Moderate customer reviews · {data?.total ?? 0} total
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm shadow"
        >
          <Plus className="w-4 h-4" /> Add review
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-2">
        {(['ALL', 'approved', 'pending', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'ALL' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="p-10 flex items-center justify-center text-teal-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !data || data.reviews.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Star className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            No reviews yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.reviews.map((r) => {
              const productName =
                typeof r.product === 'object' && r.product !== null
                  ? (r.product as any).name
                  : 'Unknown product';
              return (
                <li key={r._id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-sm text-gray-900 flex items-center gap-1">
                          {r.reviewerName || 'Guest'}
                          {r.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-cyan-500" />}
                        </p>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ring-1 ${
                            STATUS_COLORS[r.status]
                          }`}
                        >
                          {r.status}
                        </span>
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
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        on <span className="font-semibold">{productName}</span> ·{' '}
                        {new Date(r.createdAt).toLocaleString()}
                        {r.reviewerPhone && (
                          <>
                            {' · '}
                            <a
                              href={`tel:${r.reviewerPhone}`}
                              className="text-cyan-600 font-semibold hover:underline"
                            >
                              📞 {r.reviewerPhone}
                            </a>
                          </>
                        )}
                      </p>
                      {r.comment && (
                        <p className="text-sm text-gray-700 whitespace-pre-line">{r.comment}</p>
                      )}
                      {r.photos && r.photos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {r.photos.map((p, i) => (
                            <a
                              key={i}
                              href={getImageUrl(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:scale-105 transition-transform"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getImageUrl(p)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      {r.ownerReply && (
                        <div className="mt-2 bg-cyan-50 border border-cyan-100 rounded-lg p-2 text-xs">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 mb-0.5">
                            Your reply
                          </p>
                          <p className="text-gray-700">{r.ownerReply}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {r.status !== 'approved' && (
                      <button
                        onClick={() => handleStatus(r._id, 'approved')}
                        className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatus(r._id, 'rejected')}
                        className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    )}
                    <button
                      onClick={() => setEditing(r)}
                      className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit / Reply
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="text-xs font-bold text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {data && data.totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400">
              Page {page} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditReviewModal
          review={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
            showToast('Saved');
          }}
        />
      )}

      {adding && (
        <AddReviewModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
            showToast('Review added');
          }}
        />
      )}
    </div>
  );
}

// ─── Edit modal ─────────────────────────────────────────────────────
function EditReviewModal({
  review,
  onClose,
  onSaved,
}: {
  review: ReviewItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || '');
  const [name, setName] = useState(review.reviewerName || '');
  const [reply, setReply] = useState(review.ownerReply || '');
  const [verified, setVerified] = useState(review.isVerified || false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      await updateReview(review._id, {
        rating,
        comment,
        reviewerName: name,
        ownerReply: reply,
        isVerified: verified,
      });
      onSaved();
    } catch (e: any) {
      setErr(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold">Edit review</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
              {err}
            </div>
          )}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Rating
            </p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star
                    className={`w-6 h-6 ${
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <Field label="Name" value={name} onChange={setName} />
          <Field
            label="Comment"
            value={comment}
            onChange={setComment}
            multiline
          />
          <Field
            label="Owner reply (visible to customers)"
            value={reply}
            onChange={setReply}
            multiline
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400"
            />
            <span>Mark as verified customer</span>
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add modal ──────────────────────────────────────────────────────
function AddReviewModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [verified, setVerified] = useState(true);
  const [photos, setPhotos] = useState<{ key: string; file: File; preview: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchProducts({ limit: 200 })
      .then((r) => setProducts(r.products))
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      if (!productId) return setErr('Select a product');
      const urls: string[] = [];
      for (const p of photos) {
        const r = await uploadReviewPhoto(p.file);
        urls.push(r.url);
      }
      await adminCreateReview({
        product: productId,
        rating,
        comment,
        reviewerName: name || 'Customer',
        photos: urls,
        isVerified: verified,
        status: 'approved',
      });
      onSaved();
    } catch (e: any) {
      setErr(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold">Add review</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
              {err}
            </div>
          )}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Product
            </p>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg"
            >
              <option value="">Select…</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Rating
            </p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star
                    className={`w-6 h-6 ${
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <Field label="Reviewer name" value={name} onChange={setName} />
          <Field label="Comment" value={comment} onChange={setComment} multiline />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <Camera className="w-3 h-3" /> Photos (optional)
            </p>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {photos.map((p) => (
                <div key={p.key} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(p.preview);
                      setPhotos((arr) => arr.filter((x) => x.key !== p.key));
                    }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/90 text-white flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 hover:border-teal-400 flex items-center justify-center cursor-pointer text-gray-400">
                  <Plus className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      const next: typeof photos = [];
                      for (const f of Array.from(files).slice(0, 5 - photos.length)) {
                        next.push({
                          key: `${f.name}-${f.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
                          file: f,
                          preview: URL.createObjectURL(f),
                        });
                      }
                      setPhotos((p) => [...p, ...next]);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="w-4 h-4 rounded text-teal-500"
            />
            <span>Mark as verified customer</span>
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold inline-flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add review
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-teal-500/30 outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 outline-none"
        />
      )}
    </div>
  );
}
