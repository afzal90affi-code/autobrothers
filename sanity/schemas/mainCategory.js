/* ============================================================
   mainCategory.js — NAYA TOP LEVEL (sab se oper wala)
   Hierarchy: MainCategory -> Category -> SubCategory -> Product
   ============================================================ */

const mainCategory = {
  name: 'mainCategory',
  title: 'Main Category',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Main Category Name',
      type: 'string',
      description: 'e.g. Car Parts, Bike Parts, Truck Parts',
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
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
      media: 'image',
    },
  },
}

export default mainCategory