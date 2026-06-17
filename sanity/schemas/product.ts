const product = {
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    { 
      name: "title", 
      title: "Product Title", 
      type: "string", 
      validation: (Rule: any) => Rule.required().max(100) 
    },
    { 
      name: "slug", 
      title: "Slug", 
      type: "slug", 
      options: { 
        source: "title",
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required()
    },
    { 
      name: "price", 
      title: "Price (e.g Rs 25,000)", 
      type: "string",
      description: "Enter price as a string. Example: '25,000' or 'Contact for Price'"
    },
    { 
      name: "condition", 
      title: "Condition", 
      type: "string", 
      options: { 
        list: [
          { title: "Good", value: "Good" },
          { title: "Average", value: "Average" },
          { title: "Bad", value: "Bad" }
        ],
        layout: "radio",
        direction: "horizontal"
      },
      initialValue: "Good",
      validation: (Rule: any) => Rule.required()
    },
    { 
      name: "inStock", 
      title: "In Stock?", 
      type: "boolean", 
      initialValue: true 
    },
    { 
      name: "featured", 
      title: "Featured Product?", 
      type: "boolean", 
      initialValue: false 
    },
    { 
      name: "newArrival", 
      title: "New Arrival?", 
      type: "boolean", 
      initialValue: false 
    },
    {
      name: "images",
      title: "Product Images",
      type: "array",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
            metadata: ["dimensions", "palette", "lqip"],
          },
          fields: [
            {
              name: "alt",
              title: "Alt Text (for SEO)",
              type: "string",
              options: {
                isHighlighted: true,
              },
            },
          ],
        },
      ],
      options: {
        layout: "grid",
        size: "small",
      },
      validation: (Rule: any) =>
        Rule.required()
            .min(1)
            .max(8)
            .error("Please add at least 1 image (max 8 recommended)"),
    },
    { 
      name: "description", 
      title: "Description", 
      type: "text",
      rows: 4,
      description: "Detailed description of the product"
    },
    { 
      name: "model", 
      title: "Car Model (e.g 2015-2020)", 
      type: "string" 
    },
    {
      name: "subcategory",
      title: "Sub Category",
      type: "reference",
      to: [{ type: "subcategory" }],
      validation: (Rule: any) => Rule.required(),
      options: {
        filter: true,
      },
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "price",
      media: "images[0]",
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "createdAtDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
    {
      title: "Oldest First",
      name: "createdAtAsc",
      by: [{ field: "_createdAt", direction: "asc" }],
    },
    {
      title: "Title A-Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
    {
      title: "Featured First",
      name: "featuredFirst",
      by: [{ field: "featured", direction: "desc" }],
    },
  ],
}

export default product