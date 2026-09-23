// src/app/about-us/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, ShieldCheck, Wrench, Clock, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | AutoBrothers Pakistan',
  description: 'Learn about AutoBrothers.pk - Pakistan\'s trusted destination for high-quality Japan imported used auto parts, engines, and gearboxes with warranty.',
};

const WA = '923222806245';
const SERVICES = [
  { i: Truck, t: 'Fast Delivery', d: 'All over Pakistan' },
  { i: ShieldCheck, t: '100% Original', d: 'Genuine Japan parts' },
  { i: Wrench, t: 'Warranty', d: 'Checking warranty available' },
  { i: Clock, t: '24/7 Support', d: 'WhatsApp & Call' },
];

export default function AboutUsPage() {
  return (
    <div className="bg-white dark:bg-[#0A1929] min-h-screen pt-20 pb-16 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Our Story</span>
          <h1 className="font-playfair text-4xl md:text-5xl font-extrabold mt-2 text-gray-900 dark:text-white">About AutoBrothers</h1>
        </div>

        {/* Image & Intro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 dark:border-[#1E3A52]">
              <img src="https://i.ibb.co/6c9K3pGG/513539006-24142213332079622-6522291205224702067-n.jpg" alt="AutoBrothers Workshop" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[#F5A623] text-[#0A1929] rounded-xl px-5 py-3 shadow-xl">
              <div className="text-xl font-extrabold">25+</div>
              <div className="text-[10px] font-bold">Years</div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Pakistan&apos;s Trusted <span className="text-[#F5A623]">Auto Parts</span></h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              AutoBrothers.pk is a premier destination for high-quality used auto parts in Pakistan. With over 25 years of experience in the automotive industry, we specialize in importing genuine Japan-origin parts, including engines, gearboxes, alternators, and other essential components.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Our mission is to provide affordable, reliable, and tested auto parts to our customers so they can keep their vehicles running smoothly without breaking the bank. We ensure every part is thoroughly inspected before delivery.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[{ v: '3000+', l: 'Customers' }, { v: '5000+', l: 'Parts Sold' }, { v: '25+', l: 'Years Exp' }].map((s, i) => (
                <div key={i} className="bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-xl p-3 text-center">
                  <div className="text-lg font-extrabold text-[#F5A623]">{s.v}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-white">Why Choose Us?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => { 
              const I = s.i; 
              return (
                <div key={i} className="bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] p-6 rounded-2xl text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#F5A623]/10 flex items-center justify-center mx-auto mb-4">
                    <I size={24} className="text-[#F5A623]" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{s.t}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500">{s.d}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact / AdSense Compliance */}
        <div className="bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Get In Touch</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Have questions about a specific part or need an expert opinion? Our team is available 24/7 on WhatsApp to assist you. We also provide checking warranties on select parts for your peace of mind.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Salam! Mujhe AutoBrothers ke baare mein information chahiye.")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
            <Link href="/contact-us" className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              Contact Us Page
            </Link>
          </div>
          
          {/* Legal Links (Important for AdSense) */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#1E3A52] flex flex-wrap justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/privacy-policy" className="hover:text-[#F5A623] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#F5A623] transition-colors">Terms & Conditions</Link>
            <Link href="/about-us" className="hover:text-[#F5A623] transition-colors">About Us</Link>
            <Link href="/contact-us" className="hover:text-[#F5A623] transition-colors">Contact Us</Link>
          </div>
        </div>

      </div>
    </div>
  );
}