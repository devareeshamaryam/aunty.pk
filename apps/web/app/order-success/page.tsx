 'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Home } from 'lucide-react'

function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (countdown === 0) {
      router.push('/')
    }
  }, [countdown, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle size={48} className="text-green-500" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. We&apos;ve received it and will process it shortly.
          </p>

          {/* Order ID */}
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Order ID</p>
              <p className="text-lg font-mono font-semibold text-gray-900 break-all">
                {orderId}
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Package className="text-teal-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-teal-900 mb-1">What&apos;s Next?</h3>
                <ul className="text-sm text-teal-700 space-y-1">
                  <li>• We&apos;ll confirm your order via WhatsApp</li>
                  <li>• Your order will be prepared for delivery</li>
                  <li>• You&apos;ll receive updates on your order status</li>
                  <li>• Pay cash when you receive your order</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Continue Shopping
            </Link>

            <p className="text-sm text-gray-500">
              Redirecting to home in {countdown} seconds...
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact us at{' '}
            <a href="tel:03105717097" className="text-teal-600 font-semibold hover:underline">
              0310 5717097
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}