import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:    'var(--color-primary)',
        secondary:  'var(--color-secondary)',
        accent:     'var(--color-accent)',
        warning:    'var(--color-warning)',
        success:    'var(--color-success)',
        background: 'var(--color-background)',
        cream:      'var(--color-background)',
        darkgray:   'var(--color-darkgray)',
        lavender:   'var(--color-lavender)',
        surface:    'var(--color-surface)',
        peach:      '#FFDFD3',
        mint:       '#D4F1F4',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        mono:  ['"VT323"', 'monospace'],
      },
      boxShadow: {
        pixel:    '3px 3px 0px 0px rgba(0,0,0,0.1)',
        'pixel-lg': '6px 6px 0px 0px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config;