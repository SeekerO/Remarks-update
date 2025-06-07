// components/Wrapper.tsx
import React from 'react';
import DarkModeToggle from '@/lib/components/dark-button';

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
        </div>
    );
};

export default ThemeWrapper;
