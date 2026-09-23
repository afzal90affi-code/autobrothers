export default {
  name: 'blog',
  title: 'Blog / Article',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'desc', title: 'Short Description', type: 'text', rows: 2 },
    { name: 'date', title: 'Date', type: 'datetime' },
    { name: "order", title: "Sort Order", type: "number", initialValue: 0 },
    
    // ✅ Blog Category aur Sub-Category References
    {
      name: 'blogCategory',
      title: 'Blog Category',
      type: 'reference',
      to: [{ type: 'blogCategory' }]
    },
    {
      name: 'blogSubCategory',
      title: 'Blog Sub-Category',
      type: 'reference',
      to: [{ type: 'blogSubcategory' }]
    },

    // ✅ Images (1 se 10 tak)
    { name: 'img1', title: 'Main Image (Part 1)', type: 'image', options: { hotspot: true } },
    { name: 'img2', title: 'Image (Part 2)', type: 'image', options: { hotspot: true } },
    { name: 'img3', title: 'Image (Part 3)', type: 'image', options: { hotspot: true } },
    { name: 'img4', title: 'Image (Part 4)', type: 'image', options: { hotspot: true } },
    { name: 'img5', title: 'Image (Part 5)', type: 'image', options: { hotspot: true } },
    { name: 'img6', title: 'Image (Part 6)', type: 'image', options: { hotspot: true } },
    { name: 'img7', title: 'Image (Part 7)', type: 'image', options: { hotspot: true } },
    { name: 'img8', title: 'Image (Part 8)', type: 'image', options: { hotspot: true } },
    { name: 'img9', title: 'Image (Part 9)', type: 'image', options: { hotspot: true } },
    { name: 'img10', title: 'Image (Part 10)', type: 'image', options: { hotspot: true } },

    // ✅ Content Parts (1 se 10 tak)
    { name: 'content1', title: 'Content Part 1', type: 'text', rows: 10 },
    { name: 'content2', title: 'Content Part 2', type: 'text', rows: 10 },
    { name: 'content3', title: 'Content Part 3', type: 'text', rows: 10 },
    { name: 'content4', title: 'Content Part 4', type: 'text', rows: 10 },
    { name: 'content5', title: 'Content Part 5', type: 'text', rows: 10 },
    { name: 'content6', title: 'Content Part 6', type: 'text', rows: 10 },
    { name: 'content7', title: 'Content Part 7', type: 'text', rows: 10 },
    { name: 'content8', title: 'Content Part 8', type: 'text', rows: 10 },
    { name: 'content9', title: 'Content Part 9', type: 'text', rows: 10 },
    { name: 'content10', title: 'Content Part 10', type: 'text', rows: 10 },

    // ✅ SEO Fields
    { name: 'metaTitle', title: 'SEO Meta Title', type: 'string' },
    { name: 'metaDesc', title: 'SEO Meta Description', type: 'text', rows: 2 },

    // ✅ Writer Details
    { name: 'writerName', title: 'Writer Name', type: 'string' },
    { name: 'writerSocial', title: 'Writer Social Link', type: 'url' },

    // ✅ Publish Status
    { name: 'isPublished', title: 'Published', type: 'boolean', initialValue: false }
  ],
  preview: {
    select: { 
      title: 'title', 
      subtitle: 'date',
      media: 'img1'
    }
  }
}