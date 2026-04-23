'use client'

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  const placeholders = [
    "Search for Shami Kabab",
    "Search for Biryani",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Add your search logic here
  };

  return (
    <div className="bg-white py-5 shadow-sm">
      <div className="max-w-[600px] mx-auto px-4">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center border-2 border-teal-500 rounded-full overflow-hidden bg-white">
            <div className="pl-5 pr-3 flex items-center">
              <Search className="w-5 h-5 text-teal-500" />
            </div>
            <input
              type="text"
              placeholder={placeholders[placeholderIndex]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-3 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
            />
            <button
              type="submit"
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 transition-colors flex items-center justify-center"
            >
              <svg 
                className="w-5 h-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
