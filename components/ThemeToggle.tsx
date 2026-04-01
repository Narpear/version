'use client';

import { useTheme } from '@/lib/useTheme';
import { Sun, Moon, Sparkles } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  const icon =
    theme === 'dark' ? <Sun size={16} /> :
    theme === 'glass' ? <Sparkles size={16} /> :
    <Moon size={16} />;

  const title =
    theme === 'dark' ? 'Switch to glass mode' :
    theme === 'glass' ? 'Switch to light mode' :
    'Switch to dark mode';

  return (
    <button
      onClick={toggle}
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-10 h-10 flex items-center justify-center border-2 border-darkgray bg-surface shadow-pixel hover:bg-primary transition-all"
      title={title}
    >
      {icon}
    </button>
  );
}
