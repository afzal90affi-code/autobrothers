/* ============================================================
   index.ts — FINAL SCHEMA REGISTRY (3-Level System)
   ============================================================ */

import product from './product'
import blog from './blog'
import blogCategory from './blogCategory'
import blogSubcategory from './blogSubcategory'
import category from './category'
import subcategory from './subcategory'
import seo from './seo'
import mainCategory from './mainCategory'

export const schemaTypes = [
  // 🌟 NEW — 3-level category ka top level
  mainCategory,

  product,
  blog,
  blogCategory,
  blogSubcategory,
  category,
  subcategory,
  seo,
]

// Dono tarike cover — chahe sanity.config me
// import { schemaTypes } ho ya default import
export default schemaTypes