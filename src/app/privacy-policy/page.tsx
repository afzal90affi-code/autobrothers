// src/app/privacy-policy/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | AutoBrothers',
  description: 'Read the Privacy Policy of AutoBrothers.pk to understand how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white dark:bg-[#0A1929] min-h-screen pt-20 pb-16 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-10">
          <h1 className="font-playfair text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">Last Updated: August 2024</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-a:text-[#F5A623]">
          
          <p>At AutoBrothers.pk, accessible from autobrothers.pk, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by AutoBrothers.pk and how we use it.</p>

          <h2 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p>When you use our website to submit a lead form or place an order via WhatsApp, we may collect the following information:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-600 dark:text-gray-400">
            <li>Your Name</li>
            <li>Your WhatsApp / Contact Number</li>
            <li>Your City and Delivery Address</li>
            <li>Details about the auto parts or car engine you are looking for</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>The information we collect is used for the following purposes:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-600 dark:text-gray-400">
            <li>To process and deliver your orders accurately.</li>
            <li>To contact you regarding your inquiries and customer support.</li>
            <li>To improve our website and services based on your feedback.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Third-Party Services</h2>
          <p>We use WhatsApp for order processing and communication. Any information shared via WhatsApp is subject to WhatsApp&apos;s own privacy policy. We also use Google AdSense to display ads. Google may use cookies to serve ads based on your prior visits to our website or other websites.</p>
          
          <h2 className="text-xl font-bold mt-8 mb-4">4. Log Files</h2>
          <p>AutoBrothers.pk follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.</p>

          <h2 className="text-xl font-bold mt-8 mb-4">5. Children&apos;s Information</h2>
          <p>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity. AutoBrothers.pk does not knowingly collect any personally identifiable information from children under the age of 13.</p>

          <h2 className="text-xl font-bold mt-8 mb-4">6. Your Consent</h2>
          <p>By using our website, you hereby consent to our Privacy Policy and agree to its terms.</p>

          <h2 className="text-xl font-bold mt-8 mb-4">7. Contact Us</h2>
          <p>If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at <strong>info@autobrothers.pk</strong> or via WhatsApp at <strong>0322-2806245</strong>.</p>

        </div>

      </div>
    </div>
  );
}