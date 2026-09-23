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
    defineField({ name: "condition", title: "Condition", type: "string", options: { list: ["Good", "Average", "Bad"] } }),
    defineField({ name: "featured", title: "Featured", type: "boolean", initialValue: false }),
    defineField({ name: "newArrival", title: "New Arrival", type: "boolean", initialValue: false }),
    defineField({ name: "inStock", title: "In Stock", type: "boolean", initialValue: true }),
    defineField({ name: "description", title: "Description", type: "text" }),
    defineField({ name: "model", title: "Car Model (e.g. 2015-2020)", type: "string" }),
    defineField({ name: "subcategory", title: "Sub-Category", type: "reference", to: [{ type: "subcategory" }] }),
    defineField({ name: "images", title: "Images", type: "array", of: [{ type: "image" }] }),
    defineField({ name: "publishedAt", title: "Published At", type: "datetime" }),
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