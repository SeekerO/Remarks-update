"use client"
import React from 'react';
import DarkModeToggle from '@/lib/components/dark-button';
import Sidebar from '../sidebar';
import { useAuth } from '@/app/Chat/AuthContext';
// 1. Import usePathname for safe and correct path access in Next.js
import { usePathname } from 'next/navigation';

interface WrapperProps {
    children: React.ReactNode;
}

const ThemeWrapper: React.FC<WrapperProps> = ({ children }) => {
    const pathname = usePathname();
    const { user } = useAuth();

    const userAuthenticated = user && user.canChat !== false;
    const sidebarVisible = pathname !== "/"
    const showSidebar = sidebarVisible && userAuthenticated;

    return (
        <>
            <main className='flex'>
                {/* 4. Use the new showSidebar variable */}
                {showSidebar && <Sidebar />}
                {children}
            </main>
            <div className="fixed right-4 top-4">
                <DarkModeToggle />
            </div>
        </>
    );
};

export default ThemeWrapper;