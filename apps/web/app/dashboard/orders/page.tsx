'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  fetchAllOrders,
  updateOrderStatus,
  updateOrderEta,
  markOrderSeen,
  type OrdersResponse,
} from '../../lib/api';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Eye,
  CheckCircle,
  XCircle,
  Mic,
  Play,
  Pause,
  MapPin,
  Clock,
  Phone,
  ChefHat,
  Bike,
  Save,
  Loader2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

const DeliveryMap = dynamic(() => import('../../components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
    </div>
  ),
});

type Status = 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'RIDER_ON_WAY' | 'DELIVERED' | 'CANCELLED';

const STATUS_LABELS: Record<Status, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  RIDER_ON_WAY: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<Status, string> = {
  PLACED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  CONFIRMED: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  PREPARING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  RIDER_ON_WAY: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const TRANSITIONS: Record<Status, Status[]> = {
  // Legacy: allow moving old PLACED/CONFIRMED orders straight into PREPARING.
  PLACED: ['PREPARING', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['RIDER_ON_WAY', 'CANCELLED'],
  RIDER_ON_WAY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

/** Statuses shown in the admin filter dropdown — 3-stage flow only. */
const FILTER_STATUSES: Status[] = ['PREPARING', 'RIDER_ON_WAY', 'DELIVERED', 'CANCELLED'];

// ─── Voice Player ─────────────────────────────────────────────────────────────
function VoicePlayer({
  voiceMessage,
}: {
  voiceMessage: { fileUrl: string; mimeType: string; durationSeconds: number; uploadedAt: string };
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number | null>(null);
  const audioUrl = `${API_URL}${voiceMessage.fileUrl}`;

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60).toString().padStart(2, '0')}:${Math.floor(sec % 60).toString().padStart(2, '0')}`;

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        if (animRef.current) cancelAnimationFrame(animRef.current);
      };
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      const update = () => {
        if (audioRef.current) {
          const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(isNaN(p) ? 0 : p);
          setCurrentTime(audioRef.current.currentTime);
          animRef.current = requestAnimationFrame(update);
        }
      };
      animRef.current = requestAnimationFrame(update);
    }
  };

  useEffect(
    () => () => {
      if (audioRef.current) audioRef.current.pause();
      if (animRef.current) cancelAnimationFrame(animRef.current);
    },
    [],
  );

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2 flex items-center gap-1.5">
        <Mic className="w-3 h-3" /> Customer voice message
      </p>
      <div className="bg-teal-500 rounded-2xl p-4 flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-11 h-11 flex-shrink-0 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-teal-600" />
          ) : (
            <Play className="w-4 h-4 text-teal-600 ml-0.5" />
          )}
        </button>
        <div className="flex-1">
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <p className="text-xs font-mono font-bold text-white flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(voiceMessage.durationSeconds)}
        </p>
      </div>
    </div>
  );
}

// ─── ETA + status panel for modal ─────────────────────────────────────────────
function OrderControlPanel({
  order,
  onChanged,
  onError,
}: {
  order: any;
  onChanged: (o: any) => void;
  onError: (msg: string) => void;
}) {
  const status: Status = order.status;
  const nextOptions = TRANSITIONS[status];

  const [etaText, setEtaText] = useState(order.estimatedDeliveryText || '');
  const [customMin, setCustomMin] = useState<number | ''>('');
  const [riderNote, setRiderNote] = useState(order.riderNote || '');
  const [saving, setSaving] = useState(false);
  const [busyTransition, setBusyTransition] = useState<Status | null>(null);
  const [busyEta, setBusyEta] = useState<number | null>(null);

  useEffect(() => {
    setEtaText(order.estimatedDeliveryText || '');
    setRiderNote(order.riderNote || '');
  }, [order._id, order.estimatedDeliveryText, order.riderNote]);

  /** Set ETA as an absolute timestamp from now + minutes, so the customer's countdown is accurate. */
  const handleQuickEta = async (mins: number) => {
    setBusyEta(mins);
    try {
      const at = new Date(Date.now() + mins * 60_000).toISOString();
      const updated = await updateOrderEta(order._id, {
        estimatedDeliveryAt: at,
        estimatedDeliveryText: `${mins} min`,
      });
      onChanged(updated);
    } catch (e: any) {
      onError(e.message || 'ETA update failed');
    } finally {
      setBusyEta(null);
    }
  };

  const handleTransition = async (target: Status, note?: string) => {
    setBusyTransition(target);
    try {
      const updated = await updateOrderStatus(order._id, target, note);
      onChanged(updated);
    } catch (e: any) {
      onError(e.message || 'Status update failed');
    } finally {
      setBusyTransition(null);
    }
  };

  const handleSaveEta = async () => {
    setSaving(true);
    try {
      const updated = await updateOrderEta(order._id, {
        estimatedDeliveryText: etaText || undefined,
        riderNote: riderNote || undefined,
      });
      onChanged(updated);
    } catch (e: any) {
      onError(e.message || 'ETA update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2">
          Current status
        </p>
        <span
          className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {nextOptions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2">
            Advance to
          </p>
          <div className="flex flex-wrap gap-2">
            {nextOptions.map((s) => (
              <button
                key={s}
                onClick={() => handleTransition(s)}
                disabled={busyTransition !== null}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 ${
                  s === 'CANCELLED'
                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
              >
                {busyTransition === s ? (
                  <Loader2 className="w-3 h-3 animate-spin inline" />
                ) : (
                  <>
                    {s === 'CONFIRMED' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {s === 'PREPARING' && <ChefHat className="w-3 h-3 inline mr-1" />}
                    {s === 'RIDER_ON_WAY' && <Bike className="w-3 h-3 inline mr-1" />}
                    {s === 'DELIVERED' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {STATUS_LABELS[s]}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-teal-100 pt-4 space-y-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2">
            Set delivery time (starts a live countdown for the customer)
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[15, 30, 45, 60, 90].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleQuickEta(m)}
                disabled={busyEta !== null}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 disabled:opacity-60 transition-colors"
              >
                {busyEta === m ? <Loader2 className="w-3 h-3 animate-spin" /> : `${m} min`}
              </button>
            ))}
            <div className="inline-flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={600}
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Custom"
                className="w-20 px-2 py-1.5 text-xs bg-white border border-teal-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <button
                type="button"
                disabled={!customMin || busyEta !== null}
                onClick={() => customMin && handleQuickEta(Number(customMin))}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white"
              >
                Set
              </button>
            </div>
          </div>
          {order.estimatedDeliveryAt && (
            <p className="text-[11px] text-teal-700 bg-teal-50 px-2 py-1 rounded-md inline-block">
              Current ETA: {new Date(order.estimatedDeliveryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {order.estimatedDeliveryText && ` · ${order.estimatedDeliveryText}`}
            </p>
          )}
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2">
            Free-text ETA label (shown to customer)
          </label>
          <input
            value={etaText}
            onChange={(e) => setEtaText(e.target.value)}
            placeholder="e.g. 30-45 min"
            className="w-full px-3 py-2.5 text-sm bg-white border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2">
            Note for customer
          </label>
          <textarea
            value={riderNote}
            onChange={(e) => setRiderNote(e.target.value)}
            placeholder="Rider on the way, please be ready."
            rows={2}
            className="w-full px-3 py-2.5 text-sm bg-white border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
          />
        </div>
        <button
          onClick={handleSaveEta}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold text-sm inline-flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save ETA & Note'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrderManagementPage() {
  const [ordersData, setOrdersData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllOrders({
        page,
        limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setOrdersData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleOrderChanged = (updated: any) => {
    setSelectedOrder(updated);
    setOrdersData((prev) =>
      prev
        ? {
            ...prev,
            orders: prev.orders.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)),
          }
        : prev,
    );
    showToast('Order updated');
  };

  const handleError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-400" /> {toast}
        </div>
      )}
      {error && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2">
          <XCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer orders and delivery status</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or customer…"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            {FILTER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : ordersData && ordersData.orders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Order ID', 'Customer', 'Amount', 'Status', 'Date', 'Action'].map((h) => (
                      <th
                        key={h}
                        className={`py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-left ${
                          h === 'Action' ? 'text-right' : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ordersData.orders.map((order: any) => (
                    <tr key={order._id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-500">
                            #{order._id.slice(-6).toUpperCase()}
                          </span>
                          {order.voiceMessage && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded-md text-[10px] font-bold">
                              <Mic className="w-2.5 h-2.5" /> Voice
                            </span>
                          )}
                          {order.deliveryLocation && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyan-50 text-cyan-600 rounded-md text-[10px] font-bold">
                              <MapPin className="w-2.5 h-2.5" /> Pin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-gray-900">
                          {order.customerName || 'Guest'}
                        </p>
                        <p className="text-xs text-gray-400">{order.customerPhone || ''}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-black text-gray-900">
                          Rs. {order.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          {order.items.length} items
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            STATUS_STYLE[order.status as Status] || 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {STATUS_LABELS[order.status as Status] || order.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-400 font-medium">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              if (!order.seenByAdmin) {
                                markOrderSeen(order._id).catch(() => {});
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ordersData.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Page {page} of {ordersData.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page === ordersData.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-20 text-center">
            <Package className="w-16 h-16 text-gray-100 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No orders found</h3>
          </div>
        )}
      </div>

      {/* ─── Modal ───────────────────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
          <div
            className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-teal-500 px-8 py-6 flex items-start justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-3 flex-wrap">
                  Order Details
                  <span className="text-xs font-mono bg-white/20 text-white px-2.5 py-1 rounded-lg">
                    #{selectedOrder._id.slice(-8).toUpperCase()}
                  </span>
                </h2>
                <p className="text-teal-100 text-sm mt-1">
                  Placed {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white/20 rounded-xl"
              >
                <XCircle className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer + address */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2">
                        Customer
                      </p>
                      <div className="bg-teal-50 rounded-2xl p-4 space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400 text-xs">Name: </span>
                          <span className="font-bold text-gray-900">
                            {selectedOrder.customerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-teal-500" />
                          <a
                            href={`tel:${selectedOrder.customerPhone}`}
                            className="font-bold text-gray-900"
                          >
                            {selectedOrder.customerPhone}
                          </a>
                        </div>
                        {selectedOrder.customerEmail && (
                          <div className="text-xs text-gray-600">
                            {selectedOrder.customerEmail}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Delivery
                      </p>
                      <div className="bg-cyan-50 rounded-2xl p-4 text-sm">
                        {selectedOrder.deliveryLocation ? (
                          <div>
                            <p className="font-bold text-gray-900 mb-1">📍 Pinned on map</p>
                            <p className="text-xs text-gray-700">
                              {selectedOrder.deliveryLocation.label ||
                                `${selectedOrder.deliveryLocation.lat.toFixed(5)}, ${selectedOrder.deliveryLocation.lng.toFixed(5)}`}
                            </p>
                          </div>
                        ) : selectedOrder.shippingAddress ? (
                          <div className="space-y-1">
                            {selectedOrder.shippingAddress.street && (
                              <p className="font-medium text-gray-900">
                                {selectedOrder.shippingAddress.street}
                              </p>
                            )}
                            <p className="text-xs text-gray-700">
                              {[
                                selectedOrder.shippingAddress.area,
                                selectedOrder.shippingAddress.city,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                            {selectedOrder.shippingAddress.notes && (
                              <p className="text-xs italic text-gray-600 mt-2">
                                💬 {selectedOrder.shippingAddress.notes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-xs">No address provided</p>
                        )}
                      </div>
                    </div>

                    {(selectedOrder.deliveryLocation || selectedOrder.shippingAddress) && (
                      <DeliveryMap
                        lat={selectedOrder.deliveryLocation?.lat}
                        lng={selectedOrder.deliveryLocation?.lng}
                        address={
                          !selectedOrder.deliveryLocation && selectedOrder.shippingAddress
                            ? [
                                selectedOrder.shippingAddress.street,
                                selectedOrder.shippingAddress.area,
                                selectedOrder.shippingAddress.city || 'Multan',
                              ]
                                .filter(Boolean)
                                .join(', ')
                            : undefined
                        }
                        customerName={selectedOrder.customerName}
                      />
                    )}
                  </div>

                  {/* Status / ETA panel */}
                  <div>
                    <OrderControlPanel
                      order={selectedOrder}
                      onChanged={handleOrderChanged}
                      onError={handleError}
                    />

                    {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                      <div className="mt-5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> History
                        </p>
                        <ul className="space-y-1.5 text-xs">
                          {selectedOrder.statusHistory.map((h: any, i: number) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5"
                            >
                              <span className="font-bold text-gray-900">
                                {STATUS_LABELS[h.status as Status] || h.status}
                              </span>
                              <span className="text-gray-400">·</span>
                              <span>{new Date(h.at).toLocaleString()}</span>
                              {h.note && (
                                <span className="ml-auto text-teal-600 italic">"{h.note}"</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Voice */}
                {selectedOrder.voiceMessage && (
                  <VoicePlayer voiceMessage={selectedOrder.voiceMessage} />
                )}

                {/* Items */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-2">
                    Items
                  </p>
                  <div className="border border-teal-100 rounded-2xl overflow-hidden divide-y divide-teal-50">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 flex items-center justify-between bg-white hover:bg-teal-50/40"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-teal-200" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{item.name}</p>
                            {item.variantName && (
                              <p className="text-[10px] font-bold text-teal-600 uppercase">
                                {item.variantName}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-gray-900">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-teal-500 rounded-3xl p-6 text-white">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-teal-100">
                      <span>Subtotal</span>
                      <span>
                        Rs. {(selectedOrder.itemsTotal ?? selectedOrder.totalAmount).toLocaleString()}
                      </span>
                    </div>
                    {selectedOrder.deliveryFee != null && (
                      <div className="flex justify-between text-teal-100">
                        <span>Delivery</span>
                        <span>
                          {selectedOrder.deliveryFee === 0
                            ? 'FREE'
                            : `Rs. ${selectedOrder.deliveryFee.toLocaleString()}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-2xl font-black pt-2 border-t border-white/20">
                      <span>Total</span>
                      <span>Rs. {selectedOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
