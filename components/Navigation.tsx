'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, Utensils, TrendingDown, Droplet, Sparkles, User } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/gym', icon: Dumbbell, label: 'Gym' },
    { href: '/food', icon: Utensils, label: 'Food' },
    { href: '/deficit', icon: TrendingDown, label: 'Deficit' },
    { href: '/water', icon: Droplet, label: 'Water' },
    { href: '/skincare', icon: Sparkles, label: 'Skincare' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  // Don't show navigation on login page
  if (pathname === '/login') return null;

  return (
    <nav className="bg-primary border-b-4 border-darkgray">
      <div className="container-pixel">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-pixel text-lg text-darkgray">
            VERSION
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
                  className={`flex flex-col items-center justify-center p-2 md:p-3 border-4 transition-all ${
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