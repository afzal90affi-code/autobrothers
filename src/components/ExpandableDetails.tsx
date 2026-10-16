"use client";

import { useState } from "react";

type SpecItem = { icon: string; label: string; value: string; mono?: boolean };

export default function ExpandableDetails({
  description,
  fallbackText,
  score,
  scoreColor,
  scorePercent,
  condition,
  qualityChecked,
  specs,
}: {
  description?: string;
  fallbackText: string;
  score: number;
  scoreColor: string;
  scorePercent: number;
  condition?: string;
  qualityChecked?: boolean;
  specs: SpecItem[];
}) {
  const [expanded, setExpanded] = useState(false);

  /* Compact mode: sirf pehli 3 specs + description ke pehle ~180 chars */
  const visibleSpecs = expanded ? specs : specs.slice(0, 3);
  const shortDesc = description
    ? description.length > 180
      ? description.slice(0, 180) + "..."
      : description
    : fallbackText;

  return (
    <div>
      {/* ✅ COMPACT SCORE BAR — chota version */}
      {score > 0 && (
        <div className="mt-4 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Condition
            </p>
            <span className={`text-white text-[11px] font-black px-2 py-0.5 rounded ${scoreColor}`}>
              {score}/10
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${scorePercent}%` }} />
          </div>
        </div>
      )}

      {/* ========== SHORT DESCRIPTION (always) ========== */}
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-6 whitespace-pre-line">
        {expanded ? description || fallbackText : shortDesc}
      </p>

      {/* ========== SPECS — compact grid (3 visible, baaki expand pe) ========== */}
      {visibleSpecs.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {visibleSpecs.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 p-2 rounded-lg border border-gray-100 dark:border-gray-800 text-[11px]">
              <span className="text-sm">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-[8px] uppercase tracking-wider text-gray-400 leading-none">{s.label}</p>
                <p className={`font-bold text-gray-900 dark:text-white truncate ${s.mono ? "font-mono" : ""}`}>
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== MORE DETAILS TOGGLE ========== */}
      {(description && description.length > 180) || specs.length > 3 ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-bold text-[#F5A623] hover:underline"
        >
          {expanded ? (
            <>
              − Less Details
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </>
          ) : (
            <>
              + More Details
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          )}
        </button>
      ) : null}

      {/* ✅ Expand hone pe extra info */}
      {expanded && condition && (
        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
          Rated <strong>{condition}</strong> by our inspection team{qualityChecked ? " — fully tested before listing" : ""}.
        </p>
      )}
    </div>
  );
}