import { createClient } from "@sanity/client"
import imageUrlBuilder from "@sanity/image-url"

// Hardcoded for reliability - public values, no security risk
const projectId = "nub55wmw"
const dataset = "production"

// Read Client (Public - Website ke liye)
export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false,
})

// Write Client (Admin Panel ke liye)
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}