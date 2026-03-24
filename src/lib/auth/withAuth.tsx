'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';
import { navItems, type NavItem, type PageId } from '@/lib/types/adminTypes';
import { Loader2, ShieldOff } from 'lucide-react';

/* ─────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────── */
const PUBLIC_PAGES = ['/login', '/not-found'];
const ALWAYS_ALLOWED = ['/login', '/dashboard', '/', '/not-found'];

type UserRole = 'admin' | 'standard';

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */
function getAccessibleHrefs(allowedPages: PageId[] | null): string[] {
  const hrefs: string[] = [];

  const extract = (items: NavItem[]) => {
    items.forEach((item) => {
      if (allowedPages === null) {
        // Admin — all hrefs
        if (item.href) hrefs.push(item.href);
      } else if (item.pagePermissionId && allowedPages.includes(item.pagePermissionId as PageId)) {
        if (item.href) hrefs.push(item.href);
      }
      if (item.sublinks?.length) extract(item.sublinks);
    });
  };

  extract(navItems);
  return hrefs;
}

function hasAccessToPath(path: string, allowedHrefs: string[]): boolean {
  if (ALWAYS_ALLOWED.includes(path)) return true;
  return allowedHrefs.some(
    (href) => path === href || path.startsWith(href + '/')
  );
}

/* ─────────────────────────────────────────────
   FULL-SCREEN STATES
   ───────────────────────────────────────────── */
const FullScreenSpinner = ({ message }: { message: string }) => (
  <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      <p className="text-xs text-white/25 font-mono tracking-wide">{message}</p>
    </div>
  </div>
);

const AccessDenied = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)]">
    <div
      className="flex flex-col items-center gap-4 p-8 rounded-2xl max-w-sm w-full mx-4 text-center"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <ShieldOff className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/70">Access denied</p>
        <p className="text-xs text-white/30 mt-1.5 leading-relaxed">
          You don't have permission to view this page.
          Contact your administrator to request access.
        </p>
      </div>
      <a
        href="/dashboard"
        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        ← Back to dashboard
      </a>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   AUTH GUARD
   ───────────────────────────────────────────── */
interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

const AuthGuard = ({ children, redirectTo = '/login' }: AuthGuardProps) => {
  const [checked, setChecked] = useState(false);
  const [granted, setGranted] = useState(false);

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for Firebase auth to resolve
    if (isLoading) return;

    setChecked(false);
    setGranted(false);

    // ── Public pages — always render ──
    if (PUBLIC_PAGES.includes(pathname)) {
      setChecked(true);
      setGranted(true);
      return;
    }

    // ── No user — go to login ──
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.replace(redirectTo);
      setChecked(true);
      setGranted(false);
      return;
    }

    // ── User exists but no canChat — show access denied ──
    if (!user.canChat) {
      setChecked(true);
      setGranted(false);
      return;
    }

    // ── Resolve allowed hrefs ──
    const role: UserRole = user.isAdmin ? 'admin' : 'standard';
    const allowedPages: PageId[] | null =
      role === 'admin' ? null : (user.allowedPages as PageId[] ?? []);

    const accessibleHrefs = getAccessibleHrefs(allowedPages);

    // ── Handle post-login redirect ──
    if (pathname === '/login') {
      const saved = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      const dest =
        saved && saved !== '/login' && hasAccessToPath(saved, accessibleHrefs)
          ? saved
          : accessibleHrefs[0] ?? '/dashboard';
      router.replace(dest);
      setChecked(true);
      setGranted(false);
      return;
    }

    // ── Check current path ──
    if (!hasAccessToPath(pathname, accessibleHrefs)) {
      router.replace('/not-found');
      setChecked(true);
      setGranted(false);
      return;
    }

    // ── All good ──
    setChecked(true);
    setGranted(true);
  }, [user, isLoading, pathname, router, redirectTo]);

  // Still loading Firebase auth
  if (isLoading || !checked) {
    return <FullScreenSpinner message="Verifying access…" />;
  }

  // Authenticated but canChat denied
  if (checked && !granted && user && !user.canChat) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)]">
        <div
          className="flex flex-col items-center gap-4 p-8 rounded-2xl max-w-sm w-full mx-4 text-center"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ShieldOff className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">Pending approval</p>
            <p className="text-xs text-white/30 mt-1.5 leading-relaxed">
              Your account is registered but hasn't been approved yet.
              Contact your administrator to get access.
            </p>
          </div>
          <a
            href="/login"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            ← Sign in with a different account
          </a>
        </div>
      </div>
    );
  }

  // Redirecting (no content flash)
  if (checked && !granted) {
    return <FullScreenSpinner message="Redirecting…" />;
  }

  // Access granted — render page
  if (granted) {
    return <>{children}</>;
  }

  return null;
};

export default AuthGuard;