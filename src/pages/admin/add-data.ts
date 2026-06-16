import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@sanity/client';

// Server-side client (Secret Token, NEXT_PUBLIC nahi hai)
const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // Yahan sirf server token use ho raha hai
});

// Next.js ko batayein ke body ka size 10MB tak ho sakta hai (Images ke liye)
export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
        const { type, title, slug, tag, parentId, price, condition, featured, newArrival, description,model, imageData, fileName } = req.body;

    let imageAsset = null;

    // 1. Image Upload to Sanity (Agar image bheji gayi ho)
    if (imageData && fileName) {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      imageAsset = await serverClient.assets.upload('image', buffer, {
        filename: fileName,
      });
    }

    // 2. Data Save to Sanity
    let docToCreate: any = {};

    if (type === 'category') {
      docToCreate = {
        _type: 'category', title, slug: { _type: 'slug', current: slug },
        tag, image: imageAsset ? { _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } } : undefined,
      };
    } else if (type === 'subcategory') {
      docToCreate = {
        _type: 'subcategory', title, slug: { _type: 'slug', current: slug },
        parentCategory: { _type: 'reference', _ref: parentId },
        image: imageAsset ? { _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } } : undefined,
      };
    } else if (type === 'product') {
      docToCreate = {
        _type: 'product', title, slug: { _type: 'slug', current: slug },
        price, condition, featured, newArrival, inStock: true,
         description: description, 
        model: model, // ✅ YEH ADD KAREIN
        subcategory: { _type: 'reference', _ref: parentId },
        images: imageAsset ? [{ _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } }] : [],
      };
    }

    const result = await serverClient.create(docToCreate);
    res.status(200).json({ success: true, data: result });

  } catch (error: any) {
    console.error("API Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}