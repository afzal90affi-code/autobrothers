import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@sanity/client"

// Secure Server-side Sanity Client
const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Allow up to 20MB body size for multiple images
export const config = {
  api: {
    bodyParser: { sizeLimit: "4mb" },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const {
      type,
      title,
      slug,
      tag,
      parentId,
      price,
      condition,
      featured,
      newArrival,
      inStock,
      description,
      model,
      // Single image (legacy support — for category/subcategory)
      imageData,
      fileName,
      // Multi-image (new — for products)
      imagesData,
    } = req.body

    let imageAsset = null
    let imageAssetsArray: any[] = []

    // 1. SINGLE IMAGE UPLOAD (Category / Subcategory)
    if (imageData && fileName) {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")
      imageAsset = await serverClient.assets.upload("image", buffer, {
        filename: fileName,
      })
    }

    // 2. MULTI IMAGE UPLOAD (Products)
    if (imagesData && Array.isArray(imagesData) && imagesData.length > 0) {
      for (const img of imagesData) {
        if (img.data && img.fileName) {
          const base64Data = img.data.replace(/^data:image\/\w+;base64,/, "")
          const buffer = Buffer.from(base64Data, "base64")
          const asset = await serverClient.assets.upload("image", buffer, {
            filename: img.fileName,
          })
          imageAssetsArray.push({
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
          })
        }
      }
    }

    // 3. Build Document
    let docToCreate: any = {}

    if (type === "category") {
      docToCreate = {
        _type: "category",
        title,
        slug: { _type: "slug", current: slug },
        tag,
        image: imageAsset
          ? { _type: "image", asset: { _type: "reference", _ref: imageAsset._id } }
          : undefined,
      }
    } else if (type === "subcategory") {
      docToCreate = {
        _type: "subcategory",
        title,
        slug: { _type: "slug", current: slug },
        parentCategory: { _type: "reference", _ref: parentId },
        image: imageAsset
          ? { _type: "image", asset: { _type: "reference", _ref: imageAsset._id } }
          : undefined,
      }
    } else if (type === "product") {
      // Use multi-image array if provided, else fall back to single image
      const finalImages =
        imageAssetsArray.length > 0
          ? imageAssetsArray
          : imageAsset
          ? [{ _type: "image", asset: { _type: "reference", _ref: imageAsset._id } }]
          : []

      docToCreate = {
        _type: "product",
        title,
        slug: { _type: "slug", current: slug },
        price: price || "",
        condition: condition || "Good",
        featured: featured || false,
        newArrival: newArrival || false,
        inStock: inStock !== undefined ? inStock : true,
        description: description || "",
        model: model || "",
        subcategory: { _type: "reference", _ref: parentId },
        images: finalImages,
      }
    }

    const result = await serverClient.create(docToCreate)
    res.status(200).json({ success: true, data: result })
  } catch (error: any) {
    console.error("API Error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}