"use client"

import { useLayoutEffect, useState } from 'react';
import { DarkModeSwitch } from 'react-toggle-dark-mode';
export default function DarkModeToggle() {
    const [isDark, setIsDark] = useState(false);

    useLayoutEffect(() => {
        const root = window.document.documentElement;
        const savedTheme = localStorage.getItem("theme-mode");

        if (savedTheme === "dark") {
            root.classList.add('dark');
            setIsDark(true);
        } else {
            root.classList.remove('dark');
            setIsDark(false);
        }
    }, []);

    const toggleTheme = () => {
        const root = window.document.documentElement;
        if (isDark) {
            root.classList.remove('dark');
            localStorage.setItem("theme-mode", "light");
        } else {
            root.classList.add('dark');
            localStorage.setItem("theme-mode", "dark");
        }
        setIsDark(!isDark);
    };

    return (
        <DarkModeSwitch
            style={{ marginBottom: '2rem' }}
            checked={isDark}
            onChange={toggleTheme}
            size={20}
        />
    );
}
