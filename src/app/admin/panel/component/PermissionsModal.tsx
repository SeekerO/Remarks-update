"use client";

import { useState } from "react";
import { Key, CheckCircle2, X, Lock, Unlock, Shield } from "lucide-react";
import { PageId, UserProfile, AVAILABLE_PAGES } from "@/lib/types/adminTypes";


export default function PermissionsModal({
    user, onClose, onSave,
}: {
    user: UserProfile;
    onClose: () => void;
    onSave: (uid: string, pages: PageId[]) => Promise<void>;
}) {
    const initialPages = Array.isArray(user.allowedPages) ? user.allowedPages : [];
    const [selectedPages, setSelectedPages] = useState<PageId[]>(initialPages);
    const [isSaving, setIsSaving] = useState(false);

    const groupedPages = AVAILABLE_PAGES.reduce((acc, page) => {
        if (!acc[page.category]) acc[page.category] = [];
        acc[page.category].push(page);
        return acc;
    }, {} as Record<string, typeof AVAILABLE_PAGES[number][]>);

    const togglePage = (pageId: PageId) =>
        setSelectedPages(prev => prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId]);

    const handleSave = async () => {
        setIsSaving(true);
        try { await onSave(user.uid, selectedPages); onClose(); }
        catch { /* handle */ }
        finally { setIsSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-[#0d0d1a] border border-black/[0.08] dark:border-white/[0.08]
        rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]">

                {/* Accent bar */}
                <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Key className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/85">Page Access Control</p>
                        <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5 truncate">
                            {user.displayName} · {selectedPages.length}/{AVAILABLE_PAGES.length} pages
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/70
              hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 px-5 pt-4 pb-2 flex-shrink-0">
                    <button onClick={() => setSelectedPages(AVAILABLE_PAGES.map(p => p.id))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20
              text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-all">
                        <CheckCircle2 className="w-3 h-3" /> Select all
                    </button>
                    <button onClick={() => setSelectedPages([])}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20
              text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/15 transition-all">
                        <X className="w-3 h-3" /> Deselect all
                    </button>
                </div>

                {/* Pages list */}
                <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5">
                    {!Array.isArray(user.allowedPages) && (
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl
              bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                            <span className="text-amber-500 text-sm">⚠</span>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                Permissions have not been set. All access is currently disabled.
                            </p>
                        </div>
                    )}

                    {Object.entries(groupedPages).map(([category, pages]) => (
                        <div key={category}>
                            <div className="flex items-center gap-2 mb-3">
                                <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-gray-400 dark:text-white/25">
                                    {category}
                                </p>
                                <span className="text-[10px] text-gray-300 dark:text-white/20">
                                    {pages.filter(p => selectedPages.includes(p.id)).length}/{pages.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {pages.map(page => {
                                    const active = selectedPages.includes(page.id);
                                    return (
                                        <label key={page.id}
                                            className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border transition-all
                        ${active
                                                    ? "border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10"
                                                    : "border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-white/[0.02] hover:border-indigo-200 dark:hover:border-indigo-500/20"
                                                }`}>
                                            <input type="checkbox" checked={active} onChange={() => togglePage(page.id)} className="sr-only" />
                                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all
                        ${active ? "bg-indigo-500 border-indigo-500" : "border-gray-300 dark:border-white/20"}`}>
                                                {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>}
                                            </div>
                                            <span className="text-xs font-medium text-gray-700 dark:text-white/70 flex-1 truncate">
                                                {page.name}
                                            </span>
                                            {active ? <Unlock className="w-3 h-3 text-indigo-400 flex-shrink-0" /> : <Lock className="w-3 h-3 text-gray-300 dark:text-white/20 flex-shrink-0" />}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {user.isAdmin && (
                        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl
              bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                            <Shield className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                Admin users have access to all pages regardless of these settings.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
                    <button onClick={onClose} disabled={isSaving}
                        className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
              text-gray-600 dark:text-white/50 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04]
              disabled:opacity-40 transition-all">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={isSaving}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold
              disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                        {isSaving
                            ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                            : "Save permissions"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}