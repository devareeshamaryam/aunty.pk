 "use client";

import { useState } from "react";
import Link from "next/link";

interface DrinkCardProps {
  name: string;
  subtitle?: string;
  price: number;
  imageUrl: string;
  slug?: string;
  isPopular?: boolean;
  isActive?: boolean;
}

export default function DrinkCard({
  name,
  subtitle,
  price,
  imageUrl,
  slug,
  isPopular = false,
  isActive = false,
}: DrinkCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const cardContent = (
    <div
      className={`relative bg-white rounded-2xl flex flex-col overflow-hidden transition-all duration-200 cursor-pointer
        ${isActive ? "ring-2 ring-teal-500 shadow-lg" : "shadow-sm hover:shadow-md"}`}
    >
      {/* Image Area */}
      <div className="bg-white flex items-center justify-center px-4 pt-6 pb-3 min-h-[160px]">
        <img
          src={imageUrl}
          alt={name}
          className="h-32 w-auto object-contain"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-1.5">
        <h3 className="text-center text-gray-900 font-bold text-[13px] leading-tight line-clamp-2">
          {name}
        </h3>

        {subtitle && (
          <p className="text-center text-gray-400 text-[11px] line-clamp-1">{subtitle}</p>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-[12px]" />

        {/* Price and Add Button */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
            Rs. {price.toLocaleString()}
          </span>

          <button
            onClick={handleAdd}
            className={`w-3/5 py-1.5 rounded-full font-bold text-white text-[10px] tracking-wider transition-all duration-200 active:scale-95
              ${added ? "bg-green-500" : "bg-teal-500 hover:bg-teal-600"}`}
          >
            {added ? "✓ ADDED!" : "ADD"}
          </button>
        </div>
      </div>
    </div>
  );

  return slug ? (
    <Link href={`/product/${slug}`} className="block">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}