"use client";

import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative flex h-9 w-16 items-center rounded-full border transition-colors duration-300
        border-gray-200 bg-gray-100 dark:border-navy-border dark:bg-navy-lighter"
    >
      {/* Sliding knob */}
      <span
        className={`absolute flex h-7 w-7 items-center justify-center rounded-full text-sm shadow transition-all duration-300
          ${theme === "dark" ? "left-[34px] bg-navy text-accent" : "left-1 bg-white text-amber-500"}`}
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
    </button>
  );
}