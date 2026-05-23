import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import type { Metadata } from 'next';
import StoreContactLink from '../components/StoreContactLink';

export const metadata: Metadata = {
  title: 'Privacy Policy · Aunty.pk',
  description: 'How Aunty.pk handles your information. No sign-up; data stays on your device.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-5 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-500" /> Privacy Policy
          </h1>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-3 sm:px-5 py-8 space-y-6 text-gray-700">
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long' })}
        </p>

        <Section title="Guest-first by design">
          Aunty.pk does not require you to create an account. Your name, phone, email and saved
          addresses are stored locally in your own browser (using <code>localStorage</code>) — not on our
          servers — and never leave your device unless you place an order.
        </Section>

        <Section title="What we collect when you order">
          When you place an order, we collect only what is needed to deliver it: your name, phone
          number, an optional email for receipts, delivery address or location pin, your order
          items, and an optional voice message.
        </Section>

        <Section title="How we use your information">
          We use this information to prepare and deliver your order, contact you about delivery
          status, and improve our service. We never sell or share it with third parties for
          marketing.
        </Section>

        <Section title="Delivery area">
          We currently deliver only within Multan (30km radius from city center).
        </Section>

        <Section title="Contact">
          Questions? Call us at <StoreContactLink />.
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h2 className="font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm leading-relaxed">{children}</p>
    </section>
  );
}
