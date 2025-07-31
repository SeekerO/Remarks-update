// components/Wrapper.tsx
"use client"
import React from 'react';

interface SideMenu {
    children: React.ReactNode;
}

const SideMenu: React.FC<SideMenu> = ({ children }) => {

    return (
        <div>
            {children}
        </div>
    );
};

export default SideMenu;



