'use client';

import { useEffect, useState } from 'react';
import {
  fetchAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadFiles,
  getImageUrl,
  type BannerItem,
} from '../../lib/api';
import {
  Image as ImageIcon,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Upload,
  X,
} from 'lucide-react';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const b = await fetchAdminBanners();
      setBanners(b);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2200);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await deleteBanner(id);
      flash('Deleted');
      load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
  };

  const handleToggle = async (b: BannerItem) => {
    await updateBanner(b._id, { isActive: !b.isActive });
    load();
  };

  const handleMove = async (b: BannerItem, dir: -1 | 1) => {
    await updateBanner(b._id, { order: (b.order || 0) + dir });
    load();
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-bold">
          ✓ {toast}
        </div>
      )}

      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage hero slider images on the homepage.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm shadow"
        >
          <Plus className="w-4 h-4" /> Add banner
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center text-teal-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-700">No banners yet</h3>
          <p className="text-sm text-gray-500">Upload your first banner image to get started.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((b) => (
              <li
                key={b._id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
              >
                <div className="relative aspect-[16/7] bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(b.imageUrl)}
                    alt={b.alt || ''}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ring-1 ${
                      b.isActive
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-gray-100 text-gray-500 ring-gray-200'
                    }`}
                  >
                    {b.isActive ? 'Live' : 'Hidden'}
                  </span>
                </div>
                <div className="p-3 space-y-1">
                  {b.linkUrl && (
                    <p className="text-xs text-gray-500 truncate">→ {b.linkUrl}</p>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMove(b, -1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(b, 1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggle(b)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg inline-flex items-center gap-1"
                      >
                        {b.isActive ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Show
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(b._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      )}

      {adding && (
        <AddBannerModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
            flash('Banner added');
          }}
        />
      )}
    </div>
  );
}

function AddBannerModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [imageUrl, setImageUrl] = useState('');
  const [mobileUrl, setMobileUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const upload = async (file: File, setUrl: (u: string) => void, setBusy: (b: boolean) => void) => {
    setBusy(true);
    setErr('');
    try {
      const out = await uploadFiles([file]);
      setUrl(out[0].url);
    } catch (e: any) {
      setErr(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!imageUrl) return setErr('Please upload a banner image first.');
    setSaving(true);
    try {
      await createBanner({
        imageUrl,
        imageUrlMobile: mobileUrl || undefined,
        linkUrl: linkUrl || undefined,
        alt: alt || undefined,
        isActive: true,
        order: 99,
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold">Add banner</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>
        <div className="p-4 space-y-3.5">
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
              {err}
            </div>
          )}

          <ImageField
            label="Desktop image (recommended 21:9 — e.g. 1920×820)"
            url={imageUrl}
            onUpload={(f) => upload(f, setImageUrl, setUploading)}
            onClear={() => setImageUrl('')}
            uploading={uploading}
          />

          <ImageField
            label="Mobile image (optional, recommended 4:3 — e.g. 800×600)"
            url={mobileUrl}
            onUpload={(f) => upload(f, setMobileUrl, setUploadingMobile)}
            onClear={() => setMobileUrl('')}
            uploading={uploadingMobile}
          />

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Link URL (optional)
            </p>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/collections/biryani"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Alt text (accessibility)
            </p>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Eid sale 30% off"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg"
            />
          </div>

          <button
            onClick={save}
            disabled={saving || !imageUrl}
            className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold inline-flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Save banner
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageField({
  label,
  url,
  uploading,
  onUpload,
  onClear,
}: {
  label: string;
  url: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      {url ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getImageUrl(url)} alt="" className="w-full h-32 object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 text-red-500 flex items-center justify-center shadow"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-teal-400 hover:bg-teal-50/40 cursor-pointer text-gray-400 hover:text-teal-500 transition-colors">
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">Click to upload</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
        </label>
      )}
    </div>
  );
}
