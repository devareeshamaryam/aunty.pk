 import { MetadataRoute } from 'next';
import { fetchProducts, fetchCategories } from './lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.aunty.pk';

  // ✅ Static routes - aunty.pk ke actual pages
  const staticRoutes = [
    { route: '',            priority: 1.0,  changeFrequency: 'daily'   as const },
    { route: '/biryani',    priority: 0.9,  changeFrequency: 'daily'   as const },
    { route: '/shami-kabab',priority: 0.9,  changeFrequency: 'daily'   as const },
    { route: '/cart',       priority: 0.5,  changeFrequency: 'monthly' as const },
  ].map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // ✅ Dynamic product pages
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const { products } = await fetchProducts({ limit: 100 });
    productEntries = products.map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Sitemap: Failed to fetch products', error);
  }

  // ✅ Dynamic category/collection pages
  let collectionEntries: MetadataRoute.Sitemap = [];
  try {
    const categories = await fetchCategories();
    collectionEntries = categories.map((category) => ({
      url: `${baseUrl}/collections/${category.slug}`,
      lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Sitemap: Failed to fetch categories', error);
  }

  return [...staticRoutes, ...productEntries, ...collectionEntries];
}