import Image, { type ImageProps } from "next/image";

// 🎯 WmImage — bilkul next/image jaisa (src, alt, fill, sizes sab waise hi),
// lekin har image /api/watermark route se guzarti hai, is liye
// "autobrothers.pk" watermark khud laga hua aata hai.

type LoaderProps = { src: string; width: number; quality?: number };

function wmLoader({ src, width, quality }: LoaderProps): string {
  // Ye paths skip kar dete hain (already processed ya inline)
  if (src.startsWith("/api/watermark")) return src;
  if (src.startsWith("data:")) return src;

  const params = new URLSearchParams({
    src,
    w: String(width),
    q: String(quality || 75),
  });
  return `/api/watermark?${params.toString()}`;
}

export default function WmImage(props: ImageProps) {
  return <Image {...props} loader={wmLoader} />;
}