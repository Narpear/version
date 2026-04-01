import { useEffect, useState } from 'react';

export type Theme = 'light' | 'glass';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const preferred: Theme = saved === 'glass' ? 'glass' : 'light';
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
  }, []);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'glass' : 'light';
    applyTheme(next);
  };

  return { theme, toggle, applyTheme };
}
