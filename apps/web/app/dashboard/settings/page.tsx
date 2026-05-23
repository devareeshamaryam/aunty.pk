'use client';

import { useEffect, useState } from 'react';
import { Truck, Store, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchPublicSettings, updateSettings, type PublicSettings } from '../../lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // form state
  const [free, setFree] = useState(false);
  const [amount, setAmount] = useState(0);
  const [freeAbove, setFreeAbove] = useState<number | ''>('');
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeWa, setStoreWa] = useState('');

  useEffect(() => {
    fetchPublicSettings()
      .then((s) => {
        setSettings(s);
        setFree(s.deliveryFee.free);
        setAmount(s.deliveryFee.amount);
        setFreeAbove(s.deliveryFee.freeAbove ?? '');
        setStoreName(s.store.name);
        setStorePhone(s.store.phone || '');
        setStoreWa(s.store.whatsapp || '');
      })
      .catch((e) => setMsg({ type: 'error', text: e.message || 'Failed to load settings.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await updateSettings({
        deliveryFee: {
          free,
          amount: Math.max(0, Number(amount) || 0),
          freeAbove: freeAbove === '' ? undefined : Math.max(0, Number(freeAbove) || 0),
        },
        store: { name: storeName, phone: storePhone, whatsapp: storeWa },
      });
      setSettings(updated);
      setMsg({ type: 'success', text: 'Settings saved successfully.' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage delivery charges and store info. Changes are visible to customers immediately.
        </p>
      </div>

      {/* Delivery fee card */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Delivery Charges</h2>
            <p className="text-xs text-gray-500">Configure what customers pay for delivery.</p>
          </div>
        </div>

        <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={free}
            onChange={(e) => setFree(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-900">Free delivery</span>
            <span className="block text-xs text-gray-500">
              When enabled, no delivery charge is added to any order.
            </span>
          </span>
        </label>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${free ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Delivery fee (PKR)
            </label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Free above (optional, PKR)
            </label>
            <input
              type="number"
              min={0}
              value={freeAbove}
              onChange={(e) => setFreeAbove(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 2000"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Auto-free when cart subtotal reaches this. Leave empty to disable.
            </p>
          </div>
        </div>
      </section>

      {/* Store info card */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Store Info</h2>
            <p className="text-xs text-gray-500">Public contact information.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Store name</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
            <input
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              placeholder="0300-0000000"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp</label>
            <input
              value={storeWa}
              onChange={(e) => setStoreWa(e.target.value)}
              placeholder="923105717097"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>
        </div>
      </section>

      {msg && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
            msg.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold transition-colors shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
