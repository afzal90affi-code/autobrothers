// src/app/api/sanity-webhook/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://autobrothers.pk';
const KEY = process.env.INDEXNOW_KEY || '';

export async function POST(request: Request) {
  try {
    /* 🛡️ Secret check — URL ke sath ?secret=... aayega */
    const { searchParams } = new URL(request.url);
    if (searchParams.get('secret') !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    /* Sirf blog documents par react karo */
    if (body?._type !== 'blog') {
      return NextResponse.json({ message: 'Ignored — sirf blog' });
    }

    /* drafts. wala ID = draft save hua (publish nahi) — skip karo */
    if (body._id?.startsWith('drafts.')) {
      return NextResponse.json({ message: 'Draft save — skip' });
    }

    /* Published document se slug nikaalo */
    const doc = await sanityClient.fetch(
      `*[_type == "blog" && _id == $id][0]{ "slug": slug.current }`,
      { id: body._id }
    );

    if (!doc?.slug) {
      return NextResponse.json({ message: 'Slug nahi mila — skip' });
    }

    const pageUrl = `${SITE}/blog/${doc.slug}`;

    /* 📡 IndexNow ko ping — Bing ko batao */
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'autobrothers.pk',
        key: KEY,
        keyLocation: `${SITE}/${KEY}.txt`,
        urlList: [pageUrl],
      }),
    });

    console.log(`📡 IndexNow [${res.status}]: ${pageUrl}`);
    return NextResponse.json({ success: true, status: res.status, url: pageUrl });

  } catch (e: any) {
    console.error('❌ Webhook error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}