import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image
                src="/image.png"
                alt="Aunty.pk Logo"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-bold">Aunty.pk</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/about" className="hover:text-teal-400 transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-teal-400 transition-colors">
              Privacy Policy
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-400">
            © 2026 Aunty.pk. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
