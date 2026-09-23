import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Auto Parts — Engines, Catalytic Converters, Transmissions",
  description:
    "Buy quality-checked used auto parts in Pakistan — engines, catalytic converters, transmissions, ignition coils & more. Japan imported, tested. All Pakistan delivery, WhatsApp ordering.",
  alternates: { canonical: "https://autobrothers.pk/products" },
  openGraph: {
    title: "AutoBrothers — Auto Parts Shop",
    description:
      "Quality-checked used auto parts — engines, gearboxes, alternators. All Pakistan delivery.",
    url: "https://autobrothers.pk/products",
    type: "website",
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}