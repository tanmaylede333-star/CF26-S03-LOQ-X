import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 py-1 px-1 select-none text-left group cursor-pointer focus:outline-none"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      {/* Pill-shaped Switch in Nordic Slate Style */}
      <div className="relative w-12 h-6 rounded-full border-2 border-[var(--border-color)] bg-[var(--card-subtle)] p-0.5 transition-all duration-300 flex items-center shrink-0 shadow-sm">
        {/* Animated Sliding Circular Knob */}
        <div
          className={`w-4 h-4 rounded-full bg-[#495464] text-white flex items-center justify-center shadow-sm transform transition-transform duration-300 ${
            isDark ? 'translate-x-6 bg-[#BBBFCA] text-[#1b2028]' : 'translate-x-0'
          }`}
        >
          {isDark ? (
            <Moon className="w-2.5 h-2.5 fill-current" />
          ) : (
            <Sun className="w-2.5 h-2.5 stroke-[2.5]" />
          )}
        </div>
      </div>

      {/* Monospace Label on the Right in Nordic Palette */}
      <span className="font-mono text-[11px] font-bold tracking-widest text-[var(--text-primary)] group-hover:opacity-80 transition-opacity uppercase whitespace-nowrap">
        {isDark ? 'DARK MODE' : 'LIGHT MODE'}
      </span>
    </button>
  );
};
