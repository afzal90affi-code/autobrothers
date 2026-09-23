// src/app/contact-us/page.tsx
"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Phone, MapPin, Mail, MessageCircle, Send } from 'lucide-react';

export default function ContactUsPage() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const waNumber = '923222806245';
    const text = `Salam! Mera naam ${form.name} hai.\nMera Number: ${form.phone}\n\nMessage:\n${form.message}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-white dark:bg-[#0A1929] min-h-screen pt-20 pb-16 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-12">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Get In Touch</span>
          <h1 className="font-playfair text-4xl md:text-5xl font-extrabold mt-2 text-gray-900 dark:text-white">Contact Us</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto text-sm">We are here to help. Reach out to us via WhatsApp for instant queries or fill out the form below.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Contact Info Cards */}
          <div className="space-y-4">
            <a href="https://wa.me/923222806245" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] p-5 rounded-2xl hover:border-[#F5A623]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-none">
                <MessageCircle size={24} className="text-[#25D366]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">WhatsApp</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">0322-2806245</p>
              </div>
            </a>

            <a href="tel:03222806245" className="flex items-center gap-4 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] p-5 rounded-2xl hover:border-[#F5A623]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#F5A623]/10 flex items-center justify-center flex-none">
                <Phone size={24} className="text-[#F5A623]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Call Us</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">0322-2806245</p>
              </div>
            </a>

            <div className="flex items-center gap-4 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] p-5 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-none">
                <MapPin size={24} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Location</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Karachi, Pakistan</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] p-5 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-none">
                <Mail size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Email</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">info@autobrothers.pk</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 font-bold block mb-2">Your Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-[#0D1F30] border border-gray-200 dark:border-[#1E3A52] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#F5A623]" placeholder="Enter your name" />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 font-bold block mb-2">Phone Number *</label>
                <input type="tel" required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-[#0D1F30] border border-gray-200 dark:border-[#1E3A52] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#F5A623]" placeholder="03xx-xxxxxxx" />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 font-bold block mb-2">Your Message *</label>
                <textarea rows={4} required value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-[#0D1F30] border border-gray-200 dark:border-[#1E3A52] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#F5A623] resize-none" placeholder="How can we help you?"></textarea>
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl text-sm transition-colors">
                <Send size={16} /> Send via WhatsApp
              </button>
              <p className="text-[10px] text-gray-400 text-center">By submitting, you will be redirected to WhatsApp to send this message directly to us.</p>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}