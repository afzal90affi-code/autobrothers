import { createClient } from "@sanity/client"
import imageUrlBuilder from "@sanity/image-url"

const projectId = "nub55wmw"
const dataset = "production"

/* Public read client — pages ke liye (koi token nahi) */
export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false,
})

/* Write client — admin forms ke liye (EDITOR token) */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN, // ✅ FIX: SANITY_API_TOKEN se change kiya
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}