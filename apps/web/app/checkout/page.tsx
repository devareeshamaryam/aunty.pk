'use client';

import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Mic,
  MicOff,
  Play,
  Pause,
  Trash2,
  CheckCircle,
  Package,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useGuest } from '../context/GuestContext';
import {
  getImageUrl,
  createOrder,
  fetchPublicSettings,
  type CreateOrderPayload,
  type PublicSettings,
} from '../lib/api';

// ─── Voice recorder hook (preserved) ─────────────────────────────────
function useVoiceRecorder() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobEvent['data'][]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const MAX_DURATION = 60;

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecordingState('recorded');
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start(100);
      setRecordingState('recording');
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((p) => {
          if (p >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return p + 1;
        });
      }, 1000);
    } catch {
      alert('Microphone access denied.');
    }
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingState('idle');
    setRecordingDuration(0);
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      const upd = () => {
        if (audioRef.current) {
          const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setPlaybackProgress(isNaN(p) ? 0 : p);
          animationRef.current = requestAnimationFrame(upd);
        }
      };
      animationRef.current = requestAnimationFrame(upd);
    }
  };

  const getBase64 = (): Promise<string | null> =>
    new Promise((resolve) => {
      if (!audioBlob) return resolve(null);
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string)?.split(',')[1] ?? null);
      reader.readAsDataURL(audioBlob);
    });

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  return {
    recordingState,
    audioUrl,
    audioBlob,
    recordingDuration,
    isPlaying,
    playbackProgress,
    startRecording,
    stopRecording,
    deleteRecording,
    togglePlayback,
    getBase64,
    formatTime,
    MAX_DURATION,
  };
}

function VoiceSection({ recorder }: { recorder: ReturnType<typeof useVoiceRecorder> }) {
  const {
    recordingState,
    recordingDuration,
    isPlaying,
    playbackProgress,
    startRecording,
    stopRecording,
    deleteRecording,
    togglePlayback,
    formatTime,
    MAX_DURATION,
  } = recorder;

  return (
    <section className="py-4 sm:py-5">
      <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <Mic size={18} className="text-cyan-500" />
        Voice Message
        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
      </h3>
      <p className="text-xs text-gray-500 mb-3">Add special instructions by voice (max {MAX_DURATION}s).</p>

      {recordingState === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 hover:bg-cyan-50 transition-all"
        >
          <span className="w-9 h-9 rounded-full bg-cyan-500 flex items-center justify-center">
            <Mic size={16} className="text-white" />
          </span>
          <span className="text-sm font-semibold text-cyan-700">Record a voice message</span>
        </button>
      )}

      {recordingState === 'recording' && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-semibold text-red-700">Recording…</span>
            </div>
            <span className="text-sm font-mono text-red-600">
              {formatTime(recordingDuration)} / {formatTime(MAX_DURATION)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-red-200 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${(recordingDuration / MAX_DURATION) * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <MicOff size={16} /> Stop
          </button>
        </div>
      )}

      {recordingState === 'recorded' && (
        <div className="rounded-xl border-2 border-cyan-400 bg-cyan-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-cyan-600" />
            <span className="text-sm font-semibold text-cyan-700">Voice message recorded!</span>
            <span className="ml-auto text-xs font-mono text-gray-500">{formatTime(recordingDuration)}</span>
          </div>
          <div className="w-full h-1.5 bg-cyan-200 rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${playbackProgress}%` }} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex-1 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={deleteRecording}
              className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Main checkout content ───────────────────────────────────────────
function CheckoutContent() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { guestId, profile, setProfile, silentLocation, captureLocation } = useGuest();
  const voiceRecorder = useVoiceRecorder();

  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [street, setStreet] = useState('');

  /** True from the moment the order request succeeds until navigation
   *  completes. Used to suppress the "Your cart is empty" early-return
   *  during the brief window between clearCart() and the route change. */
  const placingRef = useRef(false);

  // If the silent geo prompt never fired (or was dismissed earlier), give it
  // one last quiet retry when the customer reaches checkout — strictly in
  // the background, no visible UI either way.
  useEffect(() => {
    if (!silentLocation) captureLocation();
  }, [silentLocation, captureLocation]);

  const [settings, setSettings] = useState<PublicSettings | null>(null);
  useEffect(() => {
    fetchPublicSettings().then(setSettings).catch(() => {});
  }, []);

  const deliveryFee = useMemo(() => {
    if (!settings) return 0;
    if (settings.deliveryFee.free) return 0;
    if (
      settings.deliveryFee.freeAbove &&
      totalPrice >= settings.deliveryFee.freeAbove
    ) {
      return 0;
    }
    return settings.deliveryFee.amount || 0;
  }, [settings, totalPrice]);

  const grandTotal = totalPrice + deliveryFee;

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const handlePlaceOrder = async () => {
    setApiError('');
    if (!name.trim()) return setApiError('Please enter your name.');
    if (!phone.trim() || !/^03\d{9}$/.test(phone.replace(/[-\s]/g, ''))) {
      return setApiError('Valid Pakistani mobile number required (03xxxxxxxxx).');
    }
    if (!street.trim()) {
      return setApiError('Please enter your street/Home address.');
    }

    setProfile({ name, phone });
    setSubmitting(true);

    try {
      const voiceMessageBase64 = await voiceRecorder.getBase64();

      const payload: CreateOrderPayload = {
        guestId,
        customerName: name,
        customerPhone: phone,
        items: items.map((i) => ({
          product: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          variantName: i.variant,
        })),
        // Customer-typed address (the only address field they see/fill).
        shippingAddress: {
          street: street.trim(),
          city: 'Multan',
          phone,
        },
      };

      // Silent GPS pin captured site-wide — attached invisibly so admins can
      // see the exact map location alongside the typed street.
      if (silentLocation) {
        payload.deliveryLocation = {
          lat: silentLocation.lat,
          lng: silentLocation.lng,
        };
      }

      if (voiceMessageBase64) {
        payload.voiceMessage = {
          data: voiceMessageBase64,
          mimeType: 'audio/webm',
          durationSeconds: voiceRecorder.recordingDuration,
        };
      }

      const response = await createOrder(payload);

      // Order intent — see early-return guard below. We keep the checkout UI
      // visible (submitting state) until navigation finishes, otherwise
      // clearing the cart momentarily flashes the empty-cart screen.
      placingRef.current = true;
      router.push(`/order-success?orderId=${response.order._id}`);

      // Clear the cart after the next paint so the empty-cart guard never
      // runs while we are still on /checkout.
      setTimeout(() => clearCart(), 50);
    } catch (err: any) {
      setApiError(err.message || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !placingRef.current) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Package size={64} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Add some items before checking out.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
          >
            Browse menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header — branded cyan gradient */}
      <header className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-5 py-3.5 flex items-center gap-3">
          <Link
            href="/cart"
            className="p-1.5 rounded-lg hover:bg-white/15 text-white transition-colors"
            aria-label="Back to cart"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-white text-base sm:text-lg">Checkout</h1>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-3 sm:px-5 divide-y divide-gray-100">
        {/* Delivery details — minimal: name + phone (50/50) on top, street below */}
        <section className="py-4 sm:py-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-500" /> Delivery Details
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03xxxxxxxxx"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Street/Home Address</label>
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="House #, Street, Area"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
            />
          </div>
        </section>

        {/* Voice */}
        <VoiceSection recorder={voiceRecorder} />

        {/* Order summary */}
        <section className="py-4 sm:py-5">
          <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
          <ul className="divide-y divide-gray-100 mb-3">
            {items.map((item) => (
              <li key={`${item.productId}-${item.variant ?? ''}`} className="py-2.5 flex items-center gap-3">
                {item.image && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.variant ? `${item.variant} · ` : ''}Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  Rs. {(item.price * item.quantity).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Payment method */}
        <section className="py-4 sm:py-5">
          <h2 className="font-semibold text-gray-900 mb-3">Payment Method</h2>
          <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-cyan-400 bg-cyan-50">
            <span className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-lg">
              ₨
            </span>
            <div className="flex-1">
              <p className="font-bold text-cyan-700 text-sm">Cash on Delivery</p>
              <p className="text-xs text-cyan-600/80">Pay our rider when your order arrives.</p>
            </div>
            <CheckCircle className="w-5 h-5 text-cyan-600" />
          </div>
        </section>

        {apiError && (
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {apiError}
            </div>
          </div>
        )}
      </main>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 sm:px-4 py-3 z-30 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)]">
        <div className="max-w-[1100px] mx-auto flex items-center gap-2 sm:gap-3">
          <div className="text-left flex-shrink-0">
            <div className="text-[10px] uppercase font-semibold text-gray-500 leading-none">Total</div>
            <div className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
              Rs. {grandTotal.toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={submitting || items.length === 0}
            className="flex-1 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-cyan-500/30 active:scale-[0.98]"
          >
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-gray-400 text-sm">Loading checkout…</div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
