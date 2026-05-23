'use client';

import { useState, useEffect } from 'react';
import BannerSlider from '../components/BannerSlider';
import CategorySection from '../components/CategorySection';
import PicksForYou from '../components/PicksForYou';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
        const res = await fetch(`${API_URL}/categories`);
        const data = await res.json();
        setCategories(data.filter((c: Category) => c.isActive));
      } catch (e) {
        console.error('Failed to fetch categories:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <BannerSlider />

      <div id="popular" />
      <PicksForYou />

      {categories.map((c) => (
        <CategorySection
          key={c._id}
          categoryId={c._id}
          categoryName={c.name}
          categorySlug={c.slug}
          categoryImage={c.image}
          categoryDescription={c.description}
        />
      ))}
    </div>
  );
}
