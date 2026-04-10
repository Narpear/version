import { useEffect, useState } from 'react';

export type Theme = 'light' | 'glass';
export type BgTheme = 'feminine' | 'masculine' | 'gender-neutral';

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

export function useBgTheme() {
  const [bgTheme, setBgTheme] = useState<BgTheme>('feminine');

  useEffect(() => {
    const saved = localStorage.getItem('bg-theme') as BgTheme | null;
    const valid: BgTheme[] = ['feminine', 'masculine', 'gender-neutral'];
    const preferred: BgTheme = saved && valid.includes(saved) ? saved : 'feminine';
    setBgTheme(preferred);
    document.documentElement.setAttribute('data-bg-theme', preferred);
  }, []);

  const applyBgTheme = (t: BgTheme) => {
    setBgTheme(t);
    localStorage.setItem('bg-theme', t);
    document.documentElement.setAttribute('data-bg-theme', t);
    window.dispatchEvent(new Event('bgthemechanged'));
  };

  return { bgTheme, applyBgTheme };
}
