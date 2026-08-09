import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@sanity/client"

const serverClient = createClient({
  projectId: "nub55wmw",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
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
      imageData,
      fileName,
      imagesData,
      seo, // ✅ NEW: SEO Object from Admin Panel
      ogImageData, // ✅ NEW: OG Image Base64
      ogImageName, // ✅ NEW: OG Image Name
    } = req.body

    let imageAsset = null
    let imageAssetsArray: any[] = []
    let ogImageAsset = null // ✅ NEW: OG Image Asset variable

    // Single Image Upload
    if (imageData && fileName) {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")
      imageAsset = await serverClient.assets.upload("image", buffer, {
        filename: fileName,
      })
    }

    // ✅ NEW: OG Image Upload (For Products)
    if (ogImageData && ogImageName) {
      const base64Data = ogImageData.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")
      ogImageAsset = await serverClient.assets.upload("image", buffer, {
        filename: ogImageName,
      })
    }

    // Multi Image Upload (for products)
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

    // ✅ NEW: Helper function to build SEO object for Sanity
    const buildSeoObject = (seoData: any) => {
      if (!seoData) return undefined
      return {
        _type: "seo", // Sanity mein "seo" name ka object type banwana padega
        metaTitle: seoData.metaTitle || "",
        metaDesc: seoData.metaDesc || "",
        keywords: seoData.keywords || "",
        canonical: seoData.canonical || "",
        robots: seoData.robots || "index, follow",
        // Product specific fields (agar nahi honge toh undefined rehenge)
        ogTitle: seoData.ogTitle || "",
        ogDesc: seoData.ogDesc || "",
        ogImage: ogImageAsset
          ? { _type: "image", asset: { _type: "reference", _ref: ogImageAsset._id } }
          : undefined,
        twitterCard: seoData.twitterCard || "summary_large_image",
        enableSchema: seoData.enableSchema !== false, // default true
      }
    }

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
        seo: buildSeoObject(seo), // ✅ NEW
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
        seo: buildSeoObject(seo), // ✅ NEW
      }
    } else if (type === "product") {
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
        seo: buildSeoObject(seo), // ✅ NEW
      }
    }

    const result = await serverClient.create(docToCreate)
    res.status(200).json({ success: true, data: result })
  } catch (error: any) {
    console.error("API Error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}