// components/AuthGuard.tsx

'use client'

import { useEffect, ReactNode, useState } from 'react';
// 🔑 FIX: Import useRouter for client-side navigation in Next.js
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../Chat/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

const AuthGuard = ({ children, redirectTo = '/login' }: AuthGuardProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth(); // Assuming useAuth provides an isLoading state
  const router = useRouter(); // Initialize router
  const pathname = usePathname(); // Get the current path

  // 1. Component Did Mount
  useEffect(() => {
    // This ensures client-side logic runs after initial render
    setIsMounted(true);
  }, []);

  // 2. Auth/Redirection Logic
  useEffect(() => {
    // We only perform the check once the component has mounted and auth status is known.
    if (!isMounted) {
      return;
    }

    const isLoginPage = pathname === redirectTo;

    // If unauthenticated AND NOT already on the login page, redirect.
    if (!user && !isLoginPage) {
      // 🔑 FIX: Use Next.js router for redirection
      router.replace(redirectTo);
      // OPTIONAL: You might return null here to prevent flashing content
      // while the redirect is processing, but letting the children render
      // in the final return block is also common practice.
    }

  }, [user, isMounted, redirectTo, pathname, router]);

  // --- Render Control ---

  // 1. Initial Load/Verification State: Show placeholder while mounting or authentication state is loading
  // Check if we are mounted OR if the authentication state is still loading.
  if (!isMounted) {
    // 🔑 FIX: Use pathname instead of window.location.pathname
    // If on the login page, render the content immediately to avoid an unnecessary loading screen
    if (pathname === redirectTo) {
      return <>{children}</>;
    }

    return (
      <div className='p-[50px] text-center'>
        <h1>Verifying Access...</h1>
        <p>Loading user session...</p>
      </div>
    );
  }

  // 2. Authenticated: Render children
  if (user) {
    return <>{children}</>;
  }

  // 3. Unauthenticated: If a redirect happened, this component is unmounting.
  // If no redirect happened (because we're on the login page), render children (the login form).
  return <>{children}</>;
};

export default AuthGuard;