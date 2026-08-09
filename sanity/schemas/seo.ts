// schemas/seo.ts
export default {
  name: "seo",
  title: "SEO & Social Data",
  type: "object",
  options: {
    collapsible: true,
    collapsed: true,
  },
  fields: [
    { name: "metaTitle", title: "Meta Title", type: "string" },
    { name: "metaDesc", title: "Meta Description", type: "text", rows: 2 },
    { name: "keywords", title: "Focus Keywords", type: "string" },
    { name: "canonical", title: "Canonical URL", type: "url" },
    {
      name: "robots",
      title: "Robots Directive",
      type: "string",
      options: {
        list: [
          { title: "Index, Follow", value: "index, follow" },
          { title: "NoIndex, Follow", value: "noindex, follow" },
          { title: "Index, NoFollow", value: "index, nofollow" },
          { title: "NoIndex, NoFollow", value: "noindex, nofollow" },
        ],
      },
    },
    { name: "ogTitle", title: "OG Title (Social)", type: "string" },
    { name: "ogDesc", title: "OG Description (Social)", type: "text", rows: 2 },
    {
      name: "ogImage",
      title: "OG Image (Social Share Image)",
      type: "image",
      options: { hotspot: true },
    },
    {
      name: "twitterCard",
      title: "Twitter Card Type",
      type: "string",
      options: {
        list: [
          { title: "Large Image", value: "summary_large_image" },
          { title: "Summary", value: "summary" },
        ],
      },
    },
    { name: "enableSchema", title: "Enable JSON-LD Schema", type: "boolean" },
  ],
}