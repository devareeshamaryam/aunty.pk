'use client';

import Link from 'next/link';
import { ArrowLeft, Package, Star, User, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGuest } from '../context/GuestContext';

export default function AccountPage() {
  const { profile, setProfile } = useGuest();
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');

  useEffect(() => {
    setName(profile.name || '');
    setPhone(profile.phone || '');
  }, [profile]);

  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setProfile({ name, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-5 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">My Account</h1>
            <p className="text-xs text-gray-500">No sign-up · stays on your device</p>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-3 sm:px-5 py-6 space-y-4">
        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <QuickLink href="/account/orders" icon={<Package className="w-5 h-5" />} label="My Orders" />
          <QuickLink href="/account/reviews" icon={<Star className="w-5 h-5" />} label="My Reviews" />
        </div>

        {/* Profile editor */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Contact Details</h2>
              <p className="text-xs text-gray-500">Pre-fills your checkout — saved on this device only.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Field
              icon={<User className="w-4 h-4 text-gray-400" />}
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Your name"
            />
            <Field
              icon={<Phone className="w-4 h-4 text-gray-400" />}
              label="Mobile"
              value={phone}
              onChange={setPhone}
              placeholder="03xxxxxxxxx"
              type="tel"
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <span
              className={`text-xs text-green-600 transition-opacity ${
                saved ? 'opacity-100' : 'opacity-0'
              }`}
            >
              ✓ Saved
            </span>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm transition-colors"
            >
              Save
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function QuickLink({
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
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-cyan-300 hover:shadow-md transition-all"
    >
      <span className="p-3 rounded-xl bg-cyan-50 text-cyan-600">{icon}</span>
      <span className="text-xs font-semibold text-gray-700">{label}</span>
    </Link>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400"
        />
      </div>
    </div>
  );
}
