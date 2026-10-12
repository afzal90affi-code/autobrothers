import { defineField, defineType } from "sanity";

/* ==================== SHOP ==================== */

const category = defineType({
  name: "category",
  title: "Product Category",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (R) => R.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (R) => R.required() }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
});

const subcategory = defineType({
  name: "subcategory",
  title: "Product Sub-Category",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (R) => R.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (R) => R.required() }),
    defineField({ name: "parentCategory", title: "Main Category", type: "reference", to: [{ type: "category" }], validation: (R) => R.required() }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
});

const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (R) => R.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (R) => R.required() }),
    defineField({ name: "price", title: "Price (PKR)", type: "string" }),
    defineField({ name: "oldPrice", title: "Old Price (PKR) — discount dikhane ke liye", type: "string" }),

    /* ============================================================
       ✅ PART IDENTITY — SEO ke liye (used parts ka dil)
    ============================================================ */
    defineField({
      name: "brand",
      title: "Brand",
      type: "string",
      options: {
        list: ["Toyota", "Honda", "Nissan", "Suzuki", "Mazda", "Mitsubishi", "Daihatsu", "Subaru", "Isuzu", "Lexus", "Hino", "Kia", "Hyundai", "Other"],
      },
    }),
    defineField({
      name: "partNumber",
      title: "Part Number / OEM (optional) — mechanics isse search karte hain",
      type: "string",
      description: "e.g 16800-0D010",
    }),
    defineField({
      name: "engineCode",
      title: "Engine Code (optional) — kis engine ka part hai",
      type: "string",
      description: "e.g 2ZR-FE, K20Z, 1NZ-FE",
    }),

    /* ============================================================
       ✅ USED CONDITION — trust signals
    ============================================================ */
    defineField({
      name: "condition",
      title: "Condition",
      type: "string",
      options: { list: ["Good", "Average", "Bad"] },
    }),
    defineField({
      name: "conditionScore",
      title: "Condition Score (0-10)",
      type: "number",
      description: "Good=8, Average=6, Bad=3 auto — manually adjust kar sakte ho",
      validation: (R) => R.min(0).max(10),
    }),
    defineField({ name: "mileage", title: "Mileage (km) — e.g 45,000", type: "string" }),
    defineField({ name: "warranty", title: "Warranty (days)", type: "number" }),
    defineField({ name: "qualityChecked", title: "Quality Checked / Tested", type: "boolean", initialValue: true }),
    defineField({ name: "japanImported", title: "Japan Imported", type: "boolean", initialValue: false }),

    defineField({ name: "featured", title: "Featured", type: "boolean", initialValue: false }),
    defineField({ name: "newArrival", title: "New Arrival", type: "boolean", initialValue: false }),
    defineField({ name: "inStock", title: "In Stock", type: "boolean", initialValue: true }),

    defineField({ name: "description", title: "Description", type: "text" }),
    defineField({ name: "model", title: "Car Model (e.g. 2015-2020)", type: "string" }),
    defineField({ name: "subcategory", title: "Sub-Category", type: "reference", to: [{ type: "subcategory" }] }),
    defineField({ name: "images", title: "Images", type: "array", of: [{ type: "image" }] }),
    defineField({ name: "publishedAt", title: "Published At", type: "datetime" }),

    /* ============================================================
       ✅ SEO — Google pe kya dikhe (product title/desc override)
    ============================================================ */
    defineField({
      name: "seoTitle",
      title: "SEO Title (60 chars max)",
      type: "string",
      description: "Khali chhodo to product title hi use hoga",
      validation: (R) => R.max(70),
    }),
    defineField({
      name: "seoDesc",
      title: "SEO Description (160 chars max)",
      type: "text",
      description: "Khali chhodo to description se auto banega",
      validation: (R) => R.max(200),
    }),
  ],
});

/* ==================== BLOG ==================== */

const blogCategory = defineType({
  name: "blogCategory",
  title: "Blog Category",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (R) => R.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (R) => R.required() }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
});

const blogSubcategory = defineType({
  name: "blogSubcategory",
  title: "Blog Sub-Category",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (R) => R.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (R) => R.required() }),
    defineField({ name: "parentCategory", title: "Blog Category", type: "reference", to: [{ type: "blogCategory" }] }),
  ],
});

const blog = defineType({
  name: "blog",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (R) => R.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (R) => R.required() }),
    defineField({ name: "desc", title: "Short Description", type: "text" }),
    defineField({ name: "category", title: "Category", type: "reference", to: [{ type: "blogCategory" }] }),
    defineField({ name: "subCategory", title: "Sub-Category", type: "reference", to: [{ type: "blogSubcategory" }] }),
    defineField({ name: "writerName", title: "Writer Name", type: "string" }),
    defineField({ name: "seoTitle", title: "SEO Title", type: "string" }),
    defineField({ name: "seoDesc", title: "SEO Description", type: "text" }),
    defineField({ name: "isPublished", title: "Published", type: "boolean", initialValue: false }),
    defineField({ name: "date", title: "Date", type: "datetime" }),
    /* ✅ Auto News source fields (auto-news route in fields save karta hai) */
    defineField({ name: "newsTime", title: "News Time", type: "string", hidden: true }),
    defineField({ name: "sourceUrl", title: "Source URL", type: "url", hidden: true }),
    defineField({ name: "sourceName", title: "Source Name", type: "string", hidden: true }),
    // ✅ 10 content parts + 10 images (BlogForm ke mutabiq)
    ...Array.from({ length: 10 }, (_, i) => [
      defineField({ name: `content${i + 1}`, title: `Content Part ${i + 1}`, type: "string", hidden: true }),
      defineField({ name: `img${i + 1}`, title: `Image ${i + 1}`, type: "image" }),
    ]).flat(),
  ],
});

/* ==================== NEW CARS + FINANCE ==================== */

const carBrand = defineType({
  name: "carBrand",
  title: "Car Brand",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (R) => R.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" } }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
});

const car = defineType({
  name: "car",
  title: "New Car",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Car Name", type: "string", validation: (R) => R.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (R) => R.required() }),
    defineField({ name: "brand", title: "Brand", type: "string" }),
    defineField({ name: "price", title: "Price (PKR)", type: "string" }),
    defineField({ name: "image", title: "Image", type: "image" }),
    defineField({ name: "year", title: "Model Year", type: "string" }),
    defineField({ name: "engine", title: "Engine (e.g. 1300cc)", type: "string" }),
    defineField({ name: "transmission", title: "Transmission", type: "string" }),
    defineField({ name: "fuel", title: "Fuel", type: "string" }),
    defineField({ name: "featured", title: "Featured", type: "boolean", initialValue: false }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
});

const financeBank = defineType({
  name: "financeBank",
  title: "Finance Bank",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Bank Name", type: "string", validation: (R) => R.required() }),
    defineField({ name: "rate", title: "Interest Rate (% per year)", type: "number", validation: (R) => R.required() }),
    defineField({ name: "minDownPct", title: "Min Down Payment (%)", type: "number", initialValue: 30 }),
    defineField({ name: "maxTenure", title: "Max Tenure (years)", type: "number", initialValue: 5 }),
    defineField({ name: "processingFee", title: "Processing Fee (PKR)", type: "string" }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
});

export const schemaTypes = [
  // Shop
  category, subcategory, product,
  // Blog
  blogCategory, blogSubcategory, blog,
  // Cars + Finance
  carBrand, car, financeBank,
];