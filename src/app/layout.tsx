import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "../styles/globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";

export const metadata: Metadata = {
  title: "AutoBrothers.pk — Car Accessories & Auto Blog",
  description: "Premium car accessories shop + expert car care blog. All Pakistan delivery.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A1929",
};

/** Theme flash roknay ke liye — paint se pehle hi class set ho jati hai */
const themeScript = `
try {
  var t = localStorage.getItem('ab_theme');
  if (t !== 'light') document.documentElement.classList.add('dark');
} catch (e) {
  document.documentElement.classList.add('dark');
}
`;

/* ✅ GA4 — .env.local: NEXT_PUBLIC_GA_MEASUREMENT_ID */
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // className="dark" hardcoded nahi — script handle karta hai (light users ko flash nahi hoga)
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        {/* ✅ GA4 — sirf tab jab ID set ho */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900 dark:bg-navy dark:text-white transition-colors duration-300">
        <ThemeProvider>
          <CartProvider>
            <Header />
            <main className="min-h-[60vh]">{children}</main>
            <Footer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}