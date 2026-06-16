const subcategory = {
  name: 'subcategory',
  title: 'Sub Category',
  type: 'document',
  fields: [
    { name: 'title', title: 'Sub Category Name', type: 'string', validation: (Rule: any) => Rule.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } },
    // Ye Category ko link karega
    { 
      name: 'parentCategory', 
      title: 'Parent Category', 
      type: 'reference', 
      to: [{ type: 'category' }],
      validation: (Rule: any) => Rule.required()
    },
  ]
}
export default subcategory;