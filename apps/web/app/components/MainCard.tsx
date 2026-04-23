"use client";

import { useState } from "react";

interface DrinkCardProps {
  name: string;
  subtitle?: string;
  price: number;
  imageUrl: string;
  isPopular?: boolean;
  isActive?: boolean;
}

export default function DrinkCard({
  name,
  subtitle,
  price,
  imageUrl,
  isPopular = false,
  isActive = false,
}: DrinkCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className={`relative bg-white rounded-2xl flex flex-col overflow-hidden transition-all duration-200
        ${isActive ? "ring-2 ring-teal-500 shadow-lg" : "shadow-sm hover:shadow-md"}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <span className="absolute top-3 left-3 z-10 bg-yellow-400 text-yellow-900 text-[11px] font-bold px-3 py-1 rounded-md">
          Popular
        </span>
      )}

      {/* Image Area */}
      <div className="bg-teal-50/60 flex items-center justify-center px-6 pt-8 pb-4 min-h-[220px]">
        <img
          src={imageUrl}
          alt={name}
          className="h-44 w-auto object-contain"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-5 pt-5 pb-5 gap-2">
        <h3 className="text-center text-gray-900 font-bold text-[15px] leading-snug">
          {name}
        </h3>

        {subtitle && (
          <p className="text-center text-gray-400 text-[13px]">{subtitle}</p>
        )}

        {/* Spacer so price/button stay at bottom */}
        <div className="flex-1" />

        {/* Price */}
        <div className="flex justify-center mt-3">
          <span className="bg-red-500 text-white text-[13px] font-bold px-5 py-1.5 rounded-full">
            Rs. {price.toLocaleString()}
          </span>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAdd}
          className={`mt-2 w-full py-3 rounded-full font-bold text-white text-sm tracking-wider transition-all duration-200 active:scale-95
            ${added ? "bg-green-500" : "bg-teal-500 hover:bg-teal-600"}`}
        >
          {added ? "✓ ADDED!" : "ADD"}
        </button>
      </div>
    </div>
  );
}