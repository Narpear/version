'use client';

import { useTheme } from '@/lib/useTheme';
import { Sparkles, Grid2x2 } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  const icon = theme === 'glass' ? <Grid2x2 size={16} /> : <Sparkles size={16} />;
  const title = theme === 'glass' ? 'Switch to pixel mode' : 'Switch to glass mode';

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
