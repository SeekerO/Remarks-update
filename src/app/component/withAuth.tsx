// components/AuthGuard.tsx

'use client'

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../Chat/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

const AuthGuard = ({ children, redirectTo = '/login' }: AuthGuardProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Component Did Mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auth/Redirection Logic
  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const isLoginPage = pathname === '/login';

    // User is NOT authenticated
    if (!user) {
      if (!isLoginPage) {
        // Redirect to login page
        router.replace('/login');
      }
      return;
    }

    // User IS authenticated
    if (user) {
      // Check if this is the first login (no saved path)
      const savedPath = sessionStorage.getItem('redirectAfterLogin');

      if (isLoginPage) {
        // Just logged in
        if (savedPath && savedPath !== '/login') {
          // Redirect to the page they were trying to access
          sessionStorage.removeItem('redirectAfterLogin');
          router.replace(savedPath);
        } else {
          // First time login - go to dashboard
          router.replace('/dashboard');
        }
      }
      // If not on login page and authenticated, stay on current page (do nothing)
    }
  }, [user, isMounted, pathname, router]);

  // --- Render Control ---

  if (!isMounted) {
    // Render login page immediately without loading screen
    if (pathname === '/login') {
      return <>{children}</>;
    }

    return (
      <div className='p-[50px] text-center'>
        <h1>Verifying Access...</h1>
        <p>Loading user session...</p>
      </div>
    );
  }

  // If authenticated, always render children (stay on current page)
  if (user) {
    return <>{children}</>;
  }

  // If not authenticated and not on login page, show loading
  // (will redirect to login)
  if (!user && pathname !== '/login') {
    return (
      <div className='p-[50px] text-center'>
        <h1>Redirecting...</h1>
      </div>
    );
  }

  // Not authenticated but on login page - render it
  return <>{children}</>;
};

export default AuthGuard;