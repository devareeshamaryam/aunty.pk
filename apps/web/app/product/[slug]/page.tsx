'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  Trash2,
} from 'lucide-react';
import WhatsAppIcon from '@/app/components/icons/WhatsAppIcon';
import {
  fetchProductBySlug,
  fetchProducts,
  getImageUrl,
  ProductItem,
} from '@/app/lib/api';
import { useCart } from '@/app/context/CartContext';
import ImageLightbox from '@/app/components/ImageLightbox';
import TabbedRelatedList, { type RelatedTab } from '@/app/components/TabbedRelatedList';
import ProductReviews from '@/app/components/ProductReviews';
import { Prefs } from '@/app/lib/preferences';
import { openWhatsApp } from '@/app/lib/whatsapp';
import { useStoreContact } from '@/app/context/SettingsContext';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const {
    addItem, totalItems, totalPrice,
    getItemQuantity, isItemInCart, updateQuantity, removeItem,
  } = useCart();
  const { whatsapp } = useStoreContact();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [freshQty, setFreshQty] = useState(1);
  const [siblings, setSiblings] = useState<ProductItem[]>([]);
  // Description: open by default on desktop, collapsed on mobile. Resolved
  // client-side to avoid SSR hydration mismatch when using window.innerWidth.
  const [descOpen, setDescOpen] = useState(false);
  useEffect(() => {
    setDescOpen(typeof window !== 'undefined' && window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    if (slug) {
      const canonicalUrl = `https://www.aunty.pk/product/${slug}`;
      let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
      if (link) link.setAttribute('href', canonicalUrl);
      else {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', canonicalUrl);
        document.head.appendChild(link);
      }
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        if (p.variants && p.variants.length > 0) {
          setSelectedVariant(p.variants[0].name);
        }
      })
      .catch((e) => console.error('Failed to fetch product:', e))
      .finally(() => setLoading(false));
  }, [slug]);

  // Reset fresh qty when variant changes
  useEffect(() => {
    setFreshQty(1);
  }, [selectedVariant]);

  // ── Personalisation: track view + dwell time so the homepage can recommend
  //    similar items. Soft event at 10s, deep at 30s — only fired once each. ──
  useEffect(() => {
    if (!product?._id) return;
    const catId =
      product.category && typeof product.category === 'object'
        ? (product.category as any)._id
        : undefined;
    Prefs.view(product._id, catId);

    const soft = window.setTimeout(() => {
      if (!document.hidden) Prefs.dwellSoft(product._id, catId);
    }, 10_000);
    const deep = window.setTimeout(() => {
      if (!document.hidden) Prefs.dwellDeep(product._id, catId);
    }, 30_000);

    return () => {
      window.clearTimeout(soft);
      window.clearTimeout(deep);
    };
  }, [product?._id]);

  // Pull more from the same category (sibling products) for the tabbed list
  useEffect(() => {
    if (!product?.category || typeof product.category !== 'object' || !product.category._id) {
      setSiblings([]);
      return;
    }
    const catId = product.category._id;
    let cancelled = false;
    fetchProducts({ category: catId, limit: 12 })
      .then((res) => {
        if (cancelled) return;
        setSiblings((res.products || []).filter((p) => p._id !== product._id).slice(0, 10));
      })
      .catch(() => !cancelled && setSiblings([]));
    return () => { cancelled = true; };
  }, [product?._id, product?.category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">Product not found</h1>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-colors"
        >
          Back to home
        </button>
      </div>
    );
  }

  const variant = product.variants?.find((v) => v.name === selectedVariant);
  const currentPrice = variant ? variant.price : product.price;
  const currentStock = variant ? variant.stock : product.stock;
  const isUnavailable = currentStock !== undefined && currentStock <= 0;

  // Smart cart awareness
  const inCart = isItemInCart(product._id, selectedVariant || undefined);
  const cartQty = getItemQuantity(product._id, selectedVariant || undefined);
  const maxQty = currentStock || 999;

  const handleAddToCart = () => {
    if (isUnavailable) return;
    addItem({
      productId: product._id,
      name: product.name,
      price: currentPrice,
      quantity: freshQty,
      image: product.images[0],
      variant: selectedVariant || undefined,
      slug: product.slug,
      maxStock: currentStock,
    } as any);
    // Personalisation signal — strongest non-purchase event
    const catId =
      product.category && typeof product.category === 'object'
        ? (product.category as any)._id
        : undefined;
    Prefs.addedToCart(product._id, catId);
    setAddedToCart(true);
    setFreshQty(1);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleCartPlus = () => {
    if (cartQty < maxQty) {
      updateQuantity(product._id, cartQty + 1, selectedVariant || undefined);
    }
  };

  const handleCartMinus = () => {
    if (cartQty > 1) {
      updateQuantity(product._id, cartQty - 1, selectedVariant || undefined);
    } else {
      removeItem(product._id, selectedVariant || undefined);
    }
  };

  const handleWhatsAppOrder = () => {
    const qty = inCart ? cartQty : freshQty;
    const variantText = selectedVariant ? ` (${selectedVariant})` : '';
    const message = `Hi, I want to order:\n\n*${product.name}*${variantText}\nQuantity: ${qty}\nTotal: Rs. ${(currentPrice * qty).toLocaleString()}`;
    openWhatsApp(whatsapp, message);
  };

  const next = () => setSelectedImage((p) => (p + 1) % product.images.length);
  const prev = () =>
    setSelectedImage((p) => (p - 1 + product.images.length) % product.images.length);

  const related =
    Array.isArray((product as any).relatedProducts)
      ? (product as any).relatedProducts.filter((r: any) => r && typeof r === 'object' && r._id)
      : [];

  return (
    <div className={`min-h-screen bg-white ${totalItems > 0 ? 'pb-24' : 'pb-8'}`}>
      {/* Compact back bar */}
      <div className="px-3 sm:px-5 pt-2 pb-1.5 sm:py-3 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-cyan-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-8 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3 sm:gap-5 lg:gap-14 lg:items-center">
        {/* Gallery — full square image, no border radius (KFC style) */}
        <div className="space-y-1.5">
          <div
            className="relative w-52 h-52 sm:w-64 sm:h-64 lg:w-full lg:h-auto lg:aspect-square lg:max-w-[460px] mx-auto overflow-hidden bg-white cursor-zoom-in group"
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={getImageUrl(product.images[selectedImage] || product.images[0])}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 50vw"
              className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />

            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur text-gray-700 hover:bg-white shadow flex items-center justify-center active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur text-gray-700 hover:bg-white shadow flex items-center justify-center active:scale-95 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/55 text-white text-[11px] font-semibold backdrop-blur">
                  {selectedImage + 1} / {product.images.length}
                </span>
              </>
            )}
          </div>

          {/* Thumbnails — desktop only. On mobile we keep things minimal
              and rely on the lightbox + arrow buttons over the hero image. */}
          {product.images.length > 1 && (
            <div className="hidden lg:flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden transition-all ${
                    i === selectedImage
                      ? 'ring-2 ring-cyan-500 ring-offset-1'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={getImageUrl(img)} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info — KFC-style centered/minimal on mobile */}
        <div className="lg:pt-2 text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-2 justify-center lg:justify-start mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">
              Rs. {currentPrice.toLocaleString()}
            </span>
            {variant && (
              <span className="text-sm text-gray-500">/ {variant.name}</span>
            )}
          </div>

          {/* Variants — compact pills */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-2.5 sm:mt-3">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                {product.variantType || 'Choose'}
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center lg:justify-start">
                {product.variants.map((v) => {
                  const isActive = selectedVariant === v.name;
                  const disabled = v.stock <= 0;
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => !disabled && setSelectedVariant(v.name)}
                      disabled={disabled}
                      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all border-2 ${
                        isActive
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                          : disabled
                          ? 'border-gray-200 bg-gray-50 text-gray-300 line-through cursor-not-allowed'
                          : 'border-gray-200 text-gray-700 hover:border-cyan-300 hover:bg-cyan-50/40'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──────────────── Smart Cart Controls ──────────────── */}
          <div className="mt-3 space-y-2 text-left">
            {isUnavailable ? (
              /* ─── Out of stock ─── */
              <div className="bg-gray-50 rounded-xl py-3 text-center">
                <p className="text-sm font-bold text-gray-400">Currently Unavailable</p>
              </div>
            ) : inCart ? (
              /* ─── Already in cart → live controls + checkout ─── */
              <>
                <div className="flex items-center justify-between bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 leading-none">
                      In your cart
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      Rs. {(currentPrice * cartQty).toLocaleString()}
                    </p>
                  </div>
                  <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm">
                    <button
                      onClick={handleCartMinus}
                      className="w-8 h-8 rounded-full bg-white text-gray-700 hover:bg-red-50 hover:text-red-500 flex items-center justify-center active:scale-95 transition-colors"
                    >
                      {cartQty === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-4 h-4" />}
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-gray-900">
                      {cartQty}
                    </span>
                    <button
                      onClick={handleCartPlus}
                      disabled={cartQty >= maxQty}
                      className="w-8 h-8 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 flex items-center justify-center active:scale-95 shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/checkout"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-[15px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-cyan-500/30"
                  >
                    Checkout <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={handleWhatsAppOrder}
                    aria-label="Order via WhatsApp"
                    className="w-12 h-12 rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white flex items-center justify-center shadow-md active:scale-95 transition-all flex-shrink-0"
                  >
                    <WhatsAppIcon size={22} />
                  </button>
                </div>
              </>
            ) : (
              /* ─── Not in cart → qty picker + Add to Cart (KFC style) ─── */
              <>
                {/* Big bordered qty selector, centered on mobile */}
                <div className="flex justify-center lg:justify-start">
                  <div className="inline-flex items-stretch border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setFreshQty((q) => Math.max(1, q - 1))}
                      disabled={freshQty <= 1}
                      aria-label="Decrease quantity"
                      className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <span className="w-12 text-center text-base font-bold text-gray-900 leading-[44px] border-x border-gray-300">
                      {freshQty}
                    </span>
                    <button
                      onClick={() => setFreshQty((q) => Math.min(maxQty, q + 1))}
                      disabled={freshQty >= maxQty}
                      aria-label="Increase quantity"
                      className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 rounded-xl text-white font-bold text-[15px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                      addedToCart
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-500/30'
                    }`}
                  >
                    {addedToCart ? (
                      <><Check className="w-4 h-4" /> Added!</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4" /> Add · Rs. {(currentPrice * freshQty).toLocaleString()}</>
                    )}
                  </button>
                  <button
                    onClick={handleWhatsAppOrder}
                    aria-label="Order via WhatsApp"
                    className="w-12 h-12 rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white flex items-center justify-center shadow-md active:scale-95 transition-all flex-shrink-0"
                  >
                    <WhatsAppIcon size={22} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Description — appears below Add to Cart. Collapsible on mobile
              for a compact food-app feel; auto-open on desktop. */}
          {product.description && (
            <details className="mt-3 pt-2.5 border-t border-gray-100 group text-left" open={descOpen}>
              <summary className="text-[11px] font-bold uppercase tracking-wider text-gray-500 cursor-pointer list-none flex items-center justify-between lg:cursor-default">
                <span>Description</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90 lg:hidden" />
              </summary>
              <div
                className="rich-content text-sm sm:text-[15px] text-gray-700 leading-relaxed mt-1.5"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </details>
          )}
        </div>
      </div>

      {/* Reviews — full-width below */}
      <div className="px-3 sm:px-5 lg:px-8 mt-4 sm:mt-6">
        <ProductReviews
          productId={product._id}
          productName={product.name}
        />
      </div>

      {/* Related — tabbed (category first, then hand-picked) */}
      {(() => {
        const cat =
          product.category && typeof product.category === 'object'
            ? (product.category as any)
            : null;
        const tabs: RelatedTab[] = [];
        if (cat?._id && siblings.length > 0) {
          tabs.push({
            id: `cat-${cat._id}`,
            label: `More ${cat.name}`,
            products: siblings,
          });
        }
        if (related.length > 0) {
          tabs.push({
            id: 'picks',
            label: 'You may also like',
            products: related,
          });
        }
        if (tabs.length === 0) return null;
        return (
          <div className="max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-8 mt-6 sm:mt-8">
            <TabbedRelatedList tabs={tabs} heading="More from our menu" />
          </div>
        );
      })()}

      {lightboxOpen && (
        <ImageLightbox
          images={product.images.map(getImageUrl)}
          currentIndex={selectedImage}
          onClose={() => setLightboxOpen(false)}
          onNext={next}
          onPrev={prev}
        />
      )}
    </div>
  );
}
