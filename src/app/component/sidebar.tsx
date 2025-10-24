"use client";
import React, { useRef, useState, useEffect } from "react";
import kkk from "../../lib/image/KKK.png"; // Adjust this path as needed
import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { FileText, Search, Settings, Menu, ChevronLeft } from "lucide-react";
import { CiLogout } from "react-icons/ci";
import { TfiWrite } from "react-icons/tfi";
import { IoImagesOutline } from "react-icons/io5";
import { IoIosSettings, IoLogoBuffer } from "react-icons/io";
import { PiSelectionBackgroundLight } from "react-icons/pi";
import { GoDot } from "react-icons/go";
import DarkModeToggle from "@/lib/components/dark-button"; // Adjust this path as needed
import { useAuth } from "../Chat/AuthContext";

// --- 1. Tailwind Class Definitions ---

// Base classes for the link structure
const linkBaseClasses = "flex items-center p-3 rounded-lg text-sm transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden";

// Active classes: Uses a primary color that works well in both light and dark modes
const activeClasses = "bg-sky-900 text-white font-semibold shadow-md hover:bg-sky-500";

// Inactive Main Link classes: Define both base (light) and dark variants
const inactiveMainClasses = "text-gray-700 font-medium hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white";

// Inactive Sublink classes: Define both base (light) and dark variants, with adjusted color for hierarchy
const inactiveSublinkClasses = "text-gray-500 font-light hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white";

// Sidebar root classes: Define both base (light) and dark backgrounds and border
const sidebarRootClasses = "h-screen shrink-0 shadow-2xl transition-all duration-300 ease-in-out mr-1 " +
    "bg-white text-gray-900 dark:bg-gray-900 dark:text-white";

const logoBorderClasses = "border-b border-gray-200/50 dark:border-gray-700/50";
const footerBorderClasses = "border-t border-gray-200/50 dark:border-gray-700/50";


// --- 2. Navigation Data Structure ---

const navItems = [
    {
        name: "Edit",
        href: "/Edit/Watermarkv3",
        icon: GoDot,
        active: true,
        sublinks: [
            { name: "Watermark", href: "/Edit/Watermarkv3", icon: IoImagesOutline, active: true, },
            { name: "BG Remover", href: "/Edit/Backgroundremover", icon: PiSelectionBackgroundLight, active: true, },
            { name: "Logo Maker", href: "/Edit/LogoMaker", icon: IoLogoBuffer, active: true, }
        ]
    },
    {
        name: "Notes",
        href: "/Remarks/Faq", // Set main link to first sublink for better UX
        icon: GoDot,
        active: true,
        sublinks: [
            { name: "FAQ", href: "/Remarks/Faq", icon: FileText, active: true, },
            { name: "Remarks", href: "/Remarks", icon: TfiWrite, active: true, }
        ]
    },
    { name: "Matcher", href: "/Matcher", icon: Search, active: true, sublinks: [] },
    { name: "Evaluation", href: "/Evaluation", icon: Settings, active: true, sublinks: [] },
];


// --- 3. Sidebar Component ---

const Sidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const [isSettings, setIsSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const { logout } = useAuth(); // Assume useAuth provides a logout function

    // Determines if the current path is an exact match for the link href
    const isActive = (href: string) => pathname === href;

    // Determines if the current path is under the link's root (for parent links)
    const isParentActive = (item: typeof navItems[0]) => {
        // Checks if the current path starts with the main link href OR any sublink href
        return pathname.startsWith(item.href) || item.sublinks.some(sub => pathname.startsWith(sub.href));
    };

    // Outside click handler for the settings modal
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

    // Adjusted class for consistent vertical spacing and alignment in the footer
    const footerPaddingClass = isCollapsed ? 'justify-center py-2' : 'pl-6 py-3';

    return (
        <>
            <div className={`${sidebarWidthClass} ${sidebarRootClasses} ${!isCollapsed ? "overflow-y-auto" : "overflow-hidden"} justify-between flex flex-col h-full`}>

                {/* Logo Section */}
                <div className={`w-full flex items-center ${isCollapsed ? 'justify-center py-6' : 'justify-start px-6 py-6'} relative ${logoBorderClasses}`}>

                    {/* Show icon when collapsed, or full image when expanded */}
                    {!isCollapsed ? (
                        <Image
                            src={kkk}
                            alt="Application Logo"
                            width={140}
                            height={60}
                            className="object-contain"
                            priority
                        />
                    ) : (
                        // Placeholder icon when collapsed, to maintain central alignment
                        <button onClick={() => setIsCollapsed(!isCollapsed)}
                            className="h-[60px] w-[60px] flex items-center justify-center">
                            <Menu className="h-6 w-6 text-sky-500" />
                        </button>
                    )}


                    {/* Toggle Button (Crucial: Correct positioning via 'absolute' outside the main flow) */}
                    {!isCollapsed &&
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`rounded-full transition-all duration-300 text-gray-900 dark:text-white
                            ${isCollapsed
                                    ? 'absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-2 bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 shadow-md'
                                    : ' absolute top-10 right-6 p-1 bg-gray-200 dark:bg-gray-700'} z-50`}
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >

                            <ChevronLeft className="h-5 w-5" />
                        </button>
                    }
                </div>

                {/* Navigation Links Section */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <React.Fragment key={item.name}>
                            {/* Main Link */}
                            <Link
                                href={item.href}
                                // Highlight main link if it's the exact path OR if a sublink is active
                                className={`${linkBaseClasses} ${mainLinkSpaceClass} ${isActive(item.href) || isParentActive(item) ?
                                    activeClasses : inactiveMainClasses} ${item.active ? 'cursor-pointer' : 'opacity-50 pointer-events-none'}`}
                            >
                                <item.icon className="h-5 w-5 shrink-0 opacity-75" />
                                {!isCollapsed && <span>{item.name}</span>}
                            </Link>

                            {/* Sublinks Section (Only show if not collapsed AND parent/sublink is active) */}
                            {!isCollapsed && item.sublinks.length > 0 && isParentActive(item) && (
                                <div className="space-y-1 mt-1 pb-2">
                                    {item.sublinks.map((sublink) => (
                                        <Link
                                            key={sublink.name}
                                            href={sublink.href}
                                            className={`${linkBaseClasses} ${sublinkIndentClass} ${isActive(sublink.href) ? activeClasses : inactiveSublinkClasses} ${sublink.active ? 'cursor-pointer' : 'opacity-50 pointer-events-none'}`}
                                        >
                                            <sublink.icon className="h-4 w-4 shrink-0 opacity-60" />
                                            <span>{sublink.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Footer Section */}
                {/* Applied footerBorderClasses to the wrapper DIV */}
                <div className={`pt-2 ${footerBorderClasses}`}>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className={`text-gray-400 dark:text-gray-300 font-medium hover:text-red-500 dark:hover:text-red-400 flex items-center gap-2 w-full duration-300 ${footerPaddingClass}`}
                        title="Logout"
                    >
                        <CiLogout size={23} />
                        {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
                    </button>

                    {/* Settings Button */}
                    <button
                        onClick={() => setIsSettings(!isSettings)}
                        className={`text-gray-400 dark:text-gray-300 font-medium hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-2 w-full duration-300 ${footerPaddingClass}`}
                        title="Logout"
                    >
                        <IoIosSettings size={23} />
                        {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
                    </button>



                    {/* Spacer for better bottom clearance in collapsed mode */}
                    {isCollapsed && <div className="h-4"></div>}

                    {/* Optional: App Version */}
                    {!isCollapsed && (
                        <div className={`p-4 text-xs text-center text-gray-500`}>
                            <p>App Version 3.0</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SETTINGS MODAL (FIXED) - Rendered as a sibling to the main sidebar for correct full-screen overlay */}
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