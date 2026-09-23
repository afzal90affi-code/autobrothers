import type { Metadata } from "next";
import Link from "next/link";

const SITE_NAME = "AutoBrothers.pk";
const WHATSAPP_NUMBER = "923222806245"; // ⚠️ apna number
const LAST_UPDATED = "January 2025";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms and Conditions for using ${SITE_NAME} — orders, payments, returns, and usage policies for our auto parts marketplace.`,
  alternates: { canonical: "https://autobrothers.pk/terms" },
  robots: { index: true, follow: true },
};

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="flex items-start gap-3 text-lg font-bold text-gray-900 dark:text-white">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F5A623]/15 text-xs font-black text-[#F5A623]">
          {num}
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 pl-10 text-sm leading-7 text-gray-600 dark:text-gray-400">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-b from-[#F5A623]/5 to-transparent">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#F5A623]">Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-xs text-gray-400">Last Updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm leading-7 text-gray-600 dark:text-gray-400">
          Welcome to <strong className="text-gray-900 dark:text-white">{SITE_NAME}</strong>. By accessing or
          using our website, placing an order, or contacting us through any channel, you agree to be bound by
          these Terms & Conditions. Please read them carefully before using our services.
        </p>

        <Section num="1" title="About Us">
          <p>
            {SITE_NAME} is an online marketplace based in Karachi, Pakistan, dealing in quality-checked used
            auto parts — including engines, catalytic converters, transmissions, ignition coils, starters,
            alternators, and related components. We deliver across Pakistan.
          </p>
        </Section>

        <Section num="2" title="Products & Condition">
          <p>
            Unless explicitly stated otherwise, all products sold on this website are <strong>used / second-hand
            auto parts</strong>. Every part is inspected and quality-checked by our team before listing. The
            condition of each item (Good / Average / Bad) is mentioned on its product page.
          </p>
          <p>
            Product images are of the actual item where possible; however, minor cosmetic differences may exist.
            We reserve the right to update, discontinue, or modify any product listing at any time.
          </p>
        </Section>

        <Section num="3" title="Vehicle Compatibility">
          <p>
            Compatibility information (car model / year range) provided on product pages is offered as guidance.
            It is the customer&apos;s responsibility to verify fitment with their mechanic or contact us before
            purchasing. We are not liable for incompatibility issues where fitment was confirmed as
            &quot;guidance only&quot; and not verified prior to order.
          </p>
        </Section>

        <Section num="4" title="Orders & Payment">
          <p>
            Orders are confirmed via WhatsApp or phone. We accept Cash on Delivery (COD) and Bank Transfer.
            An order is only considered confirmed once our team verifies availability and payment method.
            Prices are listed in Pakistani Rupees (PKR) and are subject to change without prior notice.
          </p>
          <p>
            In the rare case of a pricing or listing error, we reserve the right to cancel the order and issue
            a full refund where payment was already made.
          </p>
        </Section>

        <Section num="5" title="Delivery">
          <p>
            We deliver to all cities in Pakistan through courier services. Delivery timelines are estimates and
            may vary due to courier schedules, weather, or other factors beyond our control. Delivery charges
            (if applicable) are communicated at the time of order confirmation.
          </p>
        </Section>

        <Section num="6" title="Returns & Refunds">
          <p>
            We offer a <strong>7-day return window</strong> from the date of delivery under the following conditions:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>The part is faulty or significantly different from its listed description.</li>
            <li>The item is unused, undamaged, and in its original packaging/condition.</li>
            <li>Proof of purchase (order message/receipt) is provided.</li>
          </ul>
          <p>
            Refunds are processed via bank transfer or the original payment method within 7 working days of
            receiving the returned item. Return shipping costs are borne by the customer unless the item was
            sent in error by us.
          </p>
        </Section>

        <Section num="7" title="Intellectual Property">
          <p>
            All content on this website — including text, images, logos, and design — is the property of
            {SITE_NAME} and may not be copied, reproduced, or distributed without written permission.
          </p>
        </Section>

        <Section num="8" title="Third-Party Links & Advertisements">
          <p>
            This website may contain links to third-party websites and may display advertisements served by
            third-party networks such as Google AdSense. We are not responsible for the content, policies, or
            practices of third parties. Interactions with advertisers are solely between you and the advertiser.
          </p>
        </Section>

        <Section num="9" title="Limitation of Liability">
          <p>
            To the maximum extent permitted by law, {SITE_NAME} shall not be liable for any indirect,
            incidental, or consequential damages arising from the use of our products or website — including
            but not limited to installation costs, labor charges, vehicle damage, or loss of profit. Our total
            liability for any claim shall not exceed the purchase price of the product in question.
          </p>
        </Section>

        <Section num="10" title="Governing Law">
          <p>
            These Terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be
            subject to the exclusive jurisdiction of the courts of Karachi, Pakistan.
          </p>
        </Section>

        <Section num="11" title="Changes to These Terms">
          <p>
            We may update these Terms & Conditions at any time. Changes take effect immediately upon posting
            on this page. Continued use of the website constitutes acceptance of the updated terms.
          </p>
        </Section>

        {/* Contact */}
        <div className="mt-12 rounded-2xl bg-[#13293D] p-6 text-center">
          <h3 className="text-base font-bold text-white">Questions about these Terms?</h3>
          <p className="mt-1 text-xs text-gray-400">
            Hamari team se rabta karein — hum madad ke liye hazir hain
          </p>
          <div className="mt-4 flex flex-col sm:flex-row justify-center gap-2">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
              className="rounded-xl bg-green-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-green-600">
              📱 WhatsApp
            </a>
            <a href={`tel:+${WHATSAPP_NUMBER}`}
              className="rounded-xl border-2 border-[#F5A623] px-6 py-2.5 text-sm font-bold text-[#F5A623] transition hover:bg-[#F5A623] hover:text-[#0A1929]">
              📞 Call
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-gray-100 pt-6 text-xs text-gray-400 dark:border-gray-800">
          <Link href="/privacy-policy" className="hover:text-[#F5A623]">Privacy Policy</Link>
          <Link href="/disclaimer" className="hover:text-[#F5A623]">Disclaimer</Link>
          <Link href="/" className="hover:text-[#F5A623]">← Back to Home</Link>
        </div>
      </article>
    </main>
  );
}