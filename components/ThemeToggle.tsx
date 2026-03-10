'use client';

import { useTheme } from '@/lib/useTheme';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 flex items-center justify-center border-2 border-darkgray bg-surface shadow-pixel hover:bg-primary transition-all"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}