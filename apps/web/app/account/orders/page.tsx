'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Package, Clock } from 'lucide-react';
import { useGuest } from '../../context/GuestContext';
import { fetchGuestOrders } from '../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  PREPARING: 'bg-amber-100 text-amber-700',
  RIDER_ON_WAY: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  RIDER_ON_WAY: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrdersPage() {
  const { guestId } = useGuest();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!guestId) return;
    fetchGuestOrders(guestId)
      .then(setOrders)
      .catch((e) => setErr(e.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [guestId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-5 py-4 flex items-center gap-3">
          <Link
            href="/account"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">My Orders</h1>
            <p className="text-xs text-gray-500">All orders placed from this device</p>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-3 sm:px-5 py-6">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading orders…</div>
        ) : err ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
            {err}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-500 mb-5">
              When you place an order, it will appear here.
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
            {orders.map((o) => (
              <li key={o._id}>
                <Link
                  href={`/order-success?orderId=${o._id}`}
                  className="block bg-white rounded-2xl p-4 border border-gray-100 hover:border-cyan-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-gray-400">
                        Order #{o._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(o.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                        STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {o.items?.map((i: any) => i.name).join(', ')}
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-2">
                    Rs. {o.totalAmount?.toLocaleString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
