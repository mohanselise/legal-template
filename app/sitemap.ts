import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

// Adapt this to your actual domain
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://legal-template-generator.selise.ch';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/about',
    '/faq',
    '/templates/employment-agreement',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of routing.locales) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
      });
    }
  }

  return sitemapEntries;
}



































