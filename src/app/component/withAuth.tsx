'use client'

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../Chat/AuthContext';
import { navItems, type NavItem, type PageId } from '@/lib/types/adminTypes';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

type UserRole = 'admin' | 'standard';

const ALWAYS_ACCESSIBLE = ['/login', '/dashboard', '/', '/not-found'];
const PUBLIC_PAGES = ['/login', '/not-found'];

const AuthGuard = ({ children, redirectTo = '/login' }: AuthGuardProps) => {
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const getAccessibleHrefs = (allowedPages: PageId[] | null): string[] => {
    if (allowedPages === null) {
      const allHrefs: string[] = [];
      const extractHrefs = (items: NavItem[]) => {
        items.forEach(item => {
          if (item.href && item.href !== '') allHrefs.push(item.href);
          if (item.sublinks?.length) extractHrefs(item.sublinks);
        });
      };
      extractHrefs(navItems);
      return allHrefs;
    }
    if (!allowedPages?.length) return [];
    const allowedHrefs: string[] = [];
    const extractAllowedHrefs = (items: NavItem[]) => {
      items.forEach(item => {
        if (item.pagePermissionId && allowedPages.includes(item.pagePermissionId as PageId)) {
          if (item.href && item.href !== '') allowedHrefs.push(item.href);
        }
        if (item.sublinks?.length) extractAllowedHrefs(item.sublinks);
      });
    };
    extractAllowedHrefs(navItems);
    return allowedHrefs;
  };

  const hasAccessToPath = (currentPath: string, allowedHrefs: string[]): boolean => {
    if (ALWAYS_ACCESSIBLE.includes(currentPath)) return true;
    return allowedHrefs.some(href =>
      currentPath === href || currentPath.startsWith(href + '/')
    );
  };

  useEffect(() => {
    // Wait for auth to finish loading before doing anything
    if (isLoading) return;

    setAccessChecked(false);
    setAccessGranted(false);

    // Public pages — always render immediately
    if (PUBLIC_PAGES.includes(pathname)) {
      setAccessChecked(true);
      setAccessGranted(true);
      return;
    }

    // No user — redirect to login
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.replace('/login');
      setAccessChecked(true);
      setAccessGranted(false);
      return;
    }

    // User exists but has no canChat — show access denied for protected pages
    if (!user.canChat) {
      setAccessChecked(true);
      setAccessGranted(false);
      if (pathname !== '/') router.replace('/');
      return;
    }

    // Resolve allowed pages based on role
    const userRole: UserRole = user.isAdmin ? 'admin' : 'standard';
    const allowedPages: PageId[] | null = userRole === 'admin'
      ? null
      : (user.allowedPages as PageId[] ?? []);

    const accessibleHrefs = getAccessibleHrefs(allowedPages);

    // Handle login redirect after successful auth
    if (pathname === '/login') {
      const savedPath = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      const destination = savedPath && savedPath !== '/login' && hasAccessToPath(savedPath, accessibleHrefs)
        ? savedPath
        : accessibleHrefs[0] ?? '/dashboard';
      router.replace(destination);
      setAccessChecked(true);
      setAccessGranted(false);
      return;
    }

    // Check if user has access to current path
    if (!hasAccessToPath(pathname, accessibleHrefs)) {
      router.replace('/not-found');
      setAccessChecked(true);
      setAccessGranted(false);
      return;
    }

    // All checks passed — grant access
    setAccessChecked(true);
    setAccessGranted(true);

  }, [user, isLoading, pathname]);

  // ── Render Control ──────────────────────────────────────────────────────

  // Still loading auth state — show nothing (or a spinner)
  if (isLoading || !accessChecked) {
    return (
      <div className='p-[50px] text-center'>
        <h1>Verifying Access...</h1>
        <p>Please wait...</p>
      </div>
    );
  }

  // Access granted — render children
  if (accessGranted) {
    return <>{children}</>;
  }

  // User exists but no canChat permission
  if (user && !user.canChat) {
    return (
      <div className='p-[50px] text-center'>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this application.</p>
      </div>
    );
  }

  // Fallback — redirecting (no flash of content)
  return (
    <div className='p-[50px] text-center'>
      <h1>Redirecting...</h1>
      <p>Please wait...</p>
    </div>
  );
};

export default AuthGuard;