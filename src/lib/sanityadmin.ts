import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Read Client (Public - Website ke liye)
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nub55wmw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

// Write Client (Admin Panel ke liye)
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const builder = imageUrlBuilder(client);
export function urlFor(source: any) {
  return builder.image(source);
}