import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your selected auto parts and order via WhatsApp — AutoBrothers Pakistan.",
  // ✅ Cart/checkout pages ko Google se index nahi karwana — SEO best practice
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}