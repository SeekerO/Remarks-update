"use client";
import React, { useRef, useState, useEffect } from "react";
import kkk from "../../lib/image/KKK.png";
import Image from "next/image";
import Link from "next/link";
import DarkModeToggle from "@/lib/components/dark-button";
import { useAuth } from "../Chat/AuthContext";
import { usePathname } from 'next/navigation';
import { Search, Settings, ChevronDown } from "lucide-react";
import { CiLogout } from "react-icons/ci";
import { IoIosSettings, IoLogoBuffer, IoIosColorWand } from "react-icons/io";
import { FaRegFileImage, FaFileAlt, FaYoutube, FaSpotify } from "react-icons/fa";
import { FaRegNoteSticky, FaFilePen } from "react-icons/fa6";
import { GiCardExchange } from "react-icons/gi";
import { IoWater } from "react-icons/io5";
import { BsLayoutSidebar } from "react-icons/bs";
import { CiPlay1 } from "react-icons/ci";
import { LuArrowLeftToLine } from "react-icons/lu";
import { SiYoutubestudio } from "react-icons/si";
// --- 1. Tailwind Class Definitions ---

const linkBaseClasses = "flex items-center p-3 rounded-lg text-sm transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden";
const activeClasses = "bg-sky-900 text-white font-semibold shadow-md hover:bg-sky-500";
const inactiveMainClasses = "text-gray-700 font-medium hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white";
const inactiveSublinkClasses = "text-gray-500 font-light hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white";
const sidebarRootClasses = "h-screen shrink-0 shadow-2xl transition-all duration-300 ease-in-out mr-1 " +
    "bg-white text-gray-900 dark:bg-gray-900 dark:text-white";
const logoBorderClasses = "border-b border-gray-200/50 dark:border-gray-700/50";
const footerBorderClasses = "border-t border-gray-200/50 dark:border-gray-700/50";


// --- 2. Navigation Data Structure ---

const navItems = [
    {
        name: "Edit",
        href: "",
        icon: FaRegFileImage,
        active: false, // Remains a link/parent-toggle based on isParentActive
        sublinks: [
            { name: "Watermark V4", href: "/Edit/Watermarkv4", icon: IoWater, active: true, },
            { name: "BG Remover", href: "/Edit/Backgroundremover", icon: IoIosColorWand, active: true, },
            { name: "Logo Maker", href: "/Edit/LogoMaker", icon: IoLogoBuffer, active: true, }
        ]
    },
    {
        name: "Notes",
        href: "",
        icon: FaRegNoteSticky,
        active: false, // Remains a link/parent-toggle based on isParentActive
        sublinks: [
            { name: "FAQ", href: "/Remarks/Faq", icon: FaFileAlt, active: true, },
            { name: "Remarks", href: "/Remarks", icon: FaFilePen, active: true, },
            { name: "PDF", href: "/Pdf", icon: GiCardExchange, active: true, }
        ]
    },
    {
        name: "Matcher (Dropdown)",
        href: "/Matcher", // This href is ignored when active: false
        icon: Search,
        active: true, // **THIS IS THE PURE DROPDOWN TOGGLE**
        sublinks: [

        ]
    },
    { name: "Evaluation", href: "/Evaluation", icon: Settings, active: true, sublinks: [] },
    {
        name: "Player", href: "", icon: CiPlay1, active: false, sublinks: [
            { name: "Youtube Validator", href: "/Player/YoutubeLinkValidator", icon: SiYoutubestudio, active: true, },
            { name: "Youtube", href: "/Player/Youtube", icon: FaYoutube, active: true, },
            { name: "Spotify", href: "/Player/Spotify", icon: FaSpotify, active: true, },
        ]
    },
];


// --- 3. Sidebar Component ---

const Sidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const [isSettings, setIsSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const { logout } = useAuth();

    // State to track open dropdowns for items where active: false
    const [openDropdowns, setOpenDropdowns] = useState<string | null>(null);

    // Toggle handler for the new dropdown button logic
    const toggleDropdown = (name: string) => {
        setOpenDropdowns(prev => prev === name ? null : name);
    };

    const isActive = (href: string) => pathname === href;

    // Determines if the current path is under the link's root (for parent links)
    const isParentActive = (item: typeof navItems[0]) => {
        // Only consider link-type items (active: true) for path-based opening
        if (!item.active) return false;
        return item.sublinks.length > 0 && (pathname.startsWith(item.href) || item.sublinks.some(sub => pathname.startsWith(sub.href)));
    };

    // Outside click handler (No changes)
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

    // Sidebar sizing/layout logic (No changes)
    const sidebarWidthClass = isCollapsed ? 'w-[80px]' : 'w-[250px]';
    const sublinkIndentClass = isCollapsed ? 'justify-center' : 'pl-8 space-x-3';
    const mainLinkSpaceClass = isCollapsed ? 'justify-center' : 'space-x-3';
    const footerPaddingClass = isCollapsed ? 'justify-center py-2' : 'pl-6 py-3';

    return (
        <>
            <div className={`${sidebarWidthClass} ${sidebarRootClasses} ${!isCollapsed ? "overflow-y-auto" : "overflow-hidden"} justify-between flex flex-col h-full`}>

                {/* Logo Section (Omitted for brevity, no change) */}
                <div className={`w-full flex items-center  py-6 relative ${logoBorderClasses} ${isCollapsed ? 'justify-center' : 'justify-start px-5'}`}>
                    {/* ... logo and collapse button logic ... */}



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
                {/* --- */}

                {/* Navigation Links Section */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        // **Refined Logic:**
                        const isPureDropdown = !item.active && item.sublinks.length > 0;
                        // isOpen is either path-driven (for active: true) OR state-driven (for active: false)
                        const isOpen = isPureDropdown ? openDropdowns === item.name : isParentActive(item);
                        const isLinkActive = isPureDropdown ? false : (isActive(item.href) || isParentActive(item)); // Pure dropdowns are never "link active"

                        const commonClasses = `${linkBaseClasses} ${mainLinkSpaceClass} ${isLinkActive ? activeClasses : inactiveMainClasses} ${item.active ? 'cursor-pointer' : 'opacity-100'}`;


                        // Render a Link or a Button
                        return (
                            <React.Fragment key={item.name}>
                                {isPureDropdown ? (
                                    // 1. PURE DROPDOWN BUTTON (active: false, no redirection)
                                    <button
                                        onClick={() => toggleDropdown(item.name)}
                                        className={`${commonClasses} w-full text-left`} // Add w-full and text-left for button styling
                                        title={`Toggle ${item.name} Sublinks`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center space-x-3">
                                                <item.icon className="h-5 w-5 shrink-0 opacity-75" />
                                                {!isCollapsed && <span className="flex-1">{item.name}</span>}
                                            </div>
                                            {!isCollapsed && (
                                                <ChevronDown
                                                    className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                                />
                                            )}
                                        </div>
                                    </button>
                                ) : (
                                    // 2. STANDARD LINK (active: true, may redirect or act as path-based toggle)
                                    <Link
                                        href={item.href}
                                        className={commonClasses}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0 opacity-75" />
                                        {!isCollapsed && <span>{item.name}</span>}
                                        {/* OPTIONAL: Show a chevron on standard link-toggles too */}
                                        {!isCollapsed && item.sublinks.length > 0 && (
                                            <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                                        )}
                                    </Link>
                                )}

                                {/* Sublinks Section (Show if not collapsed AND dropdown is open) */}
                                {item.sublinks.length > 0 && isOpen && (
                                    <div className="space-y-1 mt-1 pb-2">
                                        {item.sublinks.map((sublink) => (
                                            <Link
                                                key={sublink.name}
                                                href={sublink.href}
                                                className={`${linkBaseClasses} ${sublinkIndentClass} ${isActive(sublink.href) ? activeClasses : inactiveSublinkClasses} ${sublink.active ? 'cursor-pointer' : 'opacity-50 pointer-events-none'}`}
                                            >
                                                <sublink.icon className="h-4 w-4 shrink-0 opacity-60" />
                                                {!isCollapsed && <span>{sublink.name}</span>}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </nav>

                {/* Footer Section (Omitted for brevity, no change) */}
                <div className={`pt-2 ${footerBorderClasses}`}>
                    {/* ... logout, settings buttons, and version info ... */}
                    <button
                        onClick={logout}
                        className={`text-gray-400 dark:text-gray-300 font-medium hover:text-red-500 dark:hover:text-red-400 flex items-center gap-2 w-full duration-300 ${footerPaddingClass}`}
                        title="Logout"
                    >
                        <CiLogout size={23} />
                        {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
                    </button>

                    <button
                        onClick={() => setIsSettings(!isSettings)}
                        className={`text-gray-400 dark:text-gray-300 font-medium hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-2 w-full duration-300 ${footerPaddingClass}`}
                        title="Settings"
                    >
                        <IoIosSettings size={23} />
                        {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
                    </button>
                    {isCollapsed && <div className="h-4"></div>}
                    {!isCollapsed && (
                        <div className={`p-4 text-xs text-center text-gray-500`}>
                            <p>App Version 4.0.0</p>
                        </div>
                    )}
                </div>
                {/* --- */}
            </div>

            {/* SETTINGS MODAL (Omitted for brevity, no change) */}
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

// 4.0.0 - 10/25/2025