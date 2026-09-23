import type { Metadata } from "next";
import Link from "next/link";

const SITE_NAME = "AutoBrothers.pk";
const WHATSAPP_NUMBER = "923222806245"; // ⚠️ apna number
const LAST_UPDATED = "January 2025";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `Disclaimer for ${SITE_NAME} — used auto parts condition, vehicle compatibility, and third-party advertisement disclosures.`,
  alternates: { canonical: "https://autobrothers.pk/disclaimer" },
  robots: { index: true, follow: true },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-gray-600 dark:text-gray-400">
        {children}
      </div>
    </section>
  );
}

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-b from-[#F5A623]/5 to-transparent">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#F5A623]">Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Disclaimer
          </h1>
          <p className="mt-2 text-xs text-gray-400">Last Updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm leading-7 text-gray-600 dark:text-gray-400">
          The information and products provided by <strong className="text-gray-900 dark:text-white">{SITE_NAME}</strong>
          {" "}are for general use and sale purposes. By using this website, you accept this disclaimer in full.
          If you disagree with any part of this disclaimer, please do not use our website or services.
        </p>

        <Section title="1. Used Auto Parts Condition">
          <p>
            <strong className="text-gray-900 dark:text-white">All products listed on this website are used
            (second-hand) auto parts</strong> unless explicitly described as new. While every item is inspected
            and quality-checked before listing, used parts naturally show signs of prior use, such as minor
            scratches, wear marks, or cosmetic imperfections that may not be visible in photographs.
          </p>
          <p>
            The condition rating (Good / Average / Bad) shown on each product page reflects our internal
            assessment. Buyers should review the condition description carefully and are welcome to request
            additional photos or information via WhatsApp before placing an order.
          </p>
        </Section>

        <Section title="2. Vehicle Compatibility & Fitment">
          <p>
            Compatibility details (make, model, year range) provided on product pages are for guidance purposes
            only. While we strive for accuracy, variations in manufacturing years, trims, and regional
            specifications can affect fitment.
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">We strongly recommend verifying compatibility
            with a qualified mechanic or contacting us directly before purchase.</strong> {SITE_NAME} is not
            liable for parts that do not fit when compatibility was not confirmed prior to ordering.
          </p>
        </Section>

        <Section title="3. Professional Installation Recommended">
          <p>
            Auto parts should be installed by a qualified mechanic or technician. Improper installation can
            cause vehicle damage, part failure, or safety hazards. {SITE_NAME} is not responsible for any
            damage, cost, or injury resulting from improper installation or misuse of purchased parts.
          </p>
        </Section>

        <Section title="4. No Warranty Beyond Stated Policy">
          <p>
            Used auto parts are sold with the return policy described in our{" "}
            <Link href="/terms" className="text-[#F5A623] hover:underline">Terms &amp; Conditions</Link>. No
            additional warranty or guarantee — express or implied — is provided unless explicitly stated on
            the product page or in the order confirmation.
          </p>
        </Section>

        <Section title="5. Information Accuracy">
          <p>
            We work hard to keep product information, prices, and specifications accurate and up to date.
            However, we make no representations or warranties of any kind — express or implied — about the
            completeness, accuracy, or reliability of the information on this website. Errors and omissions
            may occur, and we reserve the right to correct them at any time.
          </p>
        </Section>

        <Section title="6. Google AdSense & Third-Party Advertisements">
          <p>
            This website may display advertisements served by <strong>Google AdSense</strong> and other
            third-party advertising networks. Please note:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior
              visits to this or other websites.
            </li>
            <li>
              Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based
              on your visit to our site and/or other sites on the Internet.
            </li>
            <li>
              You may opt out of personalized advertising by visiting{" "}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer nofollow"
                className="text-[#F5A623] hover:underline">Google Ads Settings</a>.
            </li>
            <li>
              We do not control the content of third-party ads and do not endorse advertised products or
              services unless explicitly stated.
            </li>
          </ul>
          <p>
            For details on how we handle your data, please read our{" "}
            <Link href="/privacy-policy" className="text-[#F5A623] hover:underline">Privacy Policy</Link>.
          </p>
        </Section>

        <Section title="7. External Links">
          <p>
            This website may contain links to external sites that are not operated by us. We have no control
            over the content and practices of these sites and cannot accept responsibility for their
            respective privacy policies or content.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>
            If you have any questions about this disclaimer, please reach out:
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
              className="rounded-xl bg-green-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-green-600 text-center">
              📱 WhatsApp
            </a>
            <a href={`tel:+${WHATSAPP_NUMBER}`}
              className="rounded-xl border-2 border-[#F5A623] px-6 py-2.5 text-sm font-bold text-[#F5A623] transition hover:bg-[#F5A623] hover:text-[#0A1929] text-center">
              📞 Call
            </a>
          </div>
        </Section>

        <div className="mt-10 flex flex-wrap justify-center gap-4 border-t border-gray-100 pt-6 text-xs text-gray-400 dark:border-gray-800">
          <Link href="/terms" className="hover:text-[#F5A623]">Terms & Conditions</Link>
          <Link href="/privacy-policy" className="hover:text-[#F5A623]">Privacy Policy</Link>
          <Link href="/" className="hover:text-[#F5A623]">← Back to Home</Link>
        </div>
      </article>
    </main>
  );
}