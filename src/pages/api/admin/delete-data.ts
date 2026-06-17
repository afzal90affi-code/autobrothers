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
    const { id, type } = req.body;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    // ✅ SMART CASCADING DELETE LOGIC
    if (type === 'category') {
      // 1. Category ke andar ke Sub Categories dhundhein
      const subcatIds = await serverClient.fetch(`*[_type == "subcategory" && parentCategory._ref == $id]._id`, { id });
      
      // 2. Un Sub Categories ke andar ke Products dhundhein
      if (subcatIds.length > 0) {
        const prodIds = await serverClient.fetch(`*[_type == "product" && subcategory._ref in $subcatIds]._id`, { subcatIds });
        
        // 3. Pehle Products delete karein
        if (prodIds.length > 0) {
          await serverClient.delete(prodIds);
        }
        // 4. Phir Sub Categories delete karein
        await serverClient.delete(subcatIds);
      }
    } 
    
    else if (type === 'subcategory') {
      // 1. Sub Category ke andar ke Products dhundhein
      const prodIds = await serverClient.fetch(`*[_type == "product" && subcategory._ref == $id]._id`, { id });
      
      // 2. Pehle Products delete karein
      if (prodIds.length > 0) {
        await serverClient.delete(prodIds);
      }
    }

    // ✅ FINALLY MAIN DOCUMENT DELETE KAREIN
    await serverClient.delete(id);
    
    res.status(200).json({ success: true });
    
  } catch (error: any) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
