 'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  fetchAllOrders,
  updateOrderStatus,
  type OrderItemResponse,
  type OrdersResponse,
} from '../../lib/api';
import {
  Search, ChevronLeft, ChevronRight, Package, Eye,
  CheckCircle, XCircle, Mic, Play, Pause, MapPin,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

// ── Dynamic import — Leaflet cannot run on server (SSR disabled) ─────────────
const DeliveryMap = dynamic(() => import('./DeliveryMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-64 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-teal-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-teal-500 font-semibold">Loading map…</p>
    </div>
  ),
});

// ─── Voice Player ─────────────────────────────────────────────────────────────
function VoicePlayer({ voiceMessage }: {
  voiceMessage: { fileUrl: string; mimeType: string; durationSeconds: number; uploadedAt: string }
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number | null>(null);
  const audioUrl = `${API_URL}${voiceMessage.fileUrl}`;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false); setProgress(0); setCurrentTime(0);
        if (animRef.current) cancelAnimationFrame(animRef.current);
      };
    }
    if (isPlaying) {
      audioRef.current.pause(); setIsPlaying(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    } else {
      audioRef.current.play(); setIsPlaying(true);
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

  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause();
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="mt-6">
      <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-3 flex items-center gap-1.5">
        <Mic className="w-3 h-3" /> Voice Message
      </p>
      <div className="bg-teal-500 rounded-2xl p-4 flex items-center gap-4">
        <button onClick={togglePlay}
          className="w-11 h-11 flex-shrink-0 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform active:scale-95">
          {isPlaying ? <Pause className="w-4 h-4 text-teal-600" /> : <Play className="w-4 h-4 text-teal-600 ml-0.5" />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-0.5 h-7 mb-1.5">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-full transition-colors"
                style={{
                  height: `${20 + Math.sin(i * 0.9) * 10 + Math.cos(i * 0.5) * 6}px`,
                  backgroundColor: (i / 32) * 100 <= progress ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.35)',
                }} />
            ))}
          </div>
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <p className="text-xs font-mono font-bold text-white flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(voiceMessage.durationSeconds)}
        </p>
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
  const [selectedOrder, setSelectedOrder] = useState<OrderItemResponse | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllOrders({ page, limit, status: statusFilter === 'ALL' ? undefined : statusFilter });
      setOrdersData(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, limit, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      setToast('Order status updated');
      loadOrders();
      setTimeout(() => setToast(''), 3000);
    } catch { alert('Failed to update status'); }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':    return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
      case 'PROCESSING': return 'bg-teal-50 text-teal-700 ring-1 ring-teal-200';
      case 'SHIPPED':    return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200';
      case 'DELIVERED':  return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
      case 'CANCELLED':  return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      default:           return 'bg-gray-50 text-gray-700';
    }
  };

  const buildAddress = (order: OrderItemResponse) =>
    [order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.state]
      .filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-fadeIn bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-400" /> {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer orders and shipments</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by Order ID or customer…"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none">
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)}
          </div>
        ) : ordersData && ordersData.orders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Order ID', 'Customer', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} className={`py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-left ${h === 'Action' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ordersData.orders.map((order) => (
                    <tr key={order._id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-500">#{order._id.slice(-6).toUpperCase()}</span>
                          {(order as any).voiceMessage && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded-md text-[10px] font-bold">
                              <Mic className="w-2.5 h-2.5" /> Voice
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-gray-900">{order.customerName || (order.user as any)?.name || 'Guest'}</p>
                        <p className="text-xs text-gray-400">{(order.user as any)?.email || 'Guest Checkout'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-black text-gray-900">Rs. {order.totalAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{order.items.length} items</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-400 font-medium">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end items-center gap-2">
                          <select value={order.status} onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className="text-xs font-bold bg-transparent border-none outline-none text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                          <button onClick={() => setSelectedOrder(order)}
                            className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all">
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
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page {page} of {ordersData.totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={page === ordersData.totalPages} onClick={() => setPage(p => p + 1)}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition-all"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-20 text-center">
            <Package className="w-16 h-16 text-gray-100 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No orders found</h3>
            <p className="text-gray-400 text-sm mt-1">Orders will appear here once customers place them.</p>
          </div>
        )}
      </div>

      {/* ─── Order Details Modal ───────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedOrder(null)} />

          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[92vh]">

            {/* Teal header */}
            <div className="bg-teal-500 px-8 py-6 flex items-start justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-3 flex-wrap">
                  Order Details
                  <span className="text-xs font-mono bg-white/20 text-white px-2.5 py-1 rounded-lg">
                    #{selectedOrder._id.toUpperCase()}
                  </span>
                  {(selectedOrder as any).voiceMessage && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                      <Mic className="w-3 h-3" /> Voice
                    </span>
                  )}
                </h2>
                <p className="text-teal-100 text-sm mt-1">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0 ml-4">
                <XCircle className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <div className="p-8 space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-3">Customer Info</p>
                    <div className="bg-teal-50 rounded-2xl p-5 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Name</p>
                        <p className="text-sm font-bold text-gray-900">{selectedOrder.customerName || (selectedOrder.user as any)?.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Phone</p>
                        <p className="text-sm font-bold text-gray-900">{selectedOrder.shippingAddress.phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Email</p>
                        <p className="text-sm text-gray-600">{(selectedOrder.user as any)?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Payment</p>
                        <p className="text-sm font-bold text-gray-900">{selectedOrder.paymentMethod} — {selectedOrder.paymentStatus}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipping + Map */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-3 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Delivery Location
                    </p>
                    <div className="bg-teal-50 rounded-2xl px-4 py-3 mb-3">
                      <p className="text-sm leading-relaxed text-gray-700 font-medium">
                        {selectedOrder.shippingAddress.street}<br />
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
                      </p>
                    </div>
                    {/* ✅ Fully interactive Leaflet map */}
                    <DeliveryMap
                      address={buildAddress(selectedOrder)}
                      customerName={selectedOrder.customerName || (selectedOrder.user as any)?.name}
                    />
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-3">Order Items</p>
                  <div className="border border-teal-100 rounded-2xl overflow-hidden divide-y divide-teal-50">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between bg-white hover:bg-teal-50/40 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-teal-50 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-teal-200" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{item.name}</p>
                            {item.variantName && <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">{item.variantName}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-gray-900">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {(selectedOrder as any).voiceMessage && (
                  <VoicePlayer voiceMessage={(selectedOrder as any).voiceMessage} />
                )}

                {/* Summary */}
                <div className="bg-teal-500 rounded-3xl p-6 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-100">Order Status</p>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        handleStatusChange(selectedOrder._id, e.target.value);
                        setSelectedOrder(prev => prev ? { ...prev, status: e.target.value as any } : null);
                      }}
                      className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border-none outline-none bg-white text-teal-600 cursor-pointer"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-200 mb-1">Total Amount</p>
                      <p className="text-4xl font-black">Rs. {selectedOrder.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-teal-200 mb-1">Items</p>
                      <p className="text-2xl font-black">{selectedOrder.items.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scaleUp { animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #99f6e4; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2dd4bf; }
      `}</style>
    </div>
  );
}