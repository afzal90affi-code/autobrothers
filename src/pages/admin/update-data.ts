import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@sanity/client';

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { id, type, title, price, condition, featured, newArrival, description, model, imageData, fileName } = req.body;

    let patchData: any = {};
    
    if (type === 'product') {
      patchData = { title, price, condition, featured, newArrival, description, model };
    } else if (type === 'category') {
      patchData = { title };
    } else if (type === 'subcategory') {
      patchData = { title };
    }

    // Image update logic
    if (imageData && fileName) {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const imageAsset = await serverClient.assets.upload('image', buffer, { filename: fileName });

      if (type === 'product') {
        patchData.images = [{ _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } }];
      } else {
        patchData.image = { _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } };
      }
    }

    await serverClient.patch(id).set(patchData).commit();
    res.status(200).json({ success: true });

  } catch (error: any) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}