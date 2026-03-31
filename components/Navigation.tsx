'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, Utensils, Target, Droplet, Sparkles, User, Footprints } from 'lucide-react';

const navItems = [
  { href: '/',          icon: Home,       label: 'Home'     },
  { href: '/gym',       icon: Dumbbell,   label: 'Gym'      },
  { href: '/steps',     icon: Footprints, label: 'Steps'    },
  { href: '/food',      icon: Utensils,   label: 'Food'     },
  { href: '/progress',  icon: Target,     label: 'Progress' },
  { href: '/water',     icon: Droplet,    label: 'Water'    },
  { href: '/skincare',  icon: Sparkles,   label: 'Skincare' },
  { href: '/profile',   icon: User,       label: 'Profile'  },
];

const HIDDEN_PATHS = ['/login', '/signup', '/onboarding'];

export default function Navigation() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <>
      {/* ── Top bar (logo + nav on desktop, logo-only on mobile) ── */}
      <nav className="bg-primary border-b-2 border-darkgray">
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
              {navItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex flex-col items-center justify-center w-16 h-14 md:w-20 md:h-18 border-2 transition-all ${
                      isActive
                        ? 'bg-secondary border-darkgray shadow-pixel'
                        : 'bg-white border-darkgray hover:bg-lavender hover:shadow-pixel'
                    }`}
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

      {/* ── Bottom tab bar — mobile only ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-primary border-t-2 border-darkgray"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[52px] border-r-2 border-darkgray last:border-r-0 transition-all ${
                  isActive ? 'bg-secondary' : 'active:bg-lavender'
                }`}
              >
                <Icon size={18} />
                <span className="font-mono text-[9px] mt-0.5 leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
