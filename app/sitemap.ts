import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import {
  getAllPublishedTemplatePagesForSitemap,
  getAllTemplates,
} from '@/lib/templates-db';

// Adapt this to your actual domain
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://legal-template-generator.selise.ch';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/about',
    '/faq',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add static routes for all locales
  for (const route of staticRoutes) {
    for (const locale of routing.locales) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
      });
    }
  }

  // Fetch dynamic template pages and templates from database
  const [templatePages, templates] = await Promise.all([
    getAllPublishedTemplatePagesForSitemap(),
    getAllTemplates(),
  ]);

  // Add template pages (custom landing pages from admin panel)
  for (const templatePage of templatePages) {
    sitemapEntries.push({
      url: `${BASE_URL}/${templatePage.locale}/templates/${templatePage.slug}`,
      lastModified: templatePage.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Add templates (fallback landing pages)
  // Use a Set to track slugs we've already added from templatePages
  const addedSlugs = new Set(
    templatePages.map((tp) => `${tp.locale}:${tp.slug}`)
  );

  for (const template of templates) {
    for (const locale of routing.locales) {
      const slugKey = `${locale}:${template.slug}`;
      // Only add if not already added from templatePages
      if (!addedSlugs.has(slugKey)) {
        sitemapEntries.push({
          url: `${BASE_URL}/${locale}/templates/${template.slug}`,
          lastModified: template.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  }

  return sitemapEntries;
}















































