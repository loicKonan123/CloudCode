'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import AnimatedLogo from '@/components/AnimatedLogo';

const NAV_ITEMS = [
  { label: 'Challenges', path: '/challenges' },
  { label: 'Courses', path: '/courses' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'VS Mode', path: '/vs' },
  { label: 'Quiz', path: '/quiz' },
  { label: 'Pricing', path: '/pricing' },
];

interface NavbarProps {
  /** Extra element rendered next to the user info (e.g. SoundControl) */
  extra?: React.ReactNode;
}

export default function Navbar({ extra }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <>
      <header className="border-b border-slate-800 bg-[#101b22] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <AnimatedLogo size={28} />
                <span className="text-xl font-bold tracking-tight text-white">CloudCode</span>
              </button>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-8">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-[#3caff6] font-semibold'
                        : 'text-slate-400 hover:text-[#3caff6]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                {user?.isAdmin && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="text-slate-400 hover:text-[#3caff6] text-sm font-medium transition-colors"
                  >
                    Admin
                  </button>
                )}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {extra && <div className="hidden md:flex">{extra}</div>}

              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    title="My Profile"
                  >
                    <span className="text-sm text-slate-400">{user?.username}</span>
                    <div className="h-9 w-9 rounded-full bg-[#3caff6]/20 flex items-center justify-center border border-[#3caff6]/30 text-[#3caff6] font-bold text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  <button
                    onClick={() => { logout(); router.push('/login'); }}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    title="Sign out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={() => router.push('/login')}
                    className="text-slate-300 text-sm font-medium hover:text-[#3caff6] transition-colors"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="flex items-center justify-center rounded-lg h-9 px-4 bg-[#3caff6] text-[#101b22] text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#101b22] px-4 py-4 space-y-3 relative z-40">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => { router.push(item.path); setMobileMenuOpen(false); }}
              className={`block w-full text-left text-sm font-medium py-2 ${
                isActive(item.path) ? 'text-[#3caff6] font-semibold' : 'text-slate-400 hover:text-[#3caff6]'
              }`}
            >
              {item.label}
            </button>
          ))}
          {user?.isAdmin && (
            <button
              onClick={() => { router.push('/admin'); setMobileMenuOpen(false); }}
              className="block w-full text-left text-slate-400 hover:text-[#3caff6] text-sm font-medium py-2"
            >
              Admin
            </button>
          )}
          {extra && <div className="py-2">{extra}</div>}
          {isAuthenticated ? (
            <>
              <button
                onClick={() => { router.push('/profile'); setMobileMenuOpen(false); }}
                className="block w-full text-left text-slate-300 hover:text-white text-sm font-medium py-2"
              >
                {user?.username} — Profile
              </button>
              <button
                onClick={() => { logout(); router.push('/login'); setMobileMenuOpen(false); }}
                className="block w-full text-left text-red-400 hover:text-red-300 text-sm font-medium py-2"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { router.push('/login'); setMobileMenuOpen(false); }}
                className="block w-full text-left text-slate-400 hover:text-[#3caff6] text-sm font-medium py-2"
              >
                Sign in
              </button>
              <button
                onClick={() => { router.push('/register'); setMobileMenuOpen(false); }}
                className="block w-full text-left text-[#3caff6] font-bold text-sm py-2"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
