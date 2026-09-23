export type Category = { id: string; name: string; icon?: string; createdAt: string };
export type SubCategory = { id: string; categoryId: string; name: string; createdAt: string };
export type Product = {
  id: string; name: string; price: number; description: string; image: string;
  categoryId: string; subCategoryId: string; featured: boolean; createdAt: string;
};
export type Blog = { id: string; title: string; content: string; image: string; createdAt: string };
export type Settings = { heroImage: string; heroTitle: string; heroSub: string };

const KEY = {
  cat: "ab_categories", sub: "ab_subcategories",
  prod: "ab_products", blog: "ab_blogs", set: "ab_settings",
};

function load<T>(k: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(k) ?? "[]"); } catch { return []; }
}
function save<T>(k: string, v: T[]) { localStorage.setItem(k, JSON.stringify(v)); }

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- Settings (Hero) ---------- */
export const getSettings = (): Settings => {
  if (typeof window === "undefined") return { heroImage: "", heroTitle: "", heroSub: "" };
  try {
    return { heroImage: "", heroTitle: "", heroSub: "", ...JSON.parse(localStorage.getItem(KEY.set) ?? "{}") };
  } catch { return { heroImage: "", heroTitle: "", heroSub: "" }; }
};
export const saveSettings = (s: Settings) => localStorage.setItem(KEY.set, JSON.stringify(s));

/* ---------- Categories ---------- */
export const getCategories = () =>
  load<Category>(KEY.cat).sort((a, b) => a.name.localeCompare(b.name));

export function saveCategory(c: Category) {
  const all = load<Category>(KEY.cat);
  const i = all.findIndex((x) => x.id === c.id);
  if (i >= 0) all[i] = c; else all.push(c);
  save(KEY.cat, all);
}
export function deleteCategory(id: string) {
  save(KEY.cat, load<Category>(KEY.cat).filter((c) => c.id !== id));
  save(KEY.sub, load<SubCategory>(KEY.sub).filter((s) => s.categoryId !== id));
}

/* ---------- Sub-Categories ---------- */
export const getSubCategories = () => load<SubCategory>(KEY.sub);

export function saveSubCategory(s: SubCategory) {
  const all = load<SubCategory>(KEY.sub);
  const i = all.findIndex((x) => x.id === s.id);
  if (i >= 0) all[i] = s; else all.push(s);
  save(KEY.sub, all);
}
export function deleteSubCategory(id: string) {
  save(KEY.sub, load<SubCategory>(KEY.sub).filter((s) => s.id !== id));
}

/* ---------- Products ---------- */
export const getProducts = () =>
  load<Product>(KEY.prod).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function saveProduct(p: Product) {
  const all = load<Product>(KEY.prod);
  const i = all.findIndex((x) => x.id === p.id);
  if (i >= 0) all[i] = p; else all.push(p);
  save(KEY.prod, all);
}
export function deleteProduct(id: string) {
  save(KEY.prod, load<Product>(KEY.prod).filter((p) => p.id !== id));
}

/* ---------- Blogs ---------- */
export const getBlogs = () =>
  load<Blog>(KEY.blog).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function saveBlog(b: Blog) {
  const all = load<Blog>(KEY.blog);
  const i = all.findIndex((x) => x.id === b.id);
  if (i >= 0) all[i] = b; else all.push(b);
  save(KEY.blog, all);
}
export function deleteBlog(id: string) {
  save(KEY.blog, load<Blog>(KEY.blog).filter((b) => b.id !== id));
}