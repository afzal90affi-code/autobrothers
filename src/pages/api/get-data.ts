import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@sanity/client"

// Server-side Sanity Client (CORS bypass - server-to-server)
const serverClient = createClient({
  projectId: "nub55wmw",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  try {
    const type = req.query.type as string

    let query = ""

    if (type === "categories") {
      query = `*[_type == "category"] | order(_createdAt desc){
        _id, title, tag,
        "image": coalesce(image.asset->url, null)
      }`
    } else if (type === "subcategories") {
      query = `*[_type == "subcategory"] | order(_createdAt desc){
        _id, title,
        "parentTitle": coalesce(parentCategory->title, "None"),
        "parentId": coalesce(parentCategory->_id, null),
        "image": coalesce(image.asset->url, null)
      }`
    } else if (type === "products") {
      query = `*[_type == "product"] | order(_createdAt desc){
        _id, title, price, condition, featured, newArrival, description,
        "subCatTitle": coalesce(subcategory->title, "None"),
        "subCatId": coalesce(subcategory->_id, null),
        "image": coalesce(images[0].asset->url, null)
      }`
    } else {
      return res.status(400).json({ success: false, error: "Invalid type" })
    }

    const data = await serverClient.fetch(query)

    res.status(200).json({
      success: true,
      data: Array.isArray(data) ? data : [],
      count: Array.isArray(data) ? data.length : 0,
    })
  } catch (error: any) {
    console.error("API Error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Unknown server error",
    })
  }
}