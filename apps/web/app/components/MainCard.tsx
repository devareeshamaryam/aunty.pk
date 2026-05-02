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
      className={`relative bg-white rounded-2xl flex flex-col overflow-hidden transition-all duration-200 cursor-pointer aspect-[4/5] md:aspect-auto
        ${isActive ? "ring-2 ring-teal-500 shadow-lg" : "shadow-sm hover:shadow-md"}`}
    >
      {/* Image Area */}
      <div className="bg-white flex items-center justify-center px-3 pt-3 pb-2 flex-1 md:px-6 md:pt-8 md:pb-4 md:min-h-[220px] md:flex-none">
        <img
          src={imageUrl}
          alt={name}
          className="h-20 w-20 md:h-48 md:w-auto object-contain"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col px-3 pb-3 gap-1 md:flex-1 md:px-5 md:pt-5 md:pb-5 md:gap-2">
        <h3 className="text-center text-gray-900 font-bold text-xs md:text-[15px] leading-tight line-clamp-1 md:line-clamp-2">
          {name}
        </h3>

        {subtitle && (
          <p className="text-center text-gray-400 text-[9px] md:text-[13px] line-clamp-1">{subtitle}</p>
        )}

        {/* Spacer between title and price */}
        <div className="flex-1 min-h-[16px] md:min-h-[20px]" />

        {/* Price and Add Button */}
        <div className="flex flex-col items-center gap-1 mt-2 md:gap-2 md:mt-3">
          {/* Price */}
          <span className="bg-red-500 text-white text-[9px] md:text-[11px] font-bold px-2 md:px-4 py-0.5 md:py-1 rounded-full">
            Rs. {price.toLocaleString()}
          </span>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            className={`w-full md:w-2/5 py-1.5 md:py-2 rounded-full font-bold text-white text-[9px] md:text-xs tracking-wider transition-all duration-200 active:scale-95
              ${added ? "bg-green-500" : "bg-teal-500 hover:bg-teal-600"}`}
          >
            {added ? "✓ ADDED!" : "ADD"}
          </button>
        </div>
      </div>
    </div>
  );

  // Wrap full card in Link if slug exists
  return slug ? (
    <Link href={`/product/${slug}`} className="block">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}