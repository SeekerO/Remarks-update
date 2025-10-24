"use client"
import React, { useLayoutEffect } from 'react'
import Sidebar from '../sidebar';
import { useAuth } from '@/app/Chat/AuthContext';
import { usePathname } from 'next/navigation';
import PopupChat from '@/app/Chat/PopupChat';
interface WrapperProps {
    children: React.ReactNode;
}

const ThemeWrapper: React.FC<WrapperProps> = ({ children }) => {
    const pathname = usePathname();
    const { user } = useAuth();

    const userAuthenticated = user && user.canChat !== false;
    const sidebarVisible = !(pathname === "/" || pathname === "/login");
    const showSidebar = sidebarVisible && userAuthenticated;

    useLayoutEffect(() => {
        const root = window.document.documentElement;
        const savedTheme = localStorage.getItem("theme-mode");

        const isDarkInitial = savedTheme === "dark" ||
            (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDarkInitial) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, []);

    return (
        <>
            <main className='flex h-screen w-screen overflow-y-auto'>
                {/* 4. Use the new showSidebar variable */}
                {showSidebar && <>
                    <Sidebar />
                    <div className='absolute bottom-5 right-5 z-50'>
                        <PopupChat />
                    </div>
                </>}
                {children}
            </main>
        </>
    );
};

export default ThemeWrapper;