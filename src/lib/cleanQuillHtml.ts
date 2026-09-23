export function cleanQuillHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<p>(<br\s*\/?>)?<\/p>/g, "")
    .replace(
      /(<img[^>]*src=")(https:\/\/cdn\.sanity\.io\/[^"?]+)(")/g,
      (_m, pre: string, url: string, post: string) =>
        `${pre}${url}?w=800&auto=format&q=70${post}`
    )
    .trim();
}