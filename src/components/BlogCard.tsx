import Link from "next/link";

export default function BlogCard({ post }: { post: any }) {
  const img = post.cover ? `${post.cover}?w=800&auto=format&q=70` : null;
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {img && (
          <img
            src={img}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>
      <div className="p-5">
        {post.catTitle && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#F5A623]">
            {post.catTitle}
          </span>
        )}
        <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#F5A623] transition-colors">
          {post.title}
        </h3>
        {post.desc && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{post.desc}</p>
        )}
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <span>
            {post.date
              ? new Date(post.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : ""}
          </span>
          <span>•</span>
          <span>{post.read || 3} min read</span>
        </div>
      </div>
    </Link>
  );
}