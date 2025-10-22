"use client";
import React, { useState } from "react";
import kkk from "../../lib/image/KKK.png";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Pencil, FileText, CheckCircle, Search, Settings, Menu, ChevronLeft } from "lucide-react";

// Define the navigation structure with nesting
const navItems = [
    { name: "Watermark v3", href: "/Watermarkv3", icon: CheckCircle, sublinks: [] },
    {
        name: "Remarks",
        href: "/Remarks",
        icon: Pencil,
        sublinks: [
            { name: "FAQ", href: "/Remarks/Faq", icon: FileText }
        ]
    },
    { name: "Matcher", href: "/Matcher", icon: Search, sublinks: [] },
    { name: "Evaluation", href: "/Evaluation", icon: Settings, sublinks: [] },
];

const Sidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => pathname === href;

    // --- Tailwind Classes (Now with Theme Logic) ---

    // Base classes for the link structure
    const linkBaseClasses = "flex items-center p-3 rounded-lg text-sm transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden";

    // Active classes: Uses a primary color that works well in both light and dark modes
    const activeClasses = "bg-sky-600 text-white font-semibold shadow-md hover:bg-sky-500";

    // Inactive Main Link classes: Define both base (light) and dark variants
    const inactiveMainClasses = "text-gray-700 font-medium hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white";

    // Inactive Sublink classes: Define both base (light) and dark variants, with adjusted color for hierarchy
    const inactiveSublinkClasses = "text-gray-500 font-light hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white";

    // Sidebar sizing/layout logic
    const sidebarWidthClass = isCollapsed ? 'w-[80px]' : 'w-[250px]';
    const sublinkIndentClass = isCollapsed ? 'justify-center' : 'pl-8 space-x-3';
    const mainLinkSpaceClass = isCollapsed ? 'justify-center' : 'space-x-3';

    // Sidebar root classes: Define both base (light) and dark backgrounds and border
    const sidebarRootClasses = "h-screen shrink-0 shadow-2xl transition-all duration-300 ease-in-out mr-1 " +
        "bg-white text-gray-900 dark:bg-gray-900 dark:text-white";

    const logoBorderClasses = "border-b border-gray-200/50 dark:border-gray-700/50";
    const footerBorderClasses = "border-t border-gray-200/50 dark:border-gray-700/50";


    return (
        <div className={`${sidebarWidthClass} ${sidebarRootClasses} justify-between flex flex-col`}>

            {/* Logo Section */}
            <div className={`w-full flex items-center justify-center py-6 relative ${logoBorderClasses}`}>
                {/* Only show image when expanded */}
                {!isCollapsed && (
                    <Image
                        src={kkk}
                        alt="Application Logo"
                        width={140}
                        height={60}
                        className="object-contain"
                        priority
                    />
                )}

                {/* Toggle Button logic updated */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`rounded-full transition-all duration-300
                                ${isCollapsed
                            ? ' -translate-x-1/2 ml-[30%] '
                            : ' absolute top-10 right-6 p-1 bg-gray-200 dark:bg-gray-700'}`}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? (
                        <Menu className="h-6 w-6 text-gray-900 dark:text-white" />
                    ) : (
                        <ChevronLeft className="h-5 w-5 text-gray-900 dark:text-white" />
                    )}
                </button>
            </div>

            {/* Navigation Links Section */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <React.Fragment key={item.name}>
                        {/* Main Link */}
                        <Link
                            href={item.href}
                            className={`${linkBaseClasses} ${mainLinkSpaceClass} ${isActive(item.href) ? activeClasses : inactiveMainClasses}`}
                        >
                            <item.icon className="h-5 w-5 shrink-0 opacity-75" />
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>

                        {/* Sublinks Section */}
                        {item.sublinks.length > 0 && (
                            <div className="space-y-1">
                                {item.sublinks.map((sublink) => (
                                    <Link
                                        key={sublink.name}
                                        href={sublink.href}
                                        className={`${linkBaseClasses} ${sublinkIndentClass} ${isActive(sublink.href) ? activeClasses : inactiveSublinkClasses}`}
                                    >
                                        <sublink.icon className="h-4 w-4 shrink-0 opacity-60" />
                                        {!isCollapsed && <span>{sublink.name}</span>}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </nav>

            {/* Optional: Footer */}
            {!isCollapsed && (
                <div className={`p-4 text-xs text-gray-500 ${footerBorderClasses}`}>
                    <p>App Version 1.0</p>
                </div>
            )}
        </div>
    );
};

export default Sidebar;