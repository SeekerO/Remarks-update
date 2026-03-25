"use client";

import { useState, useEffect, useCallback } from "react";
import { ref, onValue, update } from "firebase/database";
import { Search, Users } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { PageId, UserProfile, AVAILABLE_PAGES } from "@/lib/types/adminTypes";
import { useUserPresence } from "@/lib/hooks/useUserPresence";
import PermissionsModal from "./component/PermissionsModal";
import UserCard from "./component/UserCard"




// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminPanel() {
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserProfile | null>(null);

    const currentUserId = user?.uid ?? "";
    const { onlineUsers, isPresenceLoading, formatLastOnline } = useUserPresence();
    const isLoading = isLoadingUsers || isPresenceLoading;

    useEffect(() => {
        const usersRef = ref(db, "users");
        const unsub = onValue(usersRef, snapshot => {
            const data = snapshot.val();
            if (data) {
                setAllUsers(Object.keys(data).map(uid => ({
                    uid,
                    photoURL: data[uid].photoURL || null,
                    displayName: data[uid].displayName || "Unnamed",
                    email: data[uid].email || "—",
                    isAdmin: data[uid].isAdmin || false,
                    isPermitted: data[uid].isPermitted !== undefined ? data[uid].isPermitted : true,
                    allowedPages: data[uid].allowedPages || undefined,
                })));
            } else { setAllUsers([]); }
            setIsLoadingUsers(false);
        });
        return () => unsub();
    }, []);

    const handleToggleAdmin = useCallback(async (userId: string, currentAdminStatus: boolean) => {
        if (userId === currentUserId) return;
        await update(ref(db, `users/${userId}`), { isAdmin: !currentAdminStatus });
    }, [currentUserId]);

    const handleToggleCanChat = useCallback(async (userId: string, currentCanChatStatus: boolean) => {
        if (userId === currentUserId) return;
        await update(ref(db, `users/${userId}`), { isPermitted: !currentCanChatStatus });
    }, [currentUserId]);

    const handleSavePermissions = useCallback(async (userId: string, allowedPages: PageId[]) => {
        await update(ref(db, `users/${userId}`), { allowedPages });
    }, []);

    if (!user) return (
        <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-[#0f0e17]">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const filteredUsers = allUsers.filter(u =>
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onlineCount = allUsers.filter(u => onlineUsers[u.uid] === true).length;
    const adminCount = allUsers.filter(u => u.isAdmin).length;

    return (
        <>


            <div className="min-h-full w-full bg-gray-50 dark:bg-[#0f0e17] overflow-y-auto">

                {/* ── Sticky Header ── */}
                <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0f0e17]/80 backdrop-blur-md
          border-b border-black/[0.06] dark:border-white/[0.06] px-6 py-4">
                    <div className="max-w-6xl mx-auto flex items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <Users className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                                <h1 className="text-base font-semibold tracking-tight text-gray-800 dark:text-white/85">User Management</h1>
                                <p className="text-[11px] text-gray-400 dark:text-white/30">
                                    {allUsers.length} users · {onlineCount} online · {adminCount} admins
                                </p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/25" />
                            <input
                                type="text"
                                placeholder="Search users…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06]
                  rounded-xl pl-9 pr-4 py-2 text-sm text-gray-700 dark:text-white/70
                  placeholder-gray-400 dark:placeholder-white/20
                  focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
                            />
                        </div>

                        {/* Keyboard hint */}
                        <p className="hidden md:block text-[11px] text-gray-300 dark:text-white/15 font-mono whitespace-nowrap">
                            ⌘K quick search
                        </p>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-6">

                    {/* ── Stat strip ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: "Total users", value: allUsers.length, color: "text-gray-800 dark:text-white/80" },
                            { label: "Online now", value: onlineCount, color: "text-emerald-600 dark:text-emerald-400" },
                            { label: "Admins", value: adminCount, color: "text-indigo-600 dark:text-indigo-400" },
                            { label: "Chat enabled", value: allUsers.filter(u => u.isPermitted).length, color: "text-amber-600 dark:text-amber-400" },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="bg-white dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-4">
                                <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-gray-400 dark:text-white/25 mb-1.5">{label}</p>
                                <p className={`text-2xl font-semibold tracking-tight ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Loading ── */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* ── User grid ── */}
                    {!isLoading && (
                        <>
                            {/* Filter info */}
                            {searchTerm && (
                                <div className="flex items-center gap-2 mb-4">
                                    <p className="text-xs text-gray-400 dark:text-white/30">
                                        {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""} for "{searchTerm}"
                                    </p>
                                    <button onClick={() => setSearchTerm("")}
                                        className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline">
                                        Clear
                                    </button>
                                </div>
                            )}

                            <AnimatePresence mode="popLayout">
                                {filteredUsers.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-20">
                                        {filteredUsers.map(u => (
                                            <UserCard
                                                key={u.uid}
                                                user={u}
                                                isOnline={onlineUsers[u.uid] === true}
                                                lastOnlineTimestamp={typeof onlineUsers[u.uid] === "number" ? onlineUsers[u.uid] as number : null}
                                                currentUserId={currentUserId}
                                                handleToggleCanChat={handleToggleCanChat}
                                                handleToggleAdmin={handleToggleAdmin}
                                                handleOpenPermissions={setSelectedUserForPermissions}
                                                formatLastOnline={formatLastOnline}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.06] flex items-center justify-center mb-4">
                                            <Search className="w-6 h-6 text-gray-300 dark:text-white/20" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-white/40">No users match your search</p>
                                        <p className="text-xs text-gray-400 dark:text-white/25 mt-1">Try a different name or email</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </div>

            {/* ── Permissions Modal ── */}
            {selectedUserForPermissions && (
                <PermissionsModal
                    user={selectedUserForPermissions}
                    onClose={() => setSelectedUserForPermissions(null)}
                    onSave={handleSavePermissions}
                />
            )}
        </>
    );
}