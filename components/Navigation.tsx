'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useBgTheme } from '@/lib/useTheme';
import { Home, Dumbbell, Utensils, Target, Droplet, Sparkles, User, Footprints, Moon, BookOpen, ChevronDown } from 'lucide-react';

const navItems = [
  { href: '/',          icon: Home,       label: 'Home',     page: 'home',     color: '#F5BEDD' },
  { href: '/gym',       icon: Dumbbell,   label: 'Gym',      page: 'gym',      color: '#BDCFF5' },
  { href: '/steps',     icon: Footprints, label: 'Steps',    page: 'steps',    color: '#F5CFBD' },
  { href: '/food',      icon: Utensils,   label: 'Food',     page: 'food',     color: '#BDEFD4' },
  { href: '/progress',  icon: Target,     label: 'Progress', page: 'progress', color: '#F5E8BD' },
  { href: '/water',     icon: Droplet,    label: 'Water',    page: 'water',    color: '#BDE8F5' },
  { href: '/sleep',     icon: Moon,       label: 'Sleep',    page: 'sleep',    color: '#CBBDF5' },
  { href: '/skincare',  icon: Sparkles,   label: 'Skincare', page: 'skincare', color: '#E4BDF5' },
  { href: '/books',     icon: BookOpen,   label: 'Books',    page: 'books',    color: '#F5D4BD' },
  { href: '/profile',   icon: User,       label: 'Profile',  page: 'profile',  color: '#BDF5E4' },
];

const HIDDEN_PATHS = ['/login', '/signup', '/onboarding'];
const ALWAYS_SHOW = ['home', 'profile'];
// Max tracker pills to show before overflow (excludes home + profile)
const MAX_VISIBLE_TRACKERS = 3;

export default function Navigation() {
  const pathname = usePathname();
  const [selectedTrackers, setSelectedTrackers] = useState<string[]>(['food', 'gym', 'progress']);
  const [moreOpen, setMoreOpen] = useState(false);
  useBgTheme(); // applies data-bg-theme on mount and keeps it in sync
  const moreRef = useRef<HTMLDivElement>(null);

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
    // Re-read when profile page saves new trackers (same tab)
    window.addEventListener('trackersupdated', load);
    return () => window.removeEventListener('trackersupdated', load);
  }, []);

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  if (HIDDEN_PATHS.includes(pathname)) return null;

  // Filter nav items based on selected trackers; home + profile always show
  const filteredItems = navItems.filter(
    item => ALWAYS_SHOW.includes(item.page) || selectedTrackers.includes(item.page)
  );

  const trackerItems = filteredItems.filter(item => !ALWAYS_SHOW.includes(item.page));
  const visibleTrackers = trackerItems.slice(0, MAX_VISIBLE_TRACKERS);
  const overflowTrackers = trackerItems.slice(MAX_VISIBLE_TRACKERS);
  const hasOverflow = overflowTrackers.length > 0;

  const homeItem = filteredItems.find(i => i.page === 'home')!;
  const profileItem = filteredItems.find(i => i.page === 'profile')!;

  const navLinkClass = (active: boolean) =>
    `flex flex-col items-center justify-center w-16 h-14 md:w-20 md:h-18 border-2 border-darkgray transition-all ${
      active ? 'shadow-pixel' : 'opacity-75 hover:opacity-100 hover:shadow-pixel'
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
              {/* Home */}
              <Link
                href={homeItem.href}
                className={navLinkClass(isActive(homeItem.href))}
                style={{ backgroundColor: homeItem.color }}
              >
                <homeItem.icon size={20} className="mb-1" />
                <span className="text-pixel-xs">{homeItem.label}</span>
              </Link>

              {/* Visible tracker pills */}
              {visibleTrackers.map(({ href, icon: Icon, label, color }) => (
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

              {/* More dropdown (desktop) */}
              {hasOverflow && (
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMoreOpen(o => !o); }}
                    className={`flex flex-col items-center justify-center w-16 h-14 md:w-20 md:h-18 border-2 border-darkgray transition-all bg-primary ${
                      moreOpen ? 'shadow-pixel' : 'opacity-60 hover:opacity-100 hover:shadow-pixel'
                    }`}
                  >
                    <ChevronDown size={20} className="mb-1" />
                    <span className="text-pixel-xs">More</span>
                  </button>
                  {moreOpen && (
                    <div className="absolute top-full right-0 z-50 mt-1 border-2 border-darkgray bg-primary min-w-[140px]">
                      {overflowTrackers.map(({ href, icon: Icon, label, color }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 border-b-2 border-darkgray last:border-b-0 transition-all ${
                            isActive(href) ? 'font-bold' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          <Icon size={16} />
                          <span className="font-mono text-sm">{label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile */}
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
            {/* Home */}
            <Link
              href={homeItem.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[52px] transition-all ${
                isActive(homeItem.href) ? '' : 'opacity-50'
              }`}
              style={{ backgroundColor: homeItem.color }}
            >
              <homeItem.icon size={16} />
              <span className="font-mono text-[8px] mt-0.5 leading-none">{homeItem.label}</span>
            </Link>

            {/* Visible trackers */}
            {visibleTrackers.map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[52px] transition-all ${
                  isActive(href) ? '' : 'opacity-70'
                }`}
                style={{ backgroundColor: color }}
              >
                <Icon size={16} />
                <span className="font-mono text-[8px] mt-0.5 leading-none">{label}</span>
              </Link>
            ))}

            {/* More button (mobile) */}
            {hasOverflow && (
              <div className="flex-1 relative" ref={hasOverflow ? undefined : moreRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMoreOpen(o => !o); }}
                  className={`w-full flex flex-col items-center justify-center py-2 min-h-[52px] bg-primary transition-all ${
                    moreOpen ? '' : 'opacity-50'
                  }`}
                >
                  <ChevronDown size={16} />
                  <span className="font-mono text-[8px] mt-0.5 leading-none">More</span>
                </button>
                {moreOpen && (
                  <div className="absolute bottom-full right-0 z-50 mb-1 border-2 border-darkgray bg-primary min-w-[140px]"
                    style={{ borderRadius: '12px', overflow: 'hidden' }}
                  >
                    {overflowTrackers.map(({ href, icon: Icon, label, color }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 border-b-2 border-darkgray last:border-b-0 transition-all ${
                          isActive(href) ? 'font-bold' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        <Icon size={16} />
                        <span className="font-mono text-sm">{label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
            <Link
              href={profileItem.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[52px] transition-all ${
                isActive(profileItem.href) ? '' : 'opacity-50'
              }`}
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
