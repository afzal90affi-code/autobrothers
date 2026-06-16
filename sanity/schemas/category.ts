const category = {
  name: 'category',
  title: 'Main Category',
  type: 'document',
  fields: [
    { name: 'title', title: 'Category Name', type: 'string', validation: (Rule: any) => Rule.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    // Emoji field delete kar diya gaya hai
    { 
      name: 'tag', 
      title: 'Tag', 
      type: 'string', 
      options: { list: ['none', 'featured', 'new_arrival'] } // ✅ New Arrival option
    },
    { name: 'image', title: 'Category Image', type: 'image', options: { hotspot: true } },
  ]
}
export default category;