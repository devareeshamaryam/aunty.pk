 import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/auth/',
          '/checkout/',
          '/api/',
          '/_next/',
          '/admin/',
        ],
      },
    ],
    sitemap: 'https://www.aunty.pk/sitemap.xml',
    host: 'https://www.aunty.pk',
  };
}