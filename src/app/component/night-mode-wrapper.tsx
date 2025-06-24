// components/Wrapper.tsx
import React from 'react';
import DarkModeToggle from '@/lib/components/dark-button';
import ChatHead from './chathead';

interface WrapperProps {
    children: React.ReactNode;
}

const ThemeWrapper: React.FC<WrapperProps> = ({ children }) => {
    return (
        <div>
            <div className="fixed right-2 top-2">
                <DarkModeToggle />
            </div>
            {children}
            <div className='absolute bottom-5 right-5 z-50'>
                <ChatHead />
            </div>
        </div>
    );
};

export default ThemeWrapper;
