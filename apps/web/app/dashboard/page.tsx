'use client';

import React from 'react';
import { Package, ShoppingBag } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        {/* Welcome Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-teal-500 mb-4">
          Welcome to Aunty.pk
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          List your products and see your orders
        </p>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <a
            href="/dashboard/products"
            className="group bg-white p-8 rounded-2xl border-2 border-teal-100 hover:border-teal-500 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-500 transition-colors">
              <ShoppingBag className="w-8 h-8 text-teal-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Products</h3>
            <p className="text-sm text-gray-500">Manage your product listings</p>
          </a>

          <a
            href="/dashboard/orders"
            className="group bg-white p-8 rounded-2xl border-2 border-teal-100 hover:border-teal-500 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-500 transition-colors">
              <Package className="w-8 h-8 text-teal-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Orders</h3>
            <p className="text-sm text-gray-500">View and manage orders</p>
          </a>
        </div>
      </div>
    </div>
  );
}
