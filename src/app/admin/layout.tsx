"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/products", label: "Products", icon: "🛒" },
  { href: "/admin/blog", label: "Blog Posts", icon: "📝" },
  { href: "/admin/categories", label: "Categories", icon: "📂" },
  { href: "/admin/new-cars", label: "Cars & Finance", icon: "🚗" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Route change pe mobile menu band karo
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (item: typeof NAV[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const sidebarContent = (
    <>
      <div className="px-4 py-5 border-b border-[#1E3A52]">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#FFB94D] text-[#0A1929] font-black flex items-center justify-center text-sm">
            AB
          </span>
          <div>
            <p className="text-sm font-black text-white leading-tight">Admin Panel</p>
            <p className="text-[10px] text-gray-500">AutoBrothers</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-gradient-to-r from-[#F5A623] to-[#FFB94D] text-[#0A1929] shadow-lg shadow-amber-500/20"
                  : "text-gray-400 hover:text-[#F5A623] hover:bg-[#13293D]"
              }`}>
              <span className="text-base">{item.icon}</span> {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#1E3A52]">
        <Link href="/" target="_blank"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-400 hover:text-[#F5A623] hover:bg-[#13293D] transition">
          <span>🌐</span> View Site ↗
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0A1929]">
      {/* ===== Mobile top bar ===== */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-[#1E3A52] bg-[#0D1F30] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#FFB94D] text-[#0A1929] font-black flex items-center justify-center text-xs">
            AB
          </span>
          <span className="text-sm font-black text-white">Admin</span>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Menu"
          className="rounded-lg border border-[#1E3A52] p-2 text-[#F5A623]">
          {open ? "✕" : "☰"}
        </button>
      </header>

      <div className="flex">
        {/* ===== Desktop sidebar ===== */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[#1E3A52] bg-[#0D1F30] md:flex">
          {sidebarContent}
        </aside>

        {/* ===== Mobile sidebar drawer ===== */}
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#1E3A52] bg-[#0D1F30] md:hidden">
              {sidebarContent}
            </aside>
          </>
        )}

        {/* ===== Content ===== */}
        <main className="min-w-0 flex-1 md:ml-60">{children}</main>
      </div>
    </div>
  );
}