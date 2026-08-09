import '../styles/globals.css'
import { CartProvider } from '../context/CartContext'
import type { AppProps } from 'next/app'
import Script from 'next/script' // Ye Script component import kiya gaya hai

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* --- Google Analytics 4 Code Start --- */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=G-P07XWJD49Z`} // Yahan apni GA4 ID daalein
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-P07XWJD49Z'); // Yahan bhi apni GA4 ID daalein
        `}
      </Script>
      {/* --- Google Analytics 4 Code End --- */}

      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </>
  )
}