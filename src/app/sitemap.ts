import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uselessachievements.com';
  
  // Define the main pages of your application
  const routes = [
    '',
    '/achievements',
    '/login',
    '/signup',
    '/privacy-policy',
    '/terms-of-service',
    '/about',
    '/faq',
    '/contact',
  ];

  // Generate sitemap entries for the main routes
  const routeEntries = routes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  })) as MetadataRoute.Sitemap;

  return routeEntries;
} 