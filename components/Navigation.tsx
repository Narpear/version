'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, Utensils, Target, Droplet, Sparkles, User, Footprints, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/gym', icon: Dumbbell, label: 'Gym' },
    { href: '/steps', icon: Footprints, label: 'Steps' },
    { href: '/food', icon: Utensils, label: 'Food' },
    { href: '/progress', icon: Target, label: 'Progress' },
    { href: '/water', icon: Droplet, label: 'Water' },
    { href: '/skincare', icon: Sparkles, label: 'Skincare' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  if (pathname === '/login') return null;

  const activeItem = navItems.find(item => item.href === pathname);
  const ActiveIcon = activeItem?.icon || Menu;

  return (
    <nav className="bg-primary border-b-2 border-darkgray">
      <div className="container-pixel">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="text-darkgray">
            <div className="flex flex-col leading-none">
              <span className="font-pixel text-xl md:text-2xl">VERSION</span>
              <span className="font-mono text-sm text-darkgray/80 hidden md:block">The best version of you</span>
            </div>
          </Link>

          {/* Dropdown trigger */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-darkgray bg-white hover:bg-lavender shadow-pixel transition-all"
            >
              <ActiveIcon size={18} />
              <span className="font-mono text-sm font-bold">
                {activeItem?.label || 'Menu'}
              </span>
              <span className={`transition-transform duration-200 inline-block ${open ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>

            {open && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border-2 border-darkgray shadow-pixel w-52">
                {/* little pixel arrow */}
                <div className="absolute -top-[6px] right-5 w-3 h-3 bg-white border-l-2 border-t-2 border-darkgray rotate-45" />

                <div className="p-2 space-y-0.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 border-2 transition-all font-mono text-sm ${
                          isActive
                            ? 'bg-secondary border-darkgray font-bold'
                            : 'border-transparent hover:border-darkgray hover:bg-lavender'
                        }`}
                      >
                        <Icon size={16} className="flex-shrink-0" />
                        {item.label}
                        {isActive && <span className="ml-auto text-xs">◀</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}