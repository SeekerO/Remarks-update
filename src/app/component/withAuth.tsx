// components/AuthGuard.tsx

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

const AuthGuard = ({ children, redirectTo = '/login' }: AuthGuardProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Component Did Mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper function to get all accessible hrefs for a user
  const getAccessibleHrefs = (allowedPages: PageId[] | null): string[] => {
    if (allowedPages === null) {
      // Admin: return all hrefs
      const allHrefs: string[] = [];

      const extractHrefs = (items: NavItem[]) => {
        items.forEach(item => {
          if (item.href && item.href !== '') {
            allHrefs.push(item.href);
          }
          if (item.sublinks && item.sublinks.length > 0) {
            extractHrefs(item.sublinks);
          }
        });
      };

      extractHrefs(navItems);
      return allHrefs;
    }

    if (!allowedPages || allowedPages.length === 0) {
      // No pages allowed
      return [];
    }

    // Standard user: return only allowed hrefs
    const allowedHrefs: string[] = [];

    const extractAllowedHrefs = (items: NavItem[]) => {
      items.forEach(item => {
        if (item.pagePermissionId && allowedPages.includes(item.pagePermissionId as PageId)) {
          if (item.href && item.href !== '') {
            allowedHrefs.push(item.href);
          }
        }
        if (item.sublinks && item.sublinks.length > 0) {
          extractAllowedHrefs(item.sublinks);
        }
      });
    };

    extractAllowedHrefs(navItems);
    return allowedHrefs;
  };

  // Helper function to check if user has access to a specific path
  const hasAccessToPath = (currentPath: string, allowedHrefs: string[]): boolean => {
    // Special pages that are always accessible
    if (currentPath === '/login' || currentPath === '/dashboard' || currentPath === '/') {
      return true;
    }

    // Check if current path matches any allowed href
    return allowedHrefs.some(href => {
      // Exact match
      if (currentPath === href) return true;

      // Check if current path starts with href (for nested routes)
      if (currentPath.startsWith(href + '/')) return true;

      return false;
    });
  };

  // Auth/Redirection Logic - runs ONCE per pathname/user change
  useEffect(() => {
    if (!isMounted) {
      return;
    }

    // Prevent multiple checks
    if (accessChecked) {
      return;
    }

    const isLoginPage = pathname === '/login';
    const isUnauthorizedPage = pathname === '/';
    const isDashboardPage = pathname === '/dashboard';

    // User is NOT authenticated
    if (!user) {
      if (!isLoginPage) {
        sessionStorage.setItem('redirectAfterLogin', pathname);
        setAccessChecked(true);
        router.replace('/login');
      } else {
        setAccessChecked(true);
      }
      return;
    }

    // User IS authenticated - Check canChat first
    if (!user.canChat) {
      // User doesn't have chat/access permission at all
      if (!isUnauthorizedPage) {
        setAccessChecked(true);
        router.replace('/');
      } else {
        setAccessChecked(true);
      }
      return;
    }

    // User has canChat - Now check page permissions
    const userRole: UserRole = user?.isAdmin ? 'admin' : 'standard';

    let allowedPages: PageId[] | null;

    if (userRole === 'admin') {
      // Admin gets access to ALL pages
      allowedPages = null;
    } else {
      // Standard User Logic
      if (user?.allowedPages === undefined || user?.allowedPages === null) {
        // No pages configured - no access
        allowedPages = [];
      } else {
        // Use the explicit list from the user object
        allowedPages = user.allowedPages as PageId[];
      }
    }

    const accessibleHrefs = getAccessibleHrefs(allowedPages);

    // Handle login page redirect
    if (isLoginPage) {
      const savedPath = sessionStorage.getItem('redirectAfterLogin');

      if (savedPath && savedPath !== '/login') {
        if (hasAccessToPath(savedPath, accessibleHrefs)) {
          sessionStorage.removeItem('redirectAfterLogin');
          setAccessChecked(true);
          router.replace(savedPath);
        } else {
          sessionStorage.removeItem('redirectAfterLogin');
          const firstAllowedPage = accessibleHrefs.length > 0 ? accessibleHrefs[0] : '/';
          setAccessChecked(true);
          router.replace(firstAllowedPage);
        }
      } else {
        sessionStorage.removeItem('redirectAfterLogin');
        const firstAllowedPage = accessibleHrefs.length > 0 ? accessibleHrefs[0] : '/dashboard';
        setAccessChecked(true);
        router.replace(firstAllowedPage);
      }
      return;
    }

    // Check access to current page
    if (!isDashboardPage && !isUnauthorizedPage && !hasAccessToPath(pathname, accessibleHrefs)) {
      const firstAllowedPage = accessibleHrefs.length > 0 ? accessibleHrefs[0] : '/';
      setAccessChecked(true);
      router.replace(firstAllowedPage);
      return;
    }

    // User has access to current page
    setAccessChecked(true);

  }, [user, isMounted, pathname, router, accessChecked]);

  // Reset access check when pathname or user ID changes
  useEffect(() => {
    setAccessChecked(false);
  }, [pathname, user?.uid]);

  // --- Render Control ---

  if (!isMounted || !accessChecked) {
    // Render login page immediately
    if (pathname === '/login') {
      return <>{children}</>;
    }

    return (
      <div className='p-[50px] text-center'>
        <h1>Verifying Access...</h1>
        <p>Please wait...</p>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    if (pathname === '/login') {
      return <>{children}</>;
    }
    return (
      <div className='p-[50px] text-center'>
        <h1>Redirecting to login...</h1>
      </div>
    );
  }

  // User doesn't have canChat permission
  if (!user.canChat) {
    if (pathname === '/') {
      return <>{children}</>;
    }
    return (
      <div className='p-[50px] text-center'>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this application.</p>
      </div>
    );
  }

  // Check if user has access to current page
  const userRole: UserRole = user?.isAdmin ? 'admin' : 'standard';
  let allowedPages: PageId[] | null;

  if (userRole === 'admin') {
    allowedPages = null;
  } else {
    if (user?.allowedPages === undefined || user?.allowedPages === null) {
      allowedPages = [];
    } else {
      allowedPages = user.allowedPages as PageId[];
    }
  }

  const accessibleHrefs = getAccessibleHrefs(allowedPages);
  const isDashboardPage = pathname === '/dashboard';
  const isUnauthorizedPage = pathname === '/';
  const isLoginPage = pathname === '/login';

  // Block rendering if user doesn't have access to current page
  if (!isDashboardPage && !isUnauthorizedPage && !isLoginPage && !hasAccessToPath(pathname, accessibleHrefs)) {
    return (
      <div className='p-[50px] text-center'>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <p className='mt-4 text-sm text-gray-600'>Redirecting...</p>
      </div>
    );
  }

  // Render children after access check is complete
  return <>{children}</>;
};

export default AuthGuard;