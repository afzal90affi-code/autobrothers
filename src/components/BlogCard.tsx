"use client";

import { useState } from "react";
import Link from "next/link";

export default function BlogCard({ post }: { post: any }) {
  const img = post.cover ? `${post.cover}?w=800&h=450&fit=crop&auto=format&q=70` : null;

  /* ✅ SEO alt — topic + site branding */
  const imgAlt = `${post.title} — AutoBrothers car care blog Pakistan`;

  /* ✅ Writer initials avatar */
  const initials = post.writerName
    ? post.writerName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "";

  /* ✅ Real read time */
  const readMin = post.desc
    ? Math.max(2, Math.ceil(post.desc.split(/\s+/).length / 200))
    : 3;

  /* ✅ SHARE state */
  const [shared, setShared] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();       // Link navigate na kare
    e.stopPropagation();

    const url = `${window.location.origin}/blog/${post.slug}`;
    const shareData = {
      title: post.title,
      text: `${post.title} — AutoBrothers`,
      url,
    };

    try {
      /* Mobile native share sheet */
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        /* Desktop fallback — copy link */
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1500);
      }
    } catch {
      /* user share cancel kar de toh silently ignore */
    }
  };

  return (
    <Link
      href={`/blog/${post.slug}`}
      title={post.title}
      className="group block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-[#F5A623]/40 transition-all duration-300"
    >
      {/* ---------- IMAGE (16:9) ---------- */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {img && (
          <img
            src={img}
            alt={imgAlt}
            loading="lazy"
            width={800}
            height={450}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {/* Category chip */}
        {post.catTitle && (
          <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-sm">
            {post.catTitle}
          </span>
        )}
        {/* ✅ SHARE BUTTON — top-right, image ke upar */}
        <button
          type="button"
          onClick={handleShare}
          aria-label={`Share ${post.title}`}
          title="Share this post"
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-sm transition hover:bg-[#F5A623] hover:text-[#0A1929]"
        >
          {shared ? (
            /* ✓ Copied icon */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            /* Share icon */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
          )}
        </button>
        {/* Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* ---------- CONTENT ---------- */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#F5A623] transition-colors leading-snug">
          {post.title}
        </h3>

        {post.desc && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {post.desc}
          </p>
        )}

        {/* ✅ FOOTER — Writer + date + share + read time */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* ✅ Writer avatar */}
            {initials && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F5A623] to-[#FFB94D] text-[9px] font-black text-[#0A1929]">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              {post.writerName && (
                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="shrink-0 text-[#F5A623]">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {post.writerName}
                </p>
              )}
              <p className="text-[10px] text-gray-400">
                {post.date
                  ? new Date(post.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {/* ✅ SHARE — footer me bhi (bada tap target) */}
            <button
              type="button"
              onClick={handleShare}
              aria-label={`Share ${post.title}`}
              className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 transition hover:border-[#F5A623] hover:text-[#F5A623]"
            >
              {shared ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                  </svg>
                  Share
                </>
              )}
            </button>

            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {readMin} min
            </span>
          </div>
        </div>

        {/* Read CTA */}
        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-[#F5A623] opacity-0 group-hover:opacity-100 transition-opacity">
          Read Full Guide
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}