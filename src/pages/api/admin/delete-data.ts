import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@sanity/client"

const serverClient = createClient({
  projectId: "nub55wmw",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { id, type } = req.body

    if (!id || !type) {
      return res.status(400).json({ success: false, error: "ID and type are required" })
    }

    // Agar category delete ho rahi hai, to pehle uski subcategories aur products delete karo
    if (type === "category") {
      // Subcategories delete
      const subcats = await serverClient.fetch(
        `*[_type == "subcategory" && parentCategory._ref == $id]._id`,
        { id }
      )
      for (const subId of subcats) {
        await serverClient.delete(subId)
      }

      // Products delete
      const products = await serverClient.fetch(
        `*[_type == "product" && subcategory->parentCategory._id == $id]._id`,
        { id }
      )
      for (const prodId of products) {
        await serverClient.delete(prodId)
      }
    }

    // Agar subcategory delete ho rahi hai, to pehle uske products delete karo
    if (type === "subcategory") {
      const products = await serverClient.fetch(
        `*[_type == "product" && subcategory._ref == $id]._id`,
        { id }
      )
      for (const prodId of products) {
        await serverClient.delete(prodId)
      }
    }

    // Main document delete karo
    await serverClient.delete(id)

    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error("Delete Error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}