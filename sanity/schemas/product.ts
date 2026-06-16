const product = {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    { name: 'title', title: 'Product Title', type: 'string', validation: (Rule: any) => Rule.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'price', title: 'Price (e.g Rs 25,000)', type: 'string' },
    { 
      name: 'condition', 
      title: 'Condition', 
      type: 'string', 
      options: { list: ['Good', 'Average', 'Bad'] } 
    },
    { name: 'inStock', title: 'In Stock?', type: 'boolean', initialValue: true },
    { name: 'featured', title: '🔥 Featured Product?', type: 'boolean', initialValue: false },
    { name: 'newArrival', title: '🆕 New Arrival?', type: 'boolean', initialValue: false },
    { name: 'images', title: 'Product Images', type: 'array', of: [{ type: 'image' }] },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'model', title: 'Car Model (e.g 2015-2020)', type: 'string' },
    // Ye Sub-Category ko link karega
    { 
      name: 'subcategory', 
      title: 'Sub Category', 
      type: 'reference', 
      to: [{ type: 'subcategory' }],
      validation: (Rule: any) => Rule.required()
    },
  ]
}
export default product;