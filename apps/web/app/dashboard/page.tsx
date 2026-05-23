'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  Star,
  Image as ImageIcon,
  FolderTree,
  Settings as SettingsIcon,
  Clock,
  Phone,
  MapPin,
  Mic,
  Loader2,
  Bell,
  ChevronRight,
} from 'lucide-react';
import {
  fetchUnseenOrders,
  markOrderSeen,
  type OrderItemResponse,
} from '../lib/api';

const POLL_MS = 15_000;

const STATUS_LABEL: Record<string, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  RIDER_ON_WAY: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<string, string> = {
  PLACED: 'bg-blue-50 text-blue-700 ring-blue-200',
  CONFIRMED: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  PREPARING: 'bg-amber-50 text-amber-700 ring-amber-200',
  RIDER_ON_WAY: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNew, setHasNew] = useState(false);
  const [lastSeenIds, setLastSeenIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const data = await fetchUnseenOrders(10);
      setOrders(data);
      // Detect new orders since last poll for a subtle ping
      setLastSeenIds((prev) => {
        const next = new Set(data.map((o) => o._id));
        const isNew = data.some((o) => !prev.has(o._id));
        if (isNew && prev.size > 0) setHasNew(true);
        return next;
      });
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const handleMarkSeen = async (id: string) => {
    setOrders((prev) => prev.filter((o) => o._id !== id));
    try {
      await markOrderSeen(id);
    } catch {
      load();
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back to Aunty.pk admin</p>
        </div>
        {orders.length > 0 && (
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200"
          >
            <Bell className={`w-3.5 h-3.5 ${hasNew ? 'animate-bounce' : ''}`} />
            {orders.length} new {orders.length === 1 ? 'order' : 'orders'}
          </Link>
        )}
      </div>

      {/* New / unseen orders panel */}
      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-900">New orders</h2>
              <p className="text-[11px] text-gray-500">
                Unseen orders auto-refresh every 15s. Open one to mark it seen.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/orders"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </header>

        {loading ? (
          <div className="p-10 flex items-center justify-center text-teal-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900">All caught up ✨</h3>
            <p className="text-xs text-gray-500 mt-1">No new orders waiting for you.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {orders.map((o) => {
              const addr =
                o.deliveryLocation
                  ? o.deliveryLocation.label ||
                    `${o.deliveryLocation.lat.toFixed(4)}, ${o.deliveryLocation.lng.toFixed(4)}`
                  : [o.shippingAddress?.street, o.shippingAddress?.area, o.shippingAddress?.city]
                      .filter(Boolean)
                      .join(', ') || 'No address';
              const ago = timeAgo(new Date(o.createdAt));
              return (
                <li
                  key={o._id}
                  className="p-3 sm:p-4 hover:bg-amber-50/30 transition-colors relative"
                >
                  {/* unseen dot */}
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />

                  <div className="flex items-start justify-between gap-3 pl-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-gray-900">
                          {o.customerName}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ring-1 ${
                            STATUS_STYLE[o.status] || ''
                          }`}
                        >
                          {STATUS_LABEL[o.status] || o.status}
                        </span>
                        {o.voiceMessage && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded-md text-[10px] font-bold">
                            <Mic className="w-2.5 h-2.5" /> Voice
                          </span>
                        )}
                        {o.deliveryLocation && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-cyan-50 text-cyan-600 rounded-md text-[10px] font-bold">
                            <MapPin className="w-2.5 h-2.5" /> Pin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
                        <a
                          href={`tel:${o.customerPhone}`}
                          className="inline-flex items-center gap-1 text-cyan-600 font-semibold hover:underline"
                        >
                          <Phone className="w-3 h-3" /> {o.customerPhone}
                        </a>
                        <span className="text-gray-400">·</span>
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {ago}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        <MapPin className="inline w-3 h-3 mr-1 -mt-0.5 text-gray-400" />
                        {addr}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {o.items.map((i) => `${i.name} × ${i.quantity}`).join(' · ')}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-extrabold text-gray-900">
                        Rs. {o.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-gray-400">
                        {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-2.5 pl-3">
                    <button
                      onClick={() => handleMarkSeen(o._id)}
                      className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-gray-100"
                    >
                      Mark seen
                    </button>
                    <Link
                      href="/dashboard/orders"
                      className="text-xs font-bold inline-flex items-center gap-0.5 text-white bg-teal-500 hover:bg-teal-600 px-3 py-1.5 rounded-lg"
                    >
                      Open <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
          Manage
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <Tile href="/dashboard/orders" icon={<Package className="w-5 h-5" />} label="Orders" />
          <Tile href="/dashboard/products" icon={<ShoppingBag className="w-5 h-5" />} label="Products" />
          <Tile href="/dashboard/categories" icon={<FolderTree className="w-5 h-5" />} label="Categories" />
          <Tile href="/dashboard/banners" icon={<ImageIcon className="w-5 h-5" />} label="Banners" />
          <Tile href="/dashboard/reviews" icon={<Star className="w-5 h-5" />} label="Reviews" />
          <Tile href="/dashboard/settings" icon={<SettingsIcon className="w-5 h-5" />} label="Settings" />
        </div>
      </section>
    </div>
  );
}

function Tile({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all flex flex-col items-center gap-2"
    >
      <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
        {icon}
      </span>
      <span className="text-xs font-semibold text-gray-800">{label}</span>
    </Link>
  );
}

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
