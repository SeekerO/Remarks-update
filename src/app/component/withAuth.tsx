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
        // Save current path before redirecting to login
        sessionStorage.setItem('redirectAfterLogin', pathname);
        router.replace('/login');
      }
      return;
    }

    // User IS authenticated
    if (user) {
      if (isLoginPage) {
        // Just logged in - check if there's a saved path
        const savedPath = sessionStorage.getItem('redirectAfterLogin');

        if (savedPath && savedPath !== '/login') {
          // User was trying to access a specific page - redirect there
          sessionStorage.removeItem('redirectAfterLogin');
          router.replace(savedPath);
        } else {
          // First time login or no saved path - go to dashboard
          sessionStorage.removeItem('redirectAfterLogin');
          router.replace('/dashboard');
        }
      }
      // If authenticated and not on login page, stay on current page (do nothing)
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