// src/app/admin/invoice/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
/* ⚠️ Agar Tailwind v4 hai aur PDF/WhatsApp image me "oklch" error aaye:
   npm i html2canvas-pro
   aur upar wali import badal do: import html2canvas from 'html2canvas-pro'; */

/* ================= TYPES ================= */
type Item = {
  id: number;
  name: string;
  engineNo: string;
  qty: number;
  price: number;
  img?: string; /* Engine number photo (compressed data URL) */
};

type StampType = 'NONE' | 'PAID' | 'UNPAID' | 'RETURNED';
type Theme = 'light' | 'dark';
type PaperSize = 'A4' | 'A5';

type SavedInvoice = {
  invoiceNo: string; date: string; savedAt: string;
  customerName: string; customerPhone: string; carName: string;
  workshopRef: string; notes: string; items: Item[];
  grandTotal: number; stamp: StampType;
};

/* ================= CONSTANTS ================= */
const SHOP_PHONE = '0322 2806245';
const SHOP_ADDRESS = 'Shop No 354, Shershah Old Autoparts Market, Karachi';
const WHATSAPP_INTL = '92322806245';
const RETURN_POLICY = 'Product agar damage ya misuse kiya gaya ho to return nahi hoga — jis halat me jayega usi halat me wapas hoga.';
const STORAGE_KEY = 'ab_invoices';
const THEME_KEY = 'ab_invoice_theme';
const ROWS_PER_PAGE = 12;

/* Screen preview = exact paper size (1px ≈ 0.2646mm) */
const PREVIEW_PX: Record<PaperSize, number> = { A4: 750, A5: 529 };
const PRINT_MARGIN_MM: Record<PaperSize, number> = { A4: 6, A5: 4 };

const UNPAID_URDU_LINE1 = 'یہ ادائیگی کے لیے بھیجا گیا بل ہے';
const UNPAID_URDU_LINE2 = 'ادائیگی مکمل ہونے پر یہ اصل بل سمجھا جائے گا';

/* PAPER CONFIG — white premium design */
const PAPER_CFG: Record<PaperSize, {
  pageMinH: string; bandPad: string; bodyPad: string;
  logoH: string; titleSize: string; tagline: string;
  infoText: string; subText: string; label: string; boxPad: string;
  thPad: string; rowH: string; cellPad: string; totalText: string;
  notePad: string; noteMinH: string; policyText: string;
  stampTiny: string; stampBig: string; stampUrdu1: string; stampUrdu2: string;
  wordsText: string; gap: string; wmSize: string; footPad: string;
  photoH: string; photoCap: string; badgeSize: string;
}> = {
  A4: {
    pageMinH: 'min-h-[282mm]', bandPad: 'px-7 py-4', bodyPad: 'px-7',
    logoH: 'h-16', titleSize: 'text-[26px]', tagline: 'text-[10px]',
    infoText: 'text-[11px]', subText: 'text-[10px]', label: 'text-[8px]', boxPad: 'p-2.5',
    thPad: 'px-2 py-2 text-[11px]', rowH: 'h-[36px]', cellPad: 'px-2 py-1 text-[11px]', totalText: 'text-[13px]',
    notePad: 'p-3', noteMinH: 'min-h-[42px]', policyText: 'text-[9px]',
    stampTiny: 'text-[12px]', stampBig: 'text-[42px]', stampUrdu1: 'text-[16px]', stampUrdu2: 'text-[14px]',
    wordsText: 'text-[11px]', gap: 'mb-3', wmSize: 'text-[110px]', footPad: 'px-7 py-3',
    photoH: 'h-20', photoCap: 'text-[8px]', badgeSize: '14px',
  },
  A5: {
    pageMinH: 'min-h-[198mm]', bandPad: 'px-4 py-2.5', bodyPad: 'px-4',
    logoH: 'h-10', titleSize: 'text-[17px]', tagline: 'text-[7px]',
    infoText: 'text-[8px]', subText: 'text-[7px]', label: 'text-[6px]', boxPad: 'p-1.5',
    thPad: 'px-1.5 py-1 text-[8px]', rowH: 'h-[23px]', cellPad: 'px-1.5 py-0.5 text-[8px]', totalText: 'text-[10px]',
    notePad: 'p-2', noteMinH: 'min-h-[22px]', policyText: 'text-[6px]',
    stampTiny: 'text-[9px]', stampBig: 'text-[24px]', stampUrdu1: 'text-[11px]', stampUrdu2: 'text-[10px]',
    wordsText: 'text-[8px]', gap: 'mb-2', wmSize: 'text-[70px]', footPad: 'px-4 py-2',
    photoH: 'h-12', photoCap: 'text-[6px]', badgeSize: '10px',
  },
};

const STAMPS: Record<StampType, {
  label: string; border: string; text: string; btnActive: string;
  badge: string; emoji: string; waText: string;
} | null> = {
  NONE: null,
  PAID: {
    label: 'APPROVED', border: 'border-green-700', text: 'text-green-700',
    btnActive: 'bg-green-600 border-green-700 text-white',
    badge: 'bg-green-100 text-green-700', emoji: '✅',
    waText: '✅ *STATUS: PAID — Officially Approved (Payment Received)*',
  },
  UNPAID: {
    label: 'UNPAID', border: 'border-red-600', text: 'text-red-600',
    btnActive: 'bg-red-600 border-red-700 text-white',
    badge: 'bg-red-100 text-red-700', emoji: '⚠️',
    waText: `⚠️ *STATUS: UNPAID*\n📌 ${UNPAID_URDU_LINE1}\n📌 ${UNPAID_URDU_LINE2}`,
  },
  RETURNED: {
    label: 'RETURNED', border: 'border-blue-600', text: 'text-blue-600',
    btnActive: 'bg-blue-600 border-blue-700 text-white',
    badge: 'bg-blue-100 text-blue-700', emoji: '🔄',
    waText: '🔄 *STATUS: RETURNED — Part wapas aa gaya*',
  },
};

/* ================= HELPERS ================= */
const numberToWords = (num: number): string => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  };
  return inWords(num) + ' Rupees Only';
};

const generateInvoiceNo = () => {
  const d = new Date();
  return `AB-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
};

const blankItem = (): Item => ({ id: Date.now() + Math.random(), name: '', engineNo: '', qty: 1, price: 0 });

/* ✅ WhatsApp number — 03xx ko 92xx me convert */
const toWhatsAppNumber = (phone: string): string => {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return WHATSAPP_INTL;
  if (digits.startsWith('92')) return digits;
  if (digits.startsWith('0')) return '92' + digits.slice(1);
  return digits;
};

/* Photo compress — localStorage safe */
const fileToCompressedDataUrl = (file: File, maxW = 600, quality = 0.72): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas fail')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/* ================= COMPONENT ================= */
export default function InvoicePage() {
  const [theme, setTheme] = useState<Theme>('light');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [carName, setCarName] = useState('');
  const [workshopRef, setWorkshopRef] = useState('');
  const [notes, setNotes] = useState('');
  const [stampType, setStampType] = useState<StampType>('NONE');
  const [items, setItems] = useState<Item[]>([blankItem()]);
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    setInvoiceNo(generateInvoiceNo());
    setDate(new Date().toISOString().split('T')[0]);
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setSavedInvoices(data);
      const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
    } catch { /* ignore */ }
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  const isDark = theme === 'dark';
  const pageBg = isDark ? 'bg-gray-900' : 'bg-gray-200';
  const panelCls = isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800';
  const inputCls = isDark
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500';
  const historyBg = isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50';
  const historyRowCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const subtleText = isDark ? 'text-gray-400' : 'text-gray-500';

  const cfg = PAPER_CFG[paperSize];

  /* ✅ HYDRATION FIX: CSS string variable me — <style> me dangerouslySetInnerHTML se lagenge.
     (Plain children wale <style> me Next.js server quotes escape kar deta hai → mismatch error) */
  const invCss = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');

    .inv-page { width: ${PREVIEW_PX[paperSize]}px; max-width: 100%; margin: 0 auto; }

    .urdu {
      font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Naskh Arabic', 'Urdu Typesetting', serif;
      direction: rtl;
      line-height: 2;
    }
    .urdu-tight { line-height: 1.7; }

    @media print {
      @page { size: ${paperSize === 'A4' ? 'A4' : 'A5'}; margin: ${PRINT_MARGIN_MM[paperSize]}mm; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      body * { visibility: hidden; }
      #invoice-sheet, #invoice-sheet * {
        visibility: visible;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print { display: none !important; }
      .print-root {
        padding: 0 !important; margin: 0 !important;
        min-height: 0 !important; background: #fff !important;
      }
      #invoice-sheet {
        position: absolute; left: 0; top: 0;
        width: 100% !important;
        padding: 0 !important; margin: 0 !important;
      }
      #invoice-sheet > * + * { margin-top: 0 !important; }
      .inv-page {
        width: 100% !important;
        max-width: none !important;
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        page-break-after: always;
        break-after: page;
        page-break-inside: avoid;
        break-inside: avoid;
        overflow: hidden;
      }
      .inv-page:last-child { page-break-after: auto; break-after: auto; }
    }
  `;

  const persist = (list: SavedInvoice[]) => {
    setSavedInvoices(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      alert('⚠️ Storage full ho gayi — purani invoices delete karo ya kam photos use karo.');
    }
  };

  const addItem = () => setItems([...items, blankItem()]);
  const removeItem = (id: number) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id: number, field: keyof Item, value: any) => {
    setItems(items.map(i => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const handleImgUpload = (id: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await fileToCompressedDataUrl(file);
        updateItem(id, 'img', dataUrl);
      } catch {
        alert('Photo load nahi ho saki — dobara try karo.');
      }
    };
    input.click();
  };

  const grandTotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  const filledItems = items.filter(i => i.name);
  const photoItems = filledItems
    .map((it, idx) => ({ ...it, rowNo: idx + 2 }))
    .filter(it => it.img);

  const firstCap = ROWS_PER_PAGE - 1;
  const pageChunks: Item[][] = [];
  if (filledItems.length <= firstCap) {
    pageChunks.push(filledItems);
  } else {
    pageChunks.push(filledItems.slice(0, firstCap));
    for (let i = firstCap; i < filledItems.length; i += ROWS_PER_PAGE) {
      pageChunks.push(filledItems.slice(i, i + ROWS_PER_PAGE));
    }
  }
  const totalPages = pageChunks.length;

  const capturePages = async (): Promise<HTMLCanvasElement[]> => {
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 400));
    const results: HTMLCanvasElement[] = [];
    for (let i = 0; i < totalPages; i++) {
      const el = pageRefs.current[i];
      if (!el) continue;
      el.style.boxShadow = 'none';
      const canvas = await html2canvas(el, {
        scale: 2, useCORS: true, scrollX: 0, scrollY: -window.scrollY,
        windowWidth: document.documentElement.offsetWidth, backgroundColor: '#ffffff',
      });
      el.style.boxShadow = '';
      results.push(canvas);
    }
    return results;
  };

  const handlePrint = () => window.print();

  const handleBlankReceipt = () => {
    setCustomerName(''); setCustomerPhone(''); setCarName('');
    setWorkshopRef(''); setNotes('');
    setItems([blankItem()]);
    setInvoiceNo(generateInvoiceNo());
    setStampType('NONE');
    setTimeout(() => window.print(), 300);
  };

  const handleNewInvoice = () => {
    setCustomerName(''); setCustomerPhone(''); setCarName('');
    setWorkshopRef(''); setNotes('');
    setItems([blankItem()]);
    setInvoiceNo(generateInvoiceNo());
    setDate(new Date().toISOString().split('T')[0]);
    setStampType('NONE');
  };

  const handleSave = () => {
    const record: SavedInvoice = {
      invoiceNo, date, savedAt: new Date().toISOString(),
      customerName, customerPhone, carName, workshopRef, notes,
      items: filledItems, grandTotal, stamp: stampType,
    };
    persist([record, ...savedInvoices]);
    alert(`✅ Invoice ${invoiceNo} save ho gaya! (${date})`);
  };

  const handleDeleteSaved = (invNo: string) => {
    if (!confirm('Ye invoice delete karna hai?')) return;
    persist(savedInvoices.filter(i => i.invoiceNo !== invNo));
  };

  const handleLoadSaved = (inv: SavedInvoice) => {
    setInvoiceNo(inv.invoiceNo);
    setDate(inv.date);
    setCustomerName(inv.customerName);
    setCustomerPhone(inv.customerPhone);
    setCarName(inv.carName);
    setWorkshopRef(inv.workshopRef);
    setNotes(inv.notes);
    setStampType(inv.stamp || 'NONE');
    setItems(inv.items.length ? inv.items : [blankItem()]);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadPDF = async () => {
    const canvases = await capturePages();
    if (!canvases.length) return;
    const dims = paperSize === 'A4' ? [210, 297] : [148, 210];
    const pdf = new jsPDF('p', 'mm', dims as [number, number]);
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    canvases.forEach((canvas, i) => {
      if (i > 0) pdf.addPage();
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgRatio = canvas.width / canvas.height;
      const pageRatio = pageW / pageH;
      let imgW: number, imgH: number;
      if (imgRatio > pageRatio) { imgW = pageW; imgH = pageW / imgRatio; }
      else { imgH = pageH; imgW = pageH * imgRatio; }
      pdf.addImage(imgData, 'JPEG', (pageW - imgW) / 2, (pageH - imgH) / 2, imgW, imgH);
    });
    pdf.save(`${invoiceNo}-${customerName || 'invoice'}.pdf`);
  };

  const handleWhatsApp = async () => {
    const stampCfg = STAMPS[stampType];
    const summary = [
      `🧾 *AutoBrothers Invoice*`,
      `━━━━━━━━━━━━━━━━`,
      `📄 Invoice #: ${invoiceNo}`,
      `📅 Date: ${date}`,
      `👤 Customer: ${customerName || '-'}`,
      `📞 Phone: ${customerPhone || '-'}`,
      `🚗 Car: ${carName || '-'}`,
      workshopRef ? `🔧 Workshop Ref: ${workshopRef}` : '',
      stampCfg ? stampCfg.waText : '',
      `━━━━━━━━━━━━━━━━`,
      `*Items:*`,
      ...filledItems.map((it, idx) =>
        `${idx + 1}. ${it.name} (Engine: ${it.engineNo || '-'})${it.img ? ' 📸' : ''}\n   ${it.qty} x Rs.${it.price} = Rs.${it.qty * it.price}`
      ),
      photoItems.length > 0 ? `\n📸 Engine number photos invoice me attached hain` : '',
      `━━━━━━━━━━━━━━━━`,
      `💰 *Total: Rs. ${grandTotal.toLocaleString()}*`,
      notes ? `📝 Note: ${notes}` : '',
      `━━━━━━━━━━━━━━━━`,
      `⚠️ *Return Policy:* ${RETURN_POLICY}`,
      `━━━━━━━━━━━━━━━━`,
      `🙏 Shukriya — AutoBrothers`,
      `📍 ${SHOP_ADDRESS}`,
      `📞 ${SHOP_PHONE}`,
      `🌐 autobrothers.pk`,
    ].filter(Boolean).join('\n');

    try {
      if (navigator.canShare) {
        const canvases = await capturePages();
        const files: File[] = [];
        for (let i = 0; i < canvases.length; i++) {
          const blob = await new Promise<Blob | null>(res => canvases[i].toBlob(res, 'image/jpeg', 0.95));
          if (blob) files.push(new File([blob], `${invoiceNo}-page${i + 1}.jpg`, { type: 'image/jpeg' }));
        }
        if (files.length && navigator.canShare({ files })) {
          await navigator.share({ title: invoiceNo, text: summary, files });
          return;
        }
      }
    } catch { /* fallback */ }

    /* ✅ FIX: number auto 92 format */
    window.open(`https://wa.me/${toWhatsAppNumber(customerPhone)}?text=${encodeURIComponent(summary)}`, '_blank');
  };

  const activeStamp = STAMPS[stampType];

  const grouped = savedInvoices.reduce<Record<string, SavedInvoice[]>>((acc, inv) => {
    (acc[inv.date] = acc[inv.date] || []).push(inv);
    return acc;
  }, {});

  return (
    <>
      {/* ✅ HYDRATION FIX: CSS dangerouslySetInnerHTML se */}
      <style dangerouslySetInnerHTML={{ __html: invCss }} />

      <div className={`print-root min-h-screen transition-colors ${pageBg} py-6 px-4`}>
        {/* ============ CONTROLS ============ */}
        <div className={`no-print max-w-4xl mx-auto rounded-xl shadow p-5 mb-8 transition-colors ${panelCls}`}>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">🧾 Invoice Studio</h1>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme}
                title={isDark ? 'Day mode' : 'Night mode'}
                className={`text-lg w-10 h-10 rounded-full border-2 transition ${isDark
                  ? 'bg-yellow-400 border-yellow-500 text-gray-900 hover:bg-yellow-300'
                  : 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600'}`}>
                {isDark ? '🌞' : '🌙'}
              </button>
              <button onClick={() => setShowHistory(!showHistory)}
                className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700">
                📂 History ({savedInvoices.length})
              </button>
            </div>
          </div>

          {showHistory && (
            <div className={`border rounded-lg p-3 mb-4 max-h-72 overflow-y-auto transition-colors ${historyBg}`}>
              {savedInvoices.length === 0 ? (
                <p className={`text-sm text-center py-4 ${subtleText}`}>Abhi koi invoice save nahi hui.</p>
              ) : (
                Object.keys(grouped).sort().reverse().map(d => (
                  <div key={d} className="mb-3">
                    <p className={`font-bold text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>📅 {d}</p>
                    {grouped[d].map(inv => {
                      const invStamp = STAMPS[inv.stamp || 'NONE'];
                      const invPhotos = inv.items.filter(it => it.img).length;
                      return (
                        <div key={inv.invoiceNo} className={`flex items-center gap-2 rounded p-2 mb-1 text-sm border transition-colors ${historyRowCls}`}>
                          {invStamp && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${invStamp.badge}`}>
                              {invStamp.emoji} {inv.stamp === 'PAID' ? 'PAID' : invStamp.label}
                            </span>
                          )}
                          <span className={`font-mono ${subtleText}`}>{inv.invoiceNo}</span>
                          <span className="font-medium">{inv.customerName || 'Khali receipt'}</span>
                          {inv.customerPhone && <span className={subtleText}>📞 {inv.customerPhone}</span>}
                          {invPhotos > 0 && <span className="text-[10px]">📸{invPhotos}</span>}
                          <span className="ml-auto font-bold text-amber-500">Rs. {inv.grandTotal.toLocaleString()}</span>
                          <button onClick={() => handleLoadSaved(inv)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">Kholo</button>
                          <button onClick={() => handleDeleteSaved(inv.invoiceNo)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">✕</button>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)}
              placeholder="Invoice #" className={`border rounded p-2 text-sm ${inputCls}`} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className={`border rounded p-2 text-sm ${inputCls}`} />
            <input value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Customer Name" className={`border rounded p-2 text-sm ${inputCls}`} />
            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
              placeholder="📞 Customer Contact: 0321..." className={`border rounded p-2 text-sm ${inputCls}`} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <input value={carName} onChange={e => setCarName(e.target.value)}
              placeholder="🚗 Customer Car (e.g. Toyota Corolla 2014)" className={`border rounded p-2 text-sm ${inputCls}`} />
            <input value={workshopRef} onChange={e => setWorkshopRef(e.target.value)}
              placeholder="🔧 Workshop Reference" className={`border rounded p-2 text-sm ${inputCls}`} />
          </div>

          {/* Items — photo button ke sath */}
          <div className="space-y-2 mb-3">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)}
                  placeholder={`Part ${idx + 1} name`} className={`col-span-4 border rounded p-2 text-sm ${inputCls}`} />
                <input value={item.engineNo} onChange={e => updateItem(item.id, 'engineNo', e.target.value)}
                  placeholder="Engine #" className={`col-span-3 border rounded p-2 text-sm ${inputCls}`} />
                <input type="number" min={1} value={item.qty}
                  onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                  className={`col-span-1 border rounded p-2 text-sm ${inputCls}`} />
                <input type="number" min={0} value={item.price || ''}
                  onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                  placeholder="Price" className={`col-span-2 border rounded p-2 text-sm ${inputCls}`} />

                {/* 📷 Engine photo button */}
                <div className="col-span-1 relative">
                  <button onClick={() => handleImgUpload(item.id)}
                    title="Engine number photo"
                    className={`w-full h-[38px] rounded border text-sm flex items-center justify-center transition ${item.img
                      ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200'
                      : `${inputCls} hover:border-amber-500`}`}>
                    {item.img ? '✓' : '📷'}
                  </button>
                  {item.img && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateItem(item.id, 'img', undefined); }}
                      title="Photo hatao"
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] leading-none flex items-center justify-center hover:bg-red-600">
                      ✕
                    </button>
                  )}
                </div>

                <button onClick={() => removeItem(item.id)}
                  className="col-span-1 text-red-500 font-bold hover:text-red-700">✕</button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <button onClick={addItem}
              className="text-sm bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600">
              + Item Add Karo
            </button>
            <span className={`text-xs ${subtleText}`}>
              Items: {filledItems.length} • Pages: {totalPages}
              {photoItems.length > 0 && ` • 📸 ${photoItems.length} photos`}
            </span>
          </div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="📝 Note (optional)"
            className={`w-full border rounded p-2 text-sm mb-4 ${inputCls}`} rows={2} />

          {/* STAMP SELECTOR */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Stamp:</span>
            <div className="flex flex-wrap gap-1.5">
              {(['NONE', 'PAID', 'UNPAID', 'RETURNED'] as StampType[]).map(s => {
                const c = STAMPS[s];
                const isActive = stampType === s;
                return (
                  <button key={s} onClick={() => setStampType(s)}
                    className={`px-3 py-1.5 rounded text-xs font-bold border-2 transition ${isActive
                      ? c ? c.btnActive : 'bg-gray-800 border-gray-900 text-white'
                      : isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400'
                        : 'bg-white border-gray-300 text-gray-500 hover:border-amber-500'}`}>
                    {s === 'NONE' ? '🚫 No Stamp' : s === 'PAID' ? `${c!.emoji} APPROVED (Paid)` : `${c!.emoji} ${c!.label}`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select value={paperSize} onChange={e => setPaperSize(e.target.value as PaperSize)}
              className={`border rounded p-2 text-sm ${inputCls}`}>
              <option value="A4">A4 Paper</option>
              <option value="A5">A5 Paper</option>
            </select>
            <button onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">🖨️ Print</button>
            <button onClick={handleBlankReceipt}
              className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">🧾 Khali Receipt</button>
            <button onClick={handleSave}
              className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">💾 Save</button>
            <button onClick={handleDownloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">📥 PDF</button>
            <button onClick={handleWhatsApp}
              className="bg-[#25D366] text-white px-4 py-2 rounded text-sm hover:bg-[#1da851]">📱 WhatsApp</button>
            <button onClick={handleNewInvoice}
              className="bg-amber-500 text-white px-4 py-2 rounded text-sm hover:bg-amber-600">➕ Nayi</button>
            <span className={`ml-auto font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Total: Rs. {grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ============ INVOICE — WHITE PREMIUM ============ */}
        <div id="invoice-sheet" className="mx-auto space-y-6">
          {pageChunks.map((pageItems, pIdx) => {
            const isLast = pIdx === totalPages - 1;
            const isFirst = pIdx === 0;
            const leadingEmpty = isFirst ? 1 : 0;
            const emptyCount = ROWS_PER_PAGE - pageItems.length - leadingEmpty;
            let rowNum = isFirst ? 1 : pIdx * ROWS_PER_PAGE;

            return (
              <div key={pIdx}
                ref={el => { pageRefs.current[pIdx] = el; }}
                className={`inv-page relative bg-white text-black shadow-xl overflow-hidden flex flex-col border border-gray-200 ${cfg.pageMinH}`}>

                {/* 💧 WATERMARK */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                  <span className={`font-black text-amber-500 opacity-[0.05] tracking-widest whitespace-nowrap ${cfg.wmSize}`}
                    style={{ transform: 'rotate(-24deg)' }}>
                    AUTOBROTHERS
                  </span>
                </div>

                {/* 🟡 Top gold strip */}
                <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 shrink-0 relative z-[1]" />

                {/* ═══ HEADER — WHITE PREMIUM ═══ */}
                {isFirst ? (
                  <div className="relative z-[1] bg-white">
                    <div className={`flex justify-between items-start ${cfg.bandPad}`}>
                      {/* ─── LEFT: Logo + Brand ─── */}
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="absolute -inset-0.5 rounded-2xl ring-2 ring-amber-400/80" />
                          <div className="relative bg-white rounded-2xl p-2 shadow-sm">
                            <img src="/logo.png" alt="AutoBrothers" className={`${cfg.logoH} w-auto`} />
                          </div>
                        </div>

                        <div>
                          <h1 className={`font-black leading-none tracking-[0.04em] ${cfg.titleSize}`}>
                            <span className="text-amber-600">AUTO</span>
                            <span className="text-slate-800">BROTHERS</span>
                          </h1>
                          {/* Gold underline accent */}
                          <div className="flex items-center gap-1 mt-1">
                            <div className="h-[3px] w-10 bg-amber-500 rounded-full" />
                            <div className="h-[3px] w-3 bg-amber-500/60 rounded-full" />
                            <div className="h-[3px] w-1.5 bg-amber-500/30 rounded-full" />
                          </div>
                          <p className={`text-amber-700 italic leading-snug mt-1 ${cfg.tagline}`}>
                            ✦ Quality Checked Used Parts ✦
                          </p>

                          {/* Contact chips */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={`inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-[2px] text-slate-700 leading-none ${cfg.tagline}`}>
                              📞 {SHOP_PHONE}
                            </span>
                            <span className={`inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-[2px] text-slate-700 leading-none ${cfg.tagline}`}>
                              🌐 autobrothers.pk
                            </span>
                            <span className={`inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-[2px] text-slate-600 leading-none ${cfg.tagline}`}>
                              📍 {SHOP_ADDRESS}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ─── RIGHT: Invoice Card ─── */}
                      <div className="text-right shrink-0">
                        <div className="inline-block bg-amber-500 text-white font-black rounded-lg px-4 py-1 tracking-[0.25em] shadow-sm"
                          style={{ fontSize: cfg.badgeSize }}>
                          INVOICE
                        </div>

                        <div className="mt-1.5 border border-dashed border-amber-400 rounded-lg px-2.5 py-1 bg-amber-50/50 inline-block">
                          <p className={`text-slate-800 font-mono font-bold leading-tight ${cfg.infoText}`}>#{invoiceNo}</p>
                          <p className={`text-slate-600 leading-tight ${cfg.subText}`}>📅 {date}</p>
                        </div>

                        {activeStamp && (
                          <p className={`font-bold leading-tight mt-1 ${activeStamp.text} ${cfg.subText}`}>
                            {activeStamp.emoji} {stampType === 'PAID' ? 'PAID' : activeStamp.label}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Double line separator */}
                    <div className="mx-7 mt-1">
                      <div className="h-[2px] bg-amber-500 rounded-full" />
                      <div className="h-[1px] bg-amber-200 mt-[3px]" />
                    </div>
                  </div>
                ) : (
                  /* Page 2+ compact header — white */
                  <div className="relative z-[1] bg-white">
                    <div className={`flex justify-between items-center ${cfg.bandPad} !py-2.5`}>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute -inset-0.5 rounded-lg ring-1 ring-amber-400/70" />
                          <img src="/logo.png" alt="AutoBrothers" className="relative h-8 w-auto bg-white rounded-lg p-0.5" />
                        </div>
                        <span className="font-black text-[12px] tracking-wide">
                          <span className="text-amber-600">AUTO</span>
                          <span className="text-slate-800">BROTHERS</span>
                        </span>
                      </div>
                      <div className={`text-right text-slate-600 ${cfg.subText}`}>
                        <p>#{invoiceNo} • {date} • <strong className="text-amber-600">Page {pIdx + 1}/{totalPages}</strong></p>
                      </div>
                    </div>
                    <div className="mx-7">
                      <div className="h-[2px] bg-amber-500 rounded-full" />
                    </div>
                  </div>
                )}

                {/* ═══ BODY ═══ */}
                <div className={`flex-1 relative z-[1] ${cfg.bodyPad}`}>

                  {/* CUSTOMER + CAR cards */}
                  {isFirst && (
                    <div className={`grid grid-cols-2 gap-3 ${cfg.gap} mt-3`}>
                      <div className={`border border-gray-300 border-l-4 border-l-amber-500 bg-gray-50 rounded-r-lg ${cfg.boxPad}`}>
                        <p className={`text-amber-600 uppercase font-bold tracking-widest ${cfg.label}`}>👤 Customer</p>
                        <p className={`font-bold text-slate-900 leading-tight ${cfg.infoText}`}>{customerName || '—'}</p>
                        <p className={`text-gray-600 leading-tight ${cfg.subText}`}>📞 {customerPhone || '—'}</p>
                      </div>
                      <div className={`border border-gray-300 border-l-4 border-l-amber-500 bg-gray-50 rounded-r-lg ${cfg.boxPad}`}>
                        <p className={`text-amber-600 uppercase font-bold tracking-widest ${cfg.label}`}>🚗 Vehicle</p>
                        <p className={`font-bold text-slate-900 leading-tight ${cfg.infoText}`}>{carName || '—'}</p>
                        <p className={`text-gray-600 leading-tight ${cfg.subText}`}>🔧 {workshopRef || '—'}</p>
                      </div>
                    </div>
                  )}

                  {/* TABLE — full lines */}
                  <table className={`w-full border-collapse table-fixed ${cfg.gap}`}>
                    <colgroup>
                      <col style={{ width: '6%' }} />
                      <col style={{ width: '30%' }} />
                      <col style={{ width: '28%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '14%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-amber-500 text-white text-left">
                        <th className={`border-2 border-amber-600 ${cfg.thPad}`}>#</th>
                        <th className={`border-2 border-amber-600 ${cfg.thPad}`}>Part Name</th>
                        <th className={`border-2 border-amber-600 ${cfg.thPad}`}>Engine #</th>
                        <th className={`border-2 border-amber-600 ${cfg.thPad}`}>Qty</th>
                        <th className={`border-2 border-amber-600 ${cfg.thPad}`}>Price</th>
                        <th className={`border-2 border-amber-600 text-right ${cfg.thPad}`}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isFirst && (
                        <tr>
                          <td className={`border border-gray-400 text-gray-300 ${cfg.rowH} ${cfg.cellPad}`}>1</td>
                          <td className={`border border-gray-400 ${cfg.rowH}`}></td>
                          <td className={`border border-gray-400 ${cfg.rowH}`}></td>
                          <td className={`border border-gray-400 ${cfg.rowH}`}></td>
                          <td className={`border border-gray-400 ${cfg.rowH}`}></td>
                          <td className={`border border-gray-400 ${cfg.rowH}`}></td>
                        </tr>
                      )}

                      {pageItems.map((item, idx) => {
                        rowNum += 1;
                        const n = rowNum;
                        return (
                          <tr key={item.id} className={idx % 2 ? 'bg-amber-50/50' : 'bg-white'}>
                            <td className={`border border-gray-400 text-gray-600 ${cfg.cellPad}`}>{n}</td>
                            <td className={`border border-gray-400 font-medium text-slate-900 ${cfg.cellPad}`}>{item.name}</td>
                            <td className={`border border-gray-400 font-mono text-slate-700 ${cfg.cellPad}`}>
                              {item.img && (
                                <img src={item.img} alt=""
                                  className={`inline-block ${paperSize === 'A4' ? 'h-6' : 'h-4'} w-auto rounded border border-gray-300 align-middle mr-1`} />
                              )}
                              {item.engineNo || '—'}
                            </td>
                            <td className={`border border-gray-400 ${cfg.cellPad}`}>{item.qty}</td>
                            <td className={`border border-gray-400 ${cfg.cellPad}`}>Rs. {item.price.toLocaleString()}</td>
                            <td className={`border border-gray-400 text-right font-bold text-slate-900 ${cfg.cellPad}`}>Rs. {(item.qty * item.price).toLocaleString()}</td>
                          </tr>
                        );
                      })}

                      {Array.from({ length: emptyCount }).map((_, i) => {
                        rowNum += 1;
                        const n = rowNum;
                        return (
                          <tr key={`e-${pIdx}-${i}`}>
                            <td className={`border border-gray-400 text-gray-300 ${cfg.rowH} ${cfg.cellPad}`}>{n}</td>
                            <td className={`border border-gray-400 ${cfg.rowH}`}></td>
                            <td className={`border border-gray-400 ${cfg.rowH}`}></td>
                            <td className={`border border-gray-400 ${cfg.rowH}`}></td>
                            <td className={`border border-gray-400 ${cfg.rowH}`}></td>
                            <td className={`border border-gray-400 ${cfg.rowH}`}></td>
                          </tr>
                        );
                      })}

                      {isLast && (
                        <tr className="bg-amber-100">
                          <td colSpan={4} className={`border-2 border-amber-600 text-right font-black tracking-wider text-slate-800 ${cfg.cellPad}`}>
                            GRAND TOTAL
                          </td>
                          <td colSpan={2} className={`border-2 border-amber-600 text-right font-black text-amber-700 ${cfg.totalText} ${cfg.cellPad}`}>
                            {grandTotal > 0 ? `Rs. ${grandTotal.toLocaleString()}` : '__________'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* ===== Aakhri page content ===== */}
                  {isLast && (
                    <>
                      {/* ✅ ENGINE NUMBER PHOTOS */}
                      {photoItems.length > 0 && (
                        <div className={cfg.gap}>
                          <p className={`text-amber-600 uppercase font-bold tracking-widest ${cfg.label}`}>📸 Engine Number Photos</p>
                          <div className="flex flex-wrap gap-2">
                            {photoItems.map(p => (
                              <div key={p.id} className="border border-gray-300 rounded-lg p-1 bg-white">
                                <img src={p.img} alt={`Engine #${p.rowNo}`}
                                  className={`${cfg.photoH} w-auto object-contain rounded`} />
                                <p className={`text-center text-gray-600 leading-tight ${cfg.photoCap}`}>
                                  #{p.rowNo} • {p.name.substring(0, 14)}{p.name.length > 14 ? '…' : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amount in words — gold box */}
                      <div className={`bg-amber-50 border-l-4 border-amber-500 rounded-r-lg px-3 py-2 ${cfg.wordsText} ${cfg.gap}`}>
                        <strong className="text-amber-700 uppercase tracking-wide" style={{ fontSize: 'inherit' }}>In Words:</strong>{' '}
                        <span className="italic text-slate-800">
                          {grandTotal > 0 ? numberToWords(grandTotal) : '_________________________'}
                        </span>
                      </div>

                      {/* Note + STAMP overlay */}
                      <div className="relative mb-3">
                        <div className={`border-2 border-dashed border-amber-400 bg-amber-50/30 rounded-lg ${cfg.notePad}`}>
                          <p className={`font-bold text-amber-700 uppercase tracking-widest ${cfg.label}`}>📝 Note / Remarks</p>
                          <p className={`text-slate-800 whitespace-pre-wrap ${cfg.noteMinH} ${cfg.subText}`}>
                            {notes || '_______________________________________________'}
                          </p>
                        </div>

                        {activeStamp && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            {stampType === 'PAID' && (
                              <div style={{ transform: 'rotate(-10deg)' }}
                                className="border-[3px] border-green-700 rounded-lg px-5 py-1.5 opacity-90 bg-white/60">
                                <div className="border-2 border-green-700 rounded px-5 py-1.5 text-center">
                                  <p className={`tracking-[0.3em] text-green-700 font-bold ${cfg.stampTiny}`}>
                                    AUTOBROTHERS • OFFICIAL DOCUMENT
                                  </p>
                                  <p className={`font-black text-green-700 tracking-[0.25em] leading-tight ${cfg.stampBig}`}>
                                    APPROVED
                                  </p>
                                  <p className={`text-green-700 font-semibold ${cfg.stampTiny}`}>
                                    PAYMENT RECEIVED • {date}
                                  </p>
                                </div>
                              </div>
                            )}

                            {stampType === 'UNPAID' && (
                              <div style={{ transform: 'rotate(-8deg)' }}
                                className="border-[3px] border-red-600 rounded-lg px-5 py-1.5 opacity-90 bg-white/70">
                                <div className="border-2 border-red-600 rounded px-5 py-1.5 text-center">
                                  <p className={`tracking-[0.3em] text-red-600 font-bold ${cfg.stampTiny}`}>
                                    AUTOBROTHERS • OFFICIAL DOCUMENT
                                  </p>
                                  <p className={`font-black text-red-600 tracking-[0.2em] leading-tight ${cfg.stampBig}`}>
                                    UNPAID
                                  </p>
                                  {/* ✅ Urdu Nastaliq font classes */}
                                  <p className={`urdu urdu-tight font-bold text-red-700 ${cfg.stampUrdu1}`} lang="ur">
                                    {UNPAID_URDU_LINE1}
                                  </p>
                                  <p className={`urdu urdu-tight text-red-700 font-semibold ${cfg.stampUrdu2}`} lang="ur">
                                    {UNPAID_URDU_LINE2}
                                  </p>
                                  <p className={`text-red-600 font-semibold ${cfg.stampTiny}`}>
                                    PAYMENT PENDING • {date}
                                  </p>
                                </div>
                              </div>
                            )}

                            {stampType === 'RETURNED' && (
                              <div style={{ transform: 'rotate(-18deg)' }}
                                className={`border-[6px] border-double ${activeStamp.border} ${activeStamp.text} rounded-xl font-black tracking-[0.2em] opacity-80 px-7 py-2.5 ${cfg.stampBig}`}>
                                {activeStamp.label}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* UNPAID Urdu bayan */}
                      {stampType === 'UNPAID' && (
                        <div className="mb-3 p-2 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                          <p className="font-bold text-red-700">⚠️ اہم نوٹ:</p>
                          <p className="urdu text-[13px] font-bold text-red-800" lang="ur">{UNPAID_URDU_LINE1}۔</p>
                          <p className="urdu text-[12px] text-red-800" lang="ur">{UNPAID_URDU_LINE2}۔</p>
                          <p className="urdu text-[12px] text-red-700" lang="ur">
                            جدید ادائیگی کے بعد &quot;APPROVED&quot; سیل لگا کر اصل بل جاری کیا جائے گا۔
                          </p>
                        </div>
                      )}

                      {/* Return policy */}
                      <div className={`mb-3 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded ${cfg.policyText}`}>
                        <p className="text-red-800 leading-snug">
                          <strong>⚠️ Return Policy:</strong> {RETURN_POLICY}
                          {workshopRef && <> • <strong>🔧 Workshop:</strong> {workshopRef}</>}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* ═══ FOOTER — WHITE PREMIUM ═══ */}
                <div className="mt-auto relative z-[1]">
                  <div className="mx-7">
                    <div className="h-[2px] bg-amber-500 rounded-full" />
                    <div className="h-[1px] bg-amber-200 mt-[3px]" />
                  </div>
                  <div className={`flex justify-between items-end ${cfg.footPad}`}>
                    <div className={`text-slate-600 leading-snug ${cfg.subText}`}>
                      <p>📍 {SHOP_ADDRESS}</p>
                      <p>📞 <span className="font-bold text-slate-900">{SHOP_PHONE}</span> • 🌐 autobrothers.pk</p>
                      <p className="text-gray-500">✅ Quality-checked parts • 🚚 All Pakistan Delivery</p>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-dashed border-gray-500 w-36 mx-auto mb-1"
                        style={{ marginTop: paperSize === 'A4' ? '26px' : '14px' }} />
                      <p className={`text-slate-700 ${cfg.subText}`}>Authorized Signature</p>
                    </div>
                  </div>
                  <p className={`text-center text-gray-400 pb-2 ${cfg.label}`}>
                    🙏 Shukriya — AutoBrothers.pk{totalPages > 1 && ` | Page ${pIdx + 1}/${totalPages}`}
                  </p>
                  {/* Bottom gold strip */}
                  <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}