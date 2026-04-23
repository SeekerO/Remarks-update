"use client";
import React, { useLayoutEffect } from "react";
import Sidebar from "../sidebar";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePathname } from "next/navigation";
import MessageNotification from "../messageNotification";
interface WrapperProps {
  children: React.ReactNode;
}

const ThemeWrapper: React.FC<WrapperProps> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isPublicRoute = pathname === "/" || pathname === "/login";
  const isAuthenticated = user && user.isPermitted !== false;
  const showSidebar = !isPublicRoute && isAuthenticated;

  /* Apply saved theme before first paint to avoid flash */
  useLayoutEffect(() => {
    const root = window.document.documentElement;
    const saved = localStorage.getItem("theme-mode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    root.classList.toggle("dark", isDark);
  }, []);

  return (
    <main className="flex h-screen w-screen overflow-hidden font-sans bg-grid">
      {showSidebar && <Sidebar />}

      {/*
        Page content area:
        - flex-1 + min-w-0  → fills remaining width, never overflows the flex row
        - overflow-y-auto   → each page scrolls independently
        - pb-16 lg:pb-0     → clear the 60px bottom tab bar on mobile/tablet;
                              no padding needed on desktop (persistent sidebar)
      */}
      <MessageNotification />
      <div
        className={[
          "flex w-full overflow-y-auto",
          showSidebar ? "pb-16 lg:pb-0" : "",
        ].join(" ")}
      >
        {children}
      </div>
    </main>
  );
};

export default ThemeWrapper;
