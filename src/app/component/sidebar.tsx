"use client";
import React, { useRef, useState, useEffect } from "react";
import kkk from "../../lib/image/KKK.png";
import Image from "next/image";
import Link from "next/link";
import DarkModeToggle from "@/lib/components/dark-button";
import { useAuth } from "../Chat/AuthContext";
import { usePathname } from 'next/navigation';
import { ChevronDown } from "lucide-react";
import { CiLogout } from "react-icons/ci";
import { IoIosSettings } from "react-icons/io";
import { BsLayoutSidebar } from "react-icons/bs";
import { LuArrowLeftToLine } from "react-icons/lu";
import { navItems, NavItem, UserRole } from "@/lib/types/adminTypes"

// --- Tailwind Class Definitions ---
const linkBaseClasses = "flex items-center p-3 rounded-lg text-sm transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden";
const activeClasses = "bg-sky-900 text-white font-semibold shadow-md hover:bg-sky-500";
const inactiveMainClasses = "text-gray-700 font-medium hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white";
const inactiveSublinkClasses = "text-gray-500 font-light hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white";
const disabledClasses = "opacity-50 cursor-not-allowed pointer-events-none";
const sidebarRootClasses = " shrink-0 shadow-2xl transition-all duration-300 ease-in-out mr-1" +
    "bg-white text-gray-900 dark:bg-gray-900 dark:text-white";
const logoBorderClasses = "border-b border-gray-200/50 dark:border-gray-700/50";
const footerBorderClasses = "border-t border-gray-200/50 dark:border-gray-700/50";

// --- Sidebar Component ---
const Sidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const pathname = usePathname();
    const [isSettings, setIsSettings] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { logout, user } = useAuth();

    const userRole: UserRole = user?.isAdmin ? 'admin' : 'standard';

    let allowedPages: string[] | null;
    if (userRole === 'admin') {
        allowedPages = null;
    } else {
        if (user?.allowedPages === undefined || user?.allowedPages === null) {
            allowedPages = [];
        } else {
            allowedPages = user.allowedPages;
        }
    }

    const [openDropdowns, setOpenDropdowns] = useState<string | null>(null);

    const hasAccess = (item: NavItem): boolean => {
        const required = item.requiredRole || 'standard';
        if (userRole !== 'admin' && required === 'admin') return false;
        if (allowedPages === null) return true;
        if (item.pagePermissionId === undefined) return false;
        if (item.pagePermissionId) return allowedPages.includes(item.pagePermissionId);
        return true;
    };

    const toggleDropdown = (name: string) => {
        setOpenDropdowns(prev => prev === name ? null : name);
    };

    const isActive = (href: string) => pathname === href;

    const isParentActive = (item: NavItem) => {
        if (!item.active) return false;
        return item.sublinks
            .filter(sub => hasAccess(sub))
            .some(sub => pathname.startsWith(sub.href));
    };

    // Outside click handler for settings modal
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent): void => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettings(false);
            }
        };
        if (isSettings) document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isSettings]);

    // Outside click handler for user menu popup
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent): void => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isUserMenuOpen]);

    const sidebarWidthClass = isCollapsed ? 'w-[80px]' : 'w-[250px]';
    const sublinkIndentClass = isCollapsed ? 'justify-center' : 'pl-8 space-x-3';
    const mainLinkSpaceClass = isCollapsed ? 'justify-center' : 'space-x-3';
    const footerPaddingClass = isCollapsed ? 'justify-center py-3' : 'px-4 py-3';

    // Get user initials as fallback
    const initials = user?.displayName
        ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <>
            <div className={`${sidebarWidthClass} ${sidebarRootClasses} ${!isCollapsed ? "overflow-y-auto" : "overflow-hidden"} z-50 sticky lg:mr-1 justify-between flex flex-col`}>

                <div className="fixed pointer-events-none z-0 rounded-full w-[500px] h-[500px]"
                    style={{ top: '-200px', right: '-120px', background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)' }} />
                <div className="fixed pointer-events-none z-0 rounded-full w-[400px] h-[400px]"
                    style={{ bottom: '-150px', left: '-80px', background: 'radial-gradient(circle, rgba(20,184,166,0.09) 0%, transparent 70%)' }} />

                {/* Logo Section */}
                <div className={`w-full flex items-center py-3 relative ${logoBorderClasses} ${isCollapsed ? 'justify-center' : 'justify-start px-5'}`}>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        className="h-[40px] w-[40px] flex items-center justify-center group rounded-md duration-300 hover:bg-slate-800"
                    >
                        <BsLayoutSidebar className={`h-6 w-6 text-sky-500 ${!isCollapsed && "group-hover:hidden"}`} />
                        <LuArrowLeftToLine className={`h-6 w-6 text-sky-500 hidden ${!isCollapsed && "group-hover:flex"}`} />
                    </button>
                    {!isCollapsed && (
                        <Image src={kkk} alt="Application Logo" width={120} height={40} className="object-contain" priority />
                    )}
                </div>

                {/* Navigation Links Section */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const canAccessItem = hasAccess(item);
                        const hasAccessibleSublinks = item.sublinks.some(sub => hasAccess(sub));

                        if (!canAccessItem && !hasAccessibleSublinks) return null;

                        const isPureDropdown = !item.active && item.sublinks.length > 0;
                        const isOpen = isPureDropdown ? openDropdowns === item.name : isParentActive(item);
                        const isLinkActive = isPureDropdown ? false : (isActive(item.href) || isParentActive(item));
                        const shouldDisable = isPureDropdown ? !hasAccessibleSublinks : !canAccessItem;

                        const commonClasses = `${linkBaseClasses} ${mainLinkSpaceClass} ${isLinkActive ? activeClasses : inactiveMainClasses} ${shouldDisable ? disabledClasses : 'cursor-pointer'}`;

                        return (
                            <React.Fragment key={item.name}>
                                {isPureDropdown ? (
                                    <button
                                        onClick={() => !shouldDisable && toggleDropdown(item.name)}
                                        disabled={shouldDisable}
                                        className={`${commonClasses} w-full text-left`}
                                        title={shouldDisable ? "No access to any pages in this category" : `Toggle ${item.name} Sublinks`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center space-x-3">
                                                <item.icon className={`h-5 w-5 shrink-0 opacity-75 ${shouldDisable ? 'text-gray-400' : ''}`} />
                                                {!isCollapsed && <span className="flex-1">{item.name}</span>}
                                            </div>
                                            {!isCollapsed && item.sublinks.length > 0 && (
                                                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                                            )}
                                        </div>
                                    </button>
                                ) : (
                                    <Link
                                        href={canAccessItem ? item.href : '#'}
                                        className={commonClasses}
                                        onClick={(e) => {
                                            if (!canAccessItem) {
                                                e.preventDefault();
                                                if (item.requiredRole === 'admin') {
                                                    alert(`You need the Admin role to access ${item.name}.`);
                                                } else {
                                                    alert(`You don't have permission to access ${item.name}. Contact an administrator.`);
                                                }
                                            }
                                        }}
                                    >
                                        <item.icon className={`h-5 w-5 shrink-0 opacity-75 ${!canAccessItem ? 'text-gray-400' : ''}`} />
                                        {!isCollapsed && <span>{item.name}</span>}
                                        {!isCollapsed && item.sublinks.length > 0 && (
                                            <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                                        )}
                                    </Link>
                                )}

                                {item.sublinks.length > 0 && isOpen && (
                                    <div className="space-y-1 mt-1 pb-2">
                                        {item.sublinks.map((sublink) => {
                                            const canAccessSublink = hasAccess(sublink);
                                            if (!canAccessSublink) return null;

                                            const sublinkFinalClasses = `${linkBaseClasses} ${sublinkIndentClass} ${isActive(sublink.href) ? activeClasses : inactiveSublinkClasses} cursor-pointer`;

                                            return (
                                                <Link key={sublink.name} href={sublink.href} className={sublinkFinalClasses}>
                                                    <sublink.icon className="h-4 w-4 shrink-0 opacity-60" />
                                                    {!isCollapsed && <span>{sublink.name}</span>}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </nav>

                {/* ── FOOTER: User Avatar Chip with Popup Menu ── */}
                <div className={`pt-2 ${footerBorderClasses}`}>
                    <div className={`relative flex ${footerPaddingClass} pb-4`} ref={userMenuRef}>

                        {/* Avatar button — always visible */}
                        <button
                            onClick={() => {
                                setIsCollapsed(false)
                                setIsUserMenuOpen(prev => !prev)
                            }
                            }
                            title={user?.displayName || "User menu"}
                            className="relative flex items-center gap-3 group focus:outline-none"
                        >
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                {user?.photoURL ? (
                                    <Image
                                        width={36}
                                        height={36}
                                        src={user.photoURL}
                                        alt={`${user?.displayName}'s profile`}
                                        className="w-9 h-9 rounded-full object-cover border-2 border-gray-700 group-hover:border-sky-500 transition-colors duration-200"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-sky-700 border-2 border-gray-700 group-hover:border-sky-500 flex items-center justify-center text-white text-xs font-bold transition-colors duration-200">
                                        {initials}
                                    </div>
                                )}
                                {/* Online indicator dot */}
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-gray-900 rounded-full" />
                            </div>

                            {/* Name + email — only when expanded */}
                            {!isCollapsed && (
                                <div className="text-start leading-tight min-w-0 flex-1">
                                    <p className="font-semibold text-gray-200 text-sm truncate max-w-[130px]">
                                        {user?.displayName}
                                    </p>
                                    <p className="text-gray-500 text-[0.68rem] truncate max-w-[130px]">
                                        {user?.email}
                                    </p>
                                </div>
                            )}

                            {/* Chevron hint when expanded */}
                            {!isCollapsed && (
                                <ChevronDown
                                    className={`h-3.5 w-3.5 text-gray-500 shrink-0 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : 'rotate-0'}`}
                                />
                            )}
                        </button>

                        {/* ── Popup Menu ── */}
                        {isUserMenuOpen && (
                            <div
                                className={`
                                    absolute bottom-full mb-2 z-50
                                    ${isCollapsed ? 'left-full ml-2' : 'left-[1.9rem]'}
                                    w-48 rounded-xl overflow-hidden mb-2
                                    bg-gray-800 border border-gray-700/60
                                    shadow-2xl shadow-black/40
                                    animate-in fade-in slide-in-from-bottom-2 duration-150
                                `}
                            >
                                {/* User identity header inside popup */}
                                <div className="px-4 py-3 border-b border-gray-700/50">
                                    <p className="text-xs font-semibold text-gray-200 truncate">
                                        {user?.displayName}
                                    </p>
                                    <p className="text-[0.65rem] text-gray-500 truncate">{user?.email}</p>
                                </div>

                                {/* Settings */}
                                <button
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        setIsSettings(true);
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 group"
                                >
                                    <IoIosSettings
                                        size={17}
                                        className="text-gray-400 group-hover:text-sky-400 transition-colors"
                                    />
                                    <span>Settings</span>
                                </button>

                                {/* Divider */}
                                <div className="border-t border-gray-700/50" />

                                {/* Logout */}
                                <button
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        logout();
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-150 group"
                                >
                                    <CiLogout
                                        size={17}
                                        className="text-gray-400 group-hover:text-red-400 transition-colors"
                                    />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Version tag — only when expanded */}
                    {!isCollapsed && (
                        <div className="px-4 pb-3 text-xs text-center text-gray-600">
                            App Version 4.1.0
                        </div>
                    )}
                </div>
            </div>

            {/* SETTINGS MODAL */}
            {isSettings && (
                <div className="fixed inset-0 w-screen h-screen justify-center items-center flex backdrop-blur-sm bg-black/30 z-[999]">
                    <div
                        ref={settingsRef}
                        className="w-[300px] h-[200px] bg-gray-300 dark:bg-gray-800 rounded-lg shadow-2xl p-6 flex flex-col items-center justify-center gap-6"
                    >
                        <h1 className="text-gray-900 dark:text-white font-bold text-xl tracking-wide">Theme</h1>
                        <DarkModeToggle />
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;