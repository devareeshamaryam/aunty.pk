import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p>© {year} Aunty.pk</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-cyan-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-cyan-300 transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
