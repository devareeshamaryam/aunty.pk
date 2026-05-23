'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Package,
  Home,
  Clock,
  Phone,
  AlertCircle,
  Truck,
  ChefHat,
  Bike,
  PartyPopper,
  Ban,
} from 'lucide-react';
import { useGuest } from '../context/GuestContext';
import { useStoreContact } from '../context/SettingsContext';
import { trackOrder } from '../lib/api';
import { Prefs } from '../lib/preferences';
import OrderTrackAnimation from '../components/OrderTrackAnimation';
import ClockCountdown from '../components/ClockCountdown';

const POLL_INTERVAL_MS = 10_000;

type Status =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'RIDER_ON_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

/**
 * Customer-facing timeline is intentionally 3 stages only:
 *   Preparing → On the way → Delivered
 * Legacy PLACED/CONFIRMED values are normalised to PREPARING for display.
 */
const STEPS: { key: Status; label: string; description: string; icon: any }[] = [
  { key: 'PREPARING',    label: 'Preparing',  description: 'Aunty is cooking your food',  icon: ChefHat    },
  { key: 'RIDER_ON_WAY', label: 'On the way', description: 'Rider is heading to you',     icon: Bike       },
  { key: 'DELIVERED',    label: 'Delivered',  description: 'Enjoy your meal!',            icon: PartyPopper},
];

/** Map any backend status (including legacy) to a timeline-visible status. */
function normaliseForTimeline(s: Status): Status {
  if (s === 'PLACED' || s === 'CONFIRMED') return 'PREPARING';
  return s;
}

function StatusBadge({ status }: { status: Status }) {
  // Single theme-coloured palette: every active status uses cyan/teal so
  // the UI feels consistent. Only "Cancelled" breaks the palette (red).
  const map: Record<Status, string> = {
    PLACED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    CONFIRMED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    PREPARING: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    RIDER_ON_WAY: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  };
  const labels: Record<Status, string> = {
    PLACED: 'Placed',
    CONFIRMED: 'Confirmed',
    PREPARING: 'Preparing',
    RIDER_ON_WAY: 'On the way',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${map[status]}`}
    >
      {status === 'CANCELLED' ? <Ban className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {labels[status]}
    </span>
  );
}

function Timeline({ status, history }: { status: Status; history: any[] }) {
  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
        <Ban className="w-10 h-10 text-red-400 mx-auto mb-2" />
        <h3 className="font-bold text-red-700">Order Cancelled</h3>
        <p className="text-xs text-red-600 mt-1">
          If this was unexpected, please contact us — we\'re sorry for the trouble.
        </p>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  const historyByStatus = new Map<string, any>();
  for (const h of history || []) historyByStatus.set(h.status, h);

  return (
    <ol className="relative space-y-4">
      {STEPS.map((step, idx) => {
        const reached = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const entry = historyByStatus.get(step.key);
        const Icon = step.icon;

        return (
          <li key={step.key} className="relative pl-12">
            {/* connector line */}
            {idx < STEPS.length - 1 && (
              <span
                className={`absolute left-[18px] top-9 w-0.5 h-[calc(100%+8px)] ${
                  idx < currentIdx ? 'bg-cyan-400' : 'bg-gray-200'
                }`}
              />
            )}
            <span
              className={`absolute left-0 top-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                reached
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                  : 'bg-gray-100 text-gray-300'
              } ${isCurrent ? 'ring-4 ring-cyan-200 animate-pulse' : ''}`}
            >
              <Icon className="w-4 h-4" />
            </span>
            <div className="pt-1.5">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-bold ${reached ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </h4>
                {entry?.at && (
                  <span className="text-[10px] text-gray-500">
                    · {new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className={`text-xs ${reached ? 'text-gray-600' : 'text-gray-400'}`}>
                {step.description}
              </p>
              {entry?.note && (
                <p className="text-xs text-cyan-700 mt-1 bg-cyan-50 inline-block px-2 py-0.5 rounded">
                  💬 {entry.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { guestId } = useGuest();
  const { phone: storePhone, phoneDisplay: storePhoneDisplay } = useStoreContact();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Display status for the GIF stage. Differs from the real backend status
   * only during the one-time intro sequence right after the customer places
   * an order: we briefly show the "Order Placed" and "Confirmed" GIFs as a
   * celebratory animation before settling on the real status (Preparing).
   * The 3-step timeline at the bottom always uses the real (normalised)
   * status, so it stays clean and shows only Preparing → On the way → Delivered.
   */
  const [displayStatus, setDisplayStatus] = useState<Status | null>(null);
  const introPlayedRef = useRef(false);

  // Poll
  useEffect(() => {
    if (!orderId || !guestId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await trackOrder(orderId, guestId);
        if (cancelled) return;

        // No intro any more — show the real status immediately. Fresh orders
        // already start in PREPARING so the customer lands on the cooking GIF
        // without a "Placed"/"Confirmed" detour.
        if (!introPlayedRef.current) {
          introPlayedRef.current = true;
          setDisplayStatus(normaliseForTimeline(data.status as Status));
        }

        setOrder(data);
        setErr('');
        setLastUpdated(new Date());
      } catch (e: any) {
        if (cancelled) return;
        setErr(e.message || 'Could not load order.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    timer.current = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [orderId, guestId]);

  /**
   * Once the intro has completed, keep `displayStatus` in lockstep with the
   * real backend status so admin-driven changes (Preparing → On the way →
   * Delivered) flow through to the GIF stage.
   */
  useEffect(() => {
    if (!order) return;
    if (!introPlayedRef.current) return;
    const real = order.status as Status;
    setDisplayStatus(normaliseForTimeline(real));
  }, [order?.status, displayStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (err || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">We couldn\'t load this order</h2>
          <p className="text-sm text-gray-600 mb-5">{err || 'Order not found.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </div>
    );
  }

  const status: Status = order.status;
  /** What the timeline + badge show — legacy PLACED/CONFIRMED collapse to PREPARING. */
  const timelineStatus: Status = normaliseForTimeline(status);
  /** What the GIF stage shows — may differ from `status` during the intro sequence. */
  const animationStatus: Status = displayStatus ?? normaliseForTimeline(status);
  const isActive = !['DELIVERED', 'CANCELLED'].includes(status);

  // Personalisation: strongest signal — bump every delivered product once.
  if (status === 'DELIVERED' && typeof sessionStorage !== 'undefined' && order.items?.length) {
    const flag = `aunty.delivered.bumped.${order._id}`;
    if (!sessionStorage.getItem(flag)) {
      for (const it of order.items) {
        if (it?.product) Prefs.delivered(String(it.product));
      }
      try { sessionStorage.setItem(flag, '1'); } catch {}
    }
  }

  return (
    <div className="min-h-screen bg-white pb-10 overflow-x-hidden">
      {/* Theme color header bar */}
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-md">
        <div className="px-3 sm:px-5 py-3 max-w-[1100px] mx-auto flex items-center justify-between gap-2">
          <Link
            href="/"
            className="text-xs font-semibold text-white/90 hover:text-white inline-flex items-center gap-1"
          >
            ← Continue shopping
          </Link>
          <StatusBadge status={timelineStatus} />
        </div>
      </div>

      {/* GIF-based animated tracking stage with on-stage clock countdown */}
      <section className="relative">
        <OrderTrackAnimation
          status={animationStatus}
          overlay={
            isActive && order.estimatedDeliveryAt ? (
              <ClockCountdown
                targetAt={order.estimatedDeliveryAt}
                startedAt={
                  // Use the timestamp of the latest status change as the
                  // window start so the progress ring is meaningful.
                  order.statusHistory?.length
                    ? order.statusHistory[order.statusHistory.length - 1].at
                    : order.createdAt
                }
              />
            ) : null
          }
        />

        <div className="text-center mt-4">
          <p className="text-[11px] uppercase font-bold tracking-widest text-gray-400">
            Order #{order._id.slice(-8).toUpperCase()}
          </p>
        </div>

        {/* Fallback ETA pill when admin only typed a free-text ETA */}
        {isActive && !order.estimatedDeliveryAt && order.estimatedDeliveryText && (
          <div className="flex justify-center mt-3">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-md">
              <Clock className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-semibold text-gray-800">
                ETA · {order.estimatedDeliveryText}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Review CTA — shown right below animation when delivered */}
      {status === 'DELIVERED' && order.items?.length > 0 && (
        <div className="max-w-[1100px] mx-auto px-3 sm:px-5 pt-4">
          <ReviewItemsCta items={order.items} />
        </div>
      )}

      <main className="max-w-[1100px] mx-auto px-3 sm:px-5 pt-6 space-y-4 relative z-10">
        {/* Timeline */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-500" /> Order Status
            </h2>
            {isActive && lastUpdated && (
              <span className="text-[10px] text-gray-400">
                last update {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <Timeline status={timelineStatus} history={order.statusHistory || []} />
          {order.riderNote && isActive && (
            <div className="mt-5 bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-sm text-cyan-800">
              <strong className="font-semibold">📝 Note from us:</strong> {order.riderNote}
            </div>
          )}
        </section>

        {/* Items + total */}
        <section className="bg-gradient-to-br from-cyan-50/50 to-white rounded-2xl p-5 border border-cyan-100 shadow-sm">
          <h2 className="font-bold text-cyan-800 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-500" /> Order Details
          </h2>
          <ul className="divide-y divide-gray-100 mb-4">
            {order.items.map((i: any, idx: number) => (
              <li key={idx} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{i.name}</p>
                  <p className="text-xs text-gray-500">
                    {i.variantName ? `${i.variantName} · ` : ''}Qty {i.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  Rs. {(i.price * i.quantity).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <div className="space-y-1.5 text-sm border-t border-cyan-100 pt-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {order.itemsTotal?.toLocaleString() ?? order.totalAmount?.toLocaleString()}</span>
            </div>
            {order.deliveryFee != null && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={order.deliveryFee === 0 ? 'text-cyan-600 font-semibold' : ''}>
                  {order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee.toLocaleString()}`}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-cyan-700 pt-2 border-t border-cyan-100">
              <span>Total</span>
              <span>Rs. {order.totalAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 pt-1">Payment: Cash on Delivery</p>
          </div>
        </section>

        {/* Contact */}
        <div className="text-center text-sm text-gray-600 pt-4">
          Need help with this order?{' '}
          <a href={`tel:${storePhone}`} className="text-cyan-600 font-semibold inline-flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> {storePhoneDisplay}
          </a>
        </div>
      </main>
    </div>
  );
}

function ReviewItemsCta({ items }: { items: any[] }) {
  // Dedupe by product id since multiple items can repeat
  const unique = Array.from(new Map(items.map((i) => [String(i.product), i])).values());
  return (
    <section className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">⭐</span>
        <h2 className="font-bold text-gray-900">How was your meal?</h2>
      </div>
      <p className="text-xs text-gray-600 mb-3">
        Open a product to share your thoughts (one review per product).
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {unique.map((i) => (
          <li key={String(i.product)}>
            <Link
              href={i.slug ? `/product/${i.slug}` : `/`}
              className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 hover:bg-cyan-50 border border-cyan-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-800 truncate">{i.name}</span>
              <span className="text-xs font-bold text-cyan-700 whitespace-nowrap">Review →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}



export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
