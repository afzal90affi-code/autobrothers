"use client";

import { useState } from "react";

export default function CopyButton({
  text,
  label,
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard fail — silently ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy"}
      aria-label={`Copy ${label || text}`}
      className="text-gray-400 hover:text-[#F5A623] transition shrink-0"
    >
      {copied ? (
        /* ✓ Copied icon — green */
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="text-green-500">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        /* 📋 Copy icon */
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}
