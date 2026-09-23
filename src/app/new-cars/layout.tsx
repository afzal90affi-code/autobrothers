import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Cars in Pakistan — Prices, Specs & Car Finance",
  description:
    "Browse brand new cars in Pakistan — 2025 models, prices, specs. Calculate monthly installments with our car finance EMI calculator and compare bank rates.",
  alternates: { canonical: "https://autobrothers.pk/new-cars" },
  openGraph: {
    title: "AutoBrothers — New Cars & Car Finance",
    description: "Brand new cars 2025 + EMI calculator + bank finance comparison — Pakistan.",
    url: "https://autobrothers.pk/new-cars",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function NewCarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}