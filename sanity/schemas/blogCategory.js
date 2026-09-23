export default {
  name: 'blogCategory',
  title: 'Blog Category',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: "order", title: "Sort Order", type: "number", initialValue: 0 },
    {
      name: 'image',
      title: 'Category Image',
      type: 'image',
      options: { hotspot: true }
    }
  ]
}