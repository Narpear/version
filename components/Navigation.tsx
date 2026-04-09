'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Home, Dumbbell, Utensils, Target, Droplet, Sparkles, User, Footprints, Moon, BookOpen } from 'lucide-react';

const navItems = [
  { href: '/',          icon: Home,       label: 'Home',     page: 'home',     color: '#F5BEDD' }, // rose
  { href: '/gym',       icon: Dumbbell,   label: 'Gym',      page: 'gym',      color: '#BDCFF5' }, // periwinkle
  { href: '/steps',     icon: Footprints, label: 'Steps',    page: 'steps',    color: '#F5CFBD' }, // peach
  { href: '/food',      icon: Utensils,   label: 'Food',     page: 'food',     color: '#BDEFD4' }, // mint
  { href: '/progress',  icon: Target,     label: 'Progress', page: 'progress', color: '#F5E8BD' }, // honey
  { href: '/water',     icon: Droplet,    label: 'Water',    page: 'water',    color: '#BDE8F5' }, // sky
  { href: '/sleep',     icon: Moon,       label: 'Sleep',    page: 'sleep',    color: '#CBBDF5' }, // lavender
  { href: '/skincare',  icon: Sparkles,   label: 'Skincare', page: 'skincare', color: '#E4BDF5' }, // lilac
  { href: '/books',     icon: BookOpen,   label: 'Books',    page: 'books',    color: '#F5D4BD' }, // warm peach
  { href: '/profile',   icon: User,       label: 'Profile',  page: 'profile',  color: '#BDF5E4' }, // seafoam
];

const HIDDEN_PATHS = ['/login', '/signup', '/onboarding'];

export default function Navigation() {
  const pathname = usePathname();

  // Set data-page attribute for per-page accent colours
  useEffect(() => {
    const match = navItems.find(({ href }) =>
      href === '/' ? pathname === '/' : pathname.startsWith(href)
    );
    document.documentElement.setAttribute('data-page', match?.page ?? 'home');
  }, [pathname]);

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <>
      {/* ── Top bar (logo + nav on desktop, logo-only on mobile) ── */}
      <nav className="pwa-top-nav bg-primary border-b-2 border-darkgray">
        <div className="container-pixel py-0">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-darkgray">
              <div className="flex flex-col leading-none">
                <span className="font-pixel text-xl md:text-2xl">VERSION</span>
                <span className="font-mono text-sm text-darkgray/80 hidden md:block">
                  The best version of you
                </span>
              </div>
            </Link>

            {/* Nav links — desktop only */}
            <div className="hidden md:flex gap-1 md:gap-2">
              {navItems.map(({ href, icon: Icon, label, color }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex flex-col items-center justify-center w-16 h-14 md:w-20 md:h-18 border-2 border-darkgray transition-all ${
                      isActive ? 'shadow-pixel' : 'opacity-60 hover:opacity-100 hover:shadow-pixel'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    <Icon size={20} className="mb-1" />
                    <span className="text-pixel-xs">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Full-width bottom tab bar — mobile only ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <nav
          className="w-full bg-primary border-t-2 border-darkgray overflow-x-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex min-w-max w-full">
            {navItems.map(({ href, icon: Icon, label, color }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center py-2 min-h-13 transition-all px-3 ${
                    isActive ? '' : 'opacity-50'
                  }`}
                  style={{ backgroundColor: color, minWidth: '10vw' }}
                >
                  <Icon size={16} />
                  <span className="font-mono text-[8px] mt-0.5 leading-none">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
