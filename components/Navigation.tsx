'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, Utensils, Target, Droplet, Sparkles, User, Footprints } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

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

  // Don't show navigation on login page
  if (pathname === '/login') return null;

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

          {/* Nav Links */}
          <div className="flex gap-1 md:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-16 h-14 md:w-20 md:h-18 border-2 transition-all ${
                    isActive
                      ? 'bg-secondary border-darkgray shadow-pixel'
                      : 'bg-white border-darkgray hover:bg-lavender hover:shadow-pixel'
                  }`}
                >
                  <Icon size={20} className="mb-1" />
                  <span className="text-pixel-xs hidden md:block">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}