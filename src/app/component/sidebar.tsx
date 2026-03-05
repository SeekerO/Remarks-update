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

// --- Tailwind Class Definitions (omitted for brevity) ---
const linkBaseClasses = "flex items-center p-3 rounded-lg text-sm transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden";
const activeClasses = "bg-sky-900 text-white font-semibold shadow-md hover:bg-sky-500";
const inactiveMainClasses = "text-gray-700 font-medium hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white";
const inactiveSublinkClasses = "text-gray-500 font-light hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white";
const disabledClasses = "opacity-50 cursor-not-allowed pointer-events-none";
const sidebarRootClasses = "h-screen shrink-0 shadow-2xl transition-all duration-300 ease-in-out mr-1 " +
    "bg-white text-gray-900 dark:bg-gray-900 dark:text-white";
const logoBorderClasses = "border-b border-gray-200/50 dark:border-gray-700/50";
const footerBorderClasses = "border-t border-gray-200/50 dark:border-gray-700/50";

// --- Navigation Data Structure ---




// --- Sidebar Component ---

const Sidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const pathname = usePathname();
    const [isSettings, setIsSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const { logout, user } = useAuth();

    // Determine the user's role
    const userRole: UserRole = user?.isAdmin ? 'admin' : 'standard';


    // 1. Determine the effective allowedPages list based on the user's role and the 'allowedPages' variable.
    let allowedPages: string[] | null;

    if (userRole === 'admin') {
        // Rule 2: Admin, regardless of `allowedPages` (present or null), gets ALL pages.
        // We use `null` to signal "show all" to the `hasAccess` function for admins.
        allowedPages = null;
    } else {
        // Standard User Logic
        if (user?.allowedPages === undefined || user?.allowedPages === null) {
            // Rule 1: Not Admin AND allowedPages is NOT set (undefined/null).
            // An empty array signals "show nothing" to the `hasAccess` function.
            allowedPages = [];
        } else {
            // Rule 3: Not Admin AND allowedPages IS set (it's an array, possibly empty).
            // Use the explicit list from the user object.
            allowedPages = user.allowedPages;
        }
    }

    // --- MODIFIED LOGIC END ---

    // State to track open dropdowns
    const [openDropdowns, setOpenDropdowns] = useState<string | null>(null);

    // Check if user has access based on role AND page permissions
    const hasAccess = (item: NavItem): boolean => {

        // 1. Check role requirement (Admin pages)
        const required = item.requiredRole || 'standard';
        if (userRole !== 'admin' && required === 'admin') {
            return false;
        }

        // 2. Admins bypass all page permission checks (since `allowedPages` is null for admins)
        if (allowedPages === null) {
            return true;
        }


        // 3. Items without pagePermissionId are admin-only (already handled by step 1, but for safety/clarity)
        if (item.pagePermissionId === undefined) {
            return false;
        }

        // 4. For standard users, check page permissions against the determined `allowedPages` array.
        // This handles:
        // - Rule 1 (allowedPages is [] -> returns false for all)
        // - Rule 3 (allowedPages is ['x', 'y'] -> returns true only for 'x' and 'y')
        if (item.pagePermissionId) {
            // Type check is implicitly handled because allowedPages is guaranteed to be `string[]` here
            return allowedPages.includes(item.pagePermissionId);
        }

        // This case should not be hit for links meant to be restricted, but serves as a default for parent-only items.
        return true;
    };

    // ... rest of the component logic remains the same
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
            if (
                settingsRef.current &&
                !settingsRef.current.contains(event.target as Node)
            ) {
                setIsSettings(false);
            }
        };

        if (isSettings) {
            document.addEventListener("mousedown", handleOutsideClick);
        }

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isSettings]);

    // Sidebar sizing/layout logic
    const sidebarWidthClass = isCollapsed ? 'w-[80px]' : 'w-[250px]';
    const sublinkIndentClass = isCollapsed ? 'justify-center' : 'pl-8 space-x-3';
    const mainLinkSpaceClass = isCollapsed ? 'justify-center' : 'space-x-3';
    const footerPaddingClass = isCollapsed ? 'justify-center py-2' : 'pl-6 py-3';

    return (
        <>
            <div className={`${sidebarWidthClass} ${sidebarRootClasses} ${!isCollapsed ? "overflow-y-auto" : "overflow-hidden"} justify-between flex flex-col h-full`}>

                <div className="fixed pointer-events-none z-0 rounded-full w-[500px] h-[500px]"
                    style={{ top: '-200px', right: '-120px', background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)' }} />
                <div className="fixed pointer-events-none z-0 rounded-full w-[400px] h-[400px]"
                    style={{ bottom: '-150px', left: '-80px', background: 'radial-gradient(circle, rgba(20,184,166,0.09) 0%, transparent 70%)' }} />


                {/* Logo Section */}
                <div className={`w-full flex items-center py-6 relative ${logoBorderClasses} ${isCollapsed ? 'justify-center' : 'justify-start px-5'}`}>

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        className={`h-[40px] w-[40px] flex items-center justify-center group rounded-md duration-300 hover:bg-slate-800`}
                    >
                        <BsLayoutSidebar className={`h-6 w-6 text-sky-500 ${!isCollapsed && "group-hover:hidden"}`} />
                        <LuArrowLeftToLine className={`h-6 w-6 text-sky-500 hidden ${!isCollapsed && "group-hover:flex"} `} />
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

                        // Hide the main link/dropdown if neither it nor any of its sublinks are accessible
                        if (!canAccessItem && !hasAccessibleSublinks) {
                            return null;
                        }

                        const isPureDropdown = !item.active && item.sublinks.length > 0;
                        const isOpen = isPureDropdown ? openDropdowns === item.name : isParentActive(item);
                        const isLinkActive = isPureDropdown ? false : (isActive(item.href) || isParentActive(item));

                        // Only disable the parent link if it's a direct link (not a category header) AND the user can't access it.
                        // Category headers should only be disabled if no sublinks are accessible (handled by `shouldDisable`).
                        const shouldDisable = isPureDropdown
                            ? !hasAccessibleSublinks   // For dropdowns, disable if no sublinks accessible
                            : !canAccessItem;           // For direct links, check its own permission

                        const commonClasses = `${linkBaseClasses} ${mainLinkSpaceClass} ${isLinkActive ? activeClasses : inactiveMainClasses} ${shouldDisable ? disabledClasses : 'cursor-pointer'}`;

                        return (
                            <React.Fragment key={item.name}>
                                {isPureDropdown ? (
                                    // PURE DROPDOWN BUTTON (for categories like Edit, Notes, Admin)
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
                                                <ChevronDown
                                                    className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                                />
                                            )}
                                        </div>
                                    </button>
                                ) : (
                                    // STANDARD LINK (for direct pages like Matcher, Evaluation)
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

                                {/* Sublinks Section */}
                                {item.sublinks.length > 0 && isOpen && (
                                    <div className="space-y-1 mt-1 pb-2">
                                        {item.sublinks.map((sublink) => {
                                            const canAccessSublink = hasAccess(sublink);

                                            // Skip rendering sublinks that user has no access to
                                            if (!canAccessSublink) {
                                                return null;
                                            }

                                            const sublinkFinalClasses = `${linkBaseClasses} ${sublinkIndentClass} ${isActive(sublink.href) ? activeClasses : inactiveSublinkClasses} cursor-pointer`;

                                            return (
                                                <Link
                                                    key={sublink.name}
                                                    href={sublink.href}
                                                    className={sublinkFinalClasses}
                                                >
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

                {/* Footer Section */}
                <div className={`pt-2 ${footerBorderClasses}`}>


                    <button
                        onClick={() => setIsSettings(!isSettings)}
                        className={`text-gray-400 dark:text-gray-300 font-medium hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-2 w-full duration-300 ${footerPaddingClass}`}
                        title="Settings"
                    >
                        <IoIosSettings size={23} />
                        {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
                    </button>


                    <button
                        onClick={logout}
                        className={`text-gray-400 dark:text-gray-300 font-medium hover:text-red-500 dark:hover:text-red-400 flex items-center gap-2 w-full duration-300 ${footerPaddingClass}`}
                        title="Logout"
                    >
                        <CiLogout size={23} />
                        {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
                    </button>


                    {isCollapsed && <div className="h-4"></div>}
                    {!isCollapsed && (
                        <div className={`p-4 text-xs text-center text-gray-500`}>
                            <p>App Version 4.1.0</p>
                        </div>
                    )}


                </div>
            </div>

            {/* SETTINGS MODAL */}
            {isSettings && (
                <div className="fixed inset-0 w-screen h-screen justify-center items-center flex backdrop-blur-sm bg-black/30 z-[999]">
                    <div ref={settingsRef} className="w-[300px] h-[200px] bg-gray-300 dark:bg-gray-800 rounded-lg shadow-2xl p-6 flex flex-col items-center justify-center gap-6">
                        <h1 className="text-gray-900 dark:text-white font-bold text-xl tracking-wide">Theme</h1>
                        <DarkModeToggle />
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;