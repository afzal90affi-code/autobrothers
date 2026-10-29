"use client";
import { useState } from "react";

export default function ProductGallery({ images, title }: { images: { url: string; alt: string }[]; title: string }) {
  const [active, setActive] = useState(0);
  if (!images?.length) return null;

  // ✅ Image ko watermark API route se guzaro — server par
  //    "autobrothers.pk" bake ho kar aata hai (save image pe bhi sath)
  const wmSrc = (url: string, w: number, q: number) =>
    `/api/watermark?src=${encodeURIComponent(url)}&w=${w}&q=${q}`;

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <img
          src={wmSrc(images[active].url, 900, 80)}
          alt={images[active].alt || title}
          className="w-full h-full object-cover"
        />
        {active > 0 && (
          <button onClick={() => setActive(active - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow flex items-center justify-center text-gray-700 dark:text-white hover:bg-white">
            ‹
          </button>
        )}
        {active < images.length - 1 && (
          <button onClick={() => setActive(active + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow flex items-center justify-center text-gray-700 dark:text-white hover:bg-white">
            ›
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((im, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                i === active ? "border-[#F5A623]" : "border-transparent opacity-60 hover:opacity-100"
              }`}>
              <img src={wmSrc(im.url, 150, 70)} alt={im.alt || `${title} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}