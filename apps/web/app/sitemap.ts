import { MetadataRoute } from 'next';
import { fetchProducts, fetchCategories } from './lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Base routes
  const staticRoutes = [
    '',
    '/pickles',
    '/chutneys',
    '/murabbas',
    '/boosters',
    '/cart',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Fetch all products (up to 100 for now)
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const { products } = await fetchProducts({ limit: 100 });
    productEntries = products.map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Sitemap: Failed to fetch products', error);
  }

  // Fetch all categories (collections)
  let collectionEntries: MetadataRoute.Sitemap = [];
  try {
    const categories = await fetchCategories();
    collectionEntries = categories.map((category) => ({
      url: `${baseUrl}/collections/${category.slug}`,
      lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Sitemap: Failed to fetch categories', error);
  }

  return [...staticRoutes, ...productEntries, ...collectionEntries];
}
