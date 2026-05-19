'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBgTheme } from '@/lib/useTheme';
import { Home, Dumbbell, Utensils, Target, Droplet, Sparkles, User, Footprints } from 'lucide-react';

const navItems = [
  { href: '/',          icon: Home,       label: 'Home',     page: 'home',     color: '#F5BEDD' },
  { href: '/gym',       icon: Dumbbell,   label: 'Gym',      page: 'gym',      color: '#BDCFF5' },
  { href: '/steps',     icon: Footprints, label: 'Steps',    page: 'steps',    color: '#F5CFBD' },
  { href: '/food',      icon: Utensils,   label: 'Food',     page: 'food',     color: '#BDEFD4' },
  { href: '/progress',  icon: Target,     label: 'Progress', page: 'progress', color: '#F5E8BD' },
  { href: '/water',     icon: Droplet,    label: 'Water',    page: 'water',    color: '#BDE8F5' },
  { href: '/skincare',  icon: Sparkles,   label: 'Skincare', page: 'skincare', color: '#E4BDF5' },
  { href: '/profile',   icon: User,       label: 'Profile',  page: 'profile',  color: '#BDF5E4' },
];

const HIDDEN_PATHS = ['/login', '/signup', '/onboarding'];
const ALWAYS_SHOW = ['home', 'profile'];

export default function Navigation() {
  const pathname = usePathname();
  const [selectedTrackers, setSelectedTrackers] = useState<string[]>(['food', 'gym', 'progress']);
  useBgTheme();

  // Read selected trackers from localStorage
  useEffect(() => {
    const load = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.selected_trackers?.length) {
          setSelectedTrackers(parsed.selected_trackers);
        }
      }
    };
    load();
    window.addEventListener('trackersupdated', load);
    return () => window.removeEventListener('trackersupdated', load);
  }, [pathname]);

  // Set data-page attribute for per-page accent colours
  useEffect(() => {
    if (HIDDEN_PATHS.includes(pathname)) {
      document.documentElement.setAttribute('data-page', 'start');
      return;
    }
    const match = navItems.find(({ href }) =>
      href === '/' ? pathname === '/' : pathname.startsWith(href)
    );
    document.documentElement.setAttribute('data-page', match?.page ?? 'home');
  }, [pathname]);

  if (HIDDEN_PATHS.includes(pathname)) return null;

  // Filter nav items based on selected trackers; home + profile always show
  const filteredItems = navItems.filter(
    item => ALWAYS_SHOW.includes(item.page) || selectedTrackers.includes(item.page)
  );

  const trackerItems = filteredItems.filter(item => !ALWAYS_SHOW.includes(item.page));
  const homeItem = filteredItems.find(i => i.page === 'home')!;
  const profileItem = filteredItems.find(i => i.page === 'profile')!;

  const navLinkClass = (active: boolean) =>
    `flex flex-col items-center justify-center w-16 h-14 md:w-20 md:h-18 border-2 border-darkgray transition-all ${
      active ? 'shadow-pixel' : 'opacity-90 hover:opacity-100 hover:shadow-pixel'
    }`;

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

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
            <div className="hidden md:flex gap-1 md:gap-2 items-center">
              <Link
                href={homeItem.href}
                className={navLinkClass(isActive(homeItem.href))}
                style={{ backgroundColor: homeItem.color }}
              >
                <homeItem.icon size={20} className="mb-1" />
                <span className="text-pixel-xs">{homeItem.label}</span>
              </Link>

              {trackerItems.map(({ href, icon: Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={navLinkClass(isActive(href))}
                  style={{ backgroundColor: color }}
                >
                  <Icon size={20} className="mb-1" />
                  <span className="text-pixel-xs">{label}</span>
                </Link>
              ))}

              <Link
                href={profileItem.href}
                className={navLinkClass(isActive(profileItem.href))}
                style={{ backgroundColor: profileItem.color }}
              >
                <profileItem.icon size={20} className="mb-1" />
                <span className="text-pixel-xs">{profileItem.label}</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Floating pill bottom nav — mobile only ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex justify-center"
        style={{ padding: '0 12px max(env(safe-area-inset-bottom), 12px) 12px' }}
      >
        <nav
          className="w-full max-w-sm bg-primary border-2 border-darkgray overflow-hidden"
          style={{ borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
        >
          <div className="flex relative">
            <Link
              href={homeItem.href}
              className="flex-1 flex flex-col items-center justify-center py-2 min-h-13 transition-all"
              style={{ backgroundColor: homeItem.color }}
            >
              <homeItem.icon size={16} />
              <span className="font-mono text-[8px] mt-0.5 leading-none">{homeItem.label}</span>
            </Link>

            {trackerItems.map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center py-2 min-h-13 transition-all"
                style={{ backgroundColor: color }}
              >
                <Icon size={16} />
                <span className="font-mono text-[8px] mt-0.5 leading-none">{label}</span>
              </Link>
            ))}

            <Link
              href={profileItem.href}
              className="flex-1 flex flex-col items-center justify-center py-2 min-h-13 transition-all"
              style={{ backgroundColor: profileItem.color }}
            >
              <profileItem.icon size={16} />
              <span className="font-mono text-[8px] mt-0.5 leading-none">{profileItem.label}</span>
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
