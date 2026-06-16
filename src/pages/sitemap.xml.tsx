import { GetServerSideProps } from 'next';
import { client } from '../lib/sanityadmin';

function generateSiteMap(cats: any[], prods: any[]) {
  const SITE_URL = 'https://autobrothers.pk';

  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>${SITE_URL}</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    ${cats.map((cat: any) => `
      <url>
        <loc>${SITE_URL}/category/${cat.slug}</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
    `).join('')}
    ${prods.map((prod: any) => `
      <url>
        <loc>${SITE_URL}/product/${prod.id}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
      </url>
    `).join('')}
  </urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const cats = await client.fetch(`*[_type == "category"]{ "slug": slug.current }`);
  const prods = await client.fetch(`*[_type == "product"]{ "id": _id }`);

  const sitemap = generateSiteMap(cats, prods);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}