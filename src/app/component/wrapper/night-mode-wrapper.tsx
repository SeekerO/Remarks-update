// components/Wrapper.tsx
"use client"
import React from 'react';
import DarkModeToggle from '@/lib/components/dark-button';

interface WrapperProps {
    children: React.ReactNode;
}



const ThemeWrapper: React.FC<WrapperProps> = ({ children }) => {

    return (
        <>
            <div className="fixed right-4 top-4">
                <DarkModeToggle />
            </div>

            {children}
            <div className='fixed left-1 bottom-1 text-[10px] italic font-thin text-slate-500'>
                <span>Version 1.5.0</span>
            </div>

        </>
    );
};

export default ThemeWrapper;
