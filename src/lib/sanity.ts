import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // Fast loading ke liye
});

const builder = imageUrlBuilder(client);

// TypeScript function for image URLs
export function urlFor(source: any) {
  return builder.image(source);
}