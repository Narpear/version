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
        primary: '#FFB5E8',
        secondary: '#B5DEFF',
        accent: '#BFFCC6',
        warning: '#FFC9DE',
        success: '#C1FBA4',
        background: '#FFF9F0',
        cream: '#FFF9F0',
        darkgray: '#4A4A4A',
        lavender: '#E0BBE4',
        peach: '#FFDFD3',
        mint: '#D4F1F4',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        mono: ['"VT323"', 'monospace'],
      },
      boxShadow: {
        pixel: '3px 3px 0px 0px rgba(0,0,0,0.1)',
        'pixel-lg': '6px 6px 0px 0px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config;