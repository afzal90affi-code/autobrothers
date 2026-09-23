export default {
  name: 'blogSubcategory',
  title: 'Blog Sub-Category',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: "order", title: "Sort Order", type: "number", initialValue: 0 },
    {
      name: 'parentCategory',
      title: 'Parent Blog Category',
      type: 'reference',
      to: [{ type: 'blogCategory' }]
    }
  ]
}
