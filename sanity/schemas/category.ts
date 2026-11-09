/* ============================================================
   category.js — UPDATED (ab ye MIDDLE level hai)
   Hierarchy: MainCategory -> Category(ye) -> SubCategory -> Product
   Naya field: mainCategory (reference -> mainCategory type)
   - Ye field OPTIONAL hai — khali ho to bhi category 100% kaam karegi
   - Existing category ka slug kabhi change mat karna — URL isi se banta hai
   ============================================================ */

const category = {
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Category Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'tag',
      title: 'Tag',
      type: 'string',
      options: {
        list: [
          { title: 'None', value: '' },
          { title: 'Featured', value: 'featured' },
          { title: 'New Arrival', value: 'new_arrival' },
        ],
        layout: 'radio',
      },
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Chhota number pehle dikhega (footer me). Khali chhod do to title ke hisab se.',
    },
    {
      name: 'mainCategory',
      title: 'Main Category (Upar Wala Group)',
      type: 'reference',
      to: [{ type: 'mainCategory' }],
      description: 'Ye category kis top-level group me hai — e.g. Engine Parts -> Car Parts. Khali chhod sakte ho.',
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
      media: 'image',
    },
  },
}

export default category