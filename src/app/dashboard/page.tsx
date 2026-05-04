"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { navItems, NavItem, UserRole } from "@/lib/types/adminTypes";
import {
    Layers,
    ChevronRight,
} from "lucide-react";
import { TOOL_META } from "@/lib/types/adminTypes";

/* ─── Greeting based on time of day ─── */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

/* ─── Stat card ─── */
const StatCard = ({
    label,
    value,
    sub,
    color,
}: {
    label: string;
    value: string;
    sub: string;
    color: string;
}) => (
    <div className="bg-white dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-gray-400 dark:text-white/30 mb-2">
            {label}
        </p>
        <p className={`text-2xl font-semibold tracking-tight ${color}`}>{value}</p>
        <p className="text-[11px] text-gray-400 dark:text-white/30 mt-1 font-mono">{sub}</p>
    </div>
);

/* ─── Tool card ─── */
const ToolCard = ({
    item,
}: {
    item: NavItem & { description?: string; accent?: string };
}) => {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            className="group flex items-start gap-3 p-4 rounded-xl
                bg-white dark:bg-white/[0.03]
                border border-black/[0.07] dark:border-white/[0.07]
                hover:border-indigo-300 dark:hover:border-indigo-500/40
                hover:shadow-md dark:hover:shadow-indigo-500/5
                transition-all duration-150 no-underline"
        >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.accent ?? "bg-indigo-500/10"}`}>
                <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white/85 truncate">
                    {item.name}
                </p>
                {item.description && (
                    <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5 leading-snug">
                        {item.description}
                    </p>
                )}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-white/20 group-hover:text-indigo-400 transition-colors mt-0.5 flex-shrink-0" />
        </Link>
    );
};

/* ─── Section header ─── */
const SectionHeader = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="mb-4">
        <h2 className="text-base font-semibold tracking-tight text-gray-800 dark:text-white/85">
            {title}
        </h2>
        {sub && <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{sub}</p>}
    </div>
);

/* ═══════════════════════════════════════
   TOOL DESCRIPTIONS — enriches navItems
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════ */
export default function DashboardPage() {
    const { user } = useAuth();
    const [time, setTime] = useState("");
    const [date, setDate] = useState("");


    /* Live clock */
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true }));
            setDate(now.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    /* Resolve accessible tools */
    const userRole: UserRole = user?.isAdmin ? "admin" : "standard";
    const allowedPages: string[] | null =
        userRole === "admin" ? null : (user?.allowedPages ?? []);

    const hasAccess = (item: NavItem): boolean => {
        if (userRole !== "admin" && item.requiredRole === "admin") return false;
        if (allowedPages === null) return true;
        if (!item.pagePermissionId) return false;
        return allowedPages.includes(item.pagePermissionId);
    };

    /* Flatten all accessible leaf nav items */
    const allTools: (NavItem & { description?: string; accent?: string })[] = [];
    navItems.forEach((item) => {
        if (item.sublinks.length > 0) {
            item.sublinks.forEach((sub) => {
                if (hasAccess(sub) && sub.href) {
                    const meta = TOOL_META[sub.name];
                    allTools.push({ ...sub, ...meta });
                }
            });
        } else if (hasAccess(item) && item.href) {
            const meta = TOOL_META[item.name];
            allTools.push({ ...item, ...meta });
        }
    });

    /* Group by category */
    const editTools = allTools.filter((t) => ["Watermark", "BG Remover", "Logo Editor", "Resolution Adjuster" ].includes(t.name));
    const docTools = allTools.filter((t) => ["FAQ", "Remarks", "PDF"].includes(t.name));
    const mainTools = allTools.filter((t) => ["Matcher", "CSC Reveiwer", "DTR Extractor"].includes(t.name));
    const adminTools = allTools.filter((t) => ["Admin Panel", "Time Log", "User Log", "Test Page"].includes(t.name));
    const directoryTools = allTools.filter((t) => ["COMELEC Offices", "DTR Extractor"].includes(t.name));

    const firstName = user?.displayName?.split(" ")[0] ?? "there";

    return (
        <div className="min-h-full w-screen bg-gray-50 dark:bg-[#0f0e17] overflow-y-auto">

            {/* ── Top hero strip ── */}
            <div className="relative overflow-hidden
                bg-white border-b border-gray-200
                dark:bg-[#0d0d1a] dark:border-white/[0.06]">

                {/* Subtle glow — visible in dark only */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full
                        bg-indigo-400/5 dark:bg-indigo-600/10 blur-3xl" />
                </div>

                <div className="relative max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Greeting */}
                    <div>
                        <p className="text-md font-medium tracking-[0.07em] uppercase
                            text-indigo-500/60 dark:text-indigo-400/70 mb-1">
                            {getGreeting()}
                        </p>
                        <h1 className="text-4xl font-semibold tracking-tight
                            text-gray-900 dark:text-white/90">
                            {firstName}<span className="text-indigo-500 dark:text-indigo-400">.</span>
                        </h1>
                        <p className="text-sm text-gray-400 dark:text-white/35 mt-0.5">{date}</p>
                    </div>

                    {/* Live clock */}
                    <div className="flex flex-col items-start sm:items-end">
                        <p className="text-3xl font-semibold tracking-tight font-mono tabular-nums
                            text-gray-800 dark:text-white/80">
                            {time}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <p className="text-[11px] text-gray-400 dark:text-white/30">
                                {user?.isAdmin ? "Administrator · Master" : "User"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

                {/* ── Stat row ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                        label="Your role"
                        value={user?.isAdmin ? "Admin" : "User"}
                        sub="access level"
                        color="text-indigo-600 dark:text-indigo-400"
                    />
                    <StatCard label="Tools" value={String(allTools.length)} sub="accessible" color="text-gray-800 dark:text-white/80" />
                    <StatCard label="Edit tools" value={String(editTools.length)} sub="image & design" color="text-gray-800 dark:text-white/80" />
                    <StatCard label="Doc tools" value={String(docTools.length)} sub="documents & data" color="text-gray-800 dark:text-white/80" />
                </div>

                {/* ── Edit tools ── */}
                {editTools.length > 0 && (
                    <section>
                        <SectionHeader title="Image & Design" sub="Client-side processing — your files never leave the device" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {editTools.map((t) => <ToolCard key={t.name} item={t} />)}
                        </div>
                    </section>
                )}

                {/* ── Main tools ── */}
                {mainTools.length > 0 && (
                    <section>
                        <SectionHeader title="Tools" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {mainTools.map((t) => <ToolCard key={t.name} item={t} />)}
                        </div>
                    </section>
                )}

                {/* ── Document tools ── */}
                {docTools.length > 0 && (
                    <section>
                        <SectionHeader title="Documents" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {docTools.map((t) => <ToolCard key={t.name} item={t} />)}
                        </div>
                    </section>
                )}

                {directoryTools.length > 0 && (
                    <section>
                        <SectionHeader title="Directory" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {directoryTools.map((t) => <ToolCard key={t.name} item={t} />)}
                        </div>
                    </section>
                )}



                {/* ── Admin tools ── */}
                {adminTools.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1">
                                <h2 className="text-base font-semibold tracking-tight text-gray-800 dark:text-white/85">
                                    Admin
                                </h2>
                                <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
                                    Restricted — administrator access only
                                </p>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full
                                bg-red-100 text-red-600
                                dark:bg-red-500/10 dark:text-red-400
                                border border-red-200 dark:border-red-500/20">
                                Admin only
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {adminTools.map((t) => <ToolCard key={t.name} item={t} />)}
                        </div>
                    </section>
                )}

                {/* ── Empty state (no tools) ── */}
                {allTools.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                            <Layers className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-white/50">No tools available</p>
                        <p className="text-xs text-gray-400 dark:text-white/25 mt-1 max-w-xs">
                            Your account has no page permissions yet. Contact an administrator to get access.
                        </p>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="pt-6 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-[11px] text-gray-300 dark:text-white/15 font-mono">
                        Avexi v5.0.0
                    </p>
                    <p className="text-[11px] text-gray-300 dark:text-white/15">
                        All processing happens client-side. No data is sent externally.
                    </p>
                </div>

            </div>
        </div>
    );
}