import Link from 'next/link';
import { ArrowLeft, ScrollText } from 'lucide-react';
import type { Metadata } from 'next';
import StoreContactLink from '../components/StoreContactLink';

export const metadata: Metadata = {
  title: 'Terms of Service · Aunty.pk',
  description: 'The terms that apply when you use Aunty.pk to order homemade food in Multan.',
};

export default function TermsPage() {
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
            <ScrollText className="w-5 h-5 text-cyan-500" /> Terms of Service
          </h1>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-3 sm:px-5 py-8 space-y-6 text-gray-700">
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long' })}
        </p>

        <Section title="Service area">
          Aunty.pk currently delivers only inside Multan, Pakistan, within a 30km radius of the
          city center. Orders for any other city will not be accepted.
        </Section>

        <Section title="Orders &amp; payment">
          All orders are Cash on Delivery (COD). Prices and availability are shown on the menu and
          may change at any time. Delivery charges (if any) are configured by the store and shown
          at checkout before you place the order.
        </Section>

        <Section title="Order timing">
          We try to deliver as quickly as possible. The ETA shown after you order is an estimate;
          actual delivery time may vary due to traffic, distance, or order load.
        </Section>

        <Section title="Cancellation">
          You can cancel an order before it is dispatched by calling us. Once your order is out for
          delivery, it cannot be cancelled.
        </Section>

        <Section title="Quality">
          All food is freshly homemade. If something is wrong with your order, please contact us
          immediately so we can make it right.
        </Section>

        <Section title="Contact">
          For any questions, call <StoreContactLink />.
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
