'use client'

import { useState } from 'react'
import { createOrder } from '../lib/api'

export default function TestOrderPage() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testOrder = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const testData = {
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        items: [
          {
            product: '6789012345678901234567890', // Dummy product ID
            name: 'Test Product',
            price: 100,
            quantity: 1,
            image: '/placeholder.jpg',
          }
        ],
        shippingAddress: {
          street: 'Test Street 123',
          city: 'Karachi',
          state: 'Sindh',
          zipCode: '75500',
          phone: '03001234567',
        },
        paymentMethod: 'COD' as const,
      }

      console.log('Sending test order:', testData)
      const response = await createOrder(testData)
      console.log('Response:', response)
      setResult(response)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Order API</h1>
        
        <button
          onClick={testOrder}
          disabled={loading}
          className="bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300"
        >
          {loading ? 'Testing...' : 'Test Create Order'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-bold text-red-900 mb-2">Error:</h3>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-green-900 mb-2">Success:</h3>
            <pre className="text-sm text-green-700 whitespace-pre-wrap overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">Instructions:</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Make sure backend is running on http://localhost:4000</li>
            <li>Check browser console for detailed logs</li>
            <li>Check backend terminal for API logs</li>
            <li>If successful, check admin panel for the order</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
