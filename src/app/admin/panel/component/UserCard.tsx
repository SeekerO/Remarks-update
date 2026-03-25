"use client";

import React from "react"
import { Shield, Globe, MessageSquare, Ban, Key, UserPlus, CheckCircle2, X, } from "lucide-react";
import { motion } from "framer-motion";

import { UserProfile, } from "@/lib/types/adminTypes";
import UserAvatar from "./avatarUI"

// ─── USER CARD ────────────────────────────────────────────────────────────────
const UserCard = React.memo(({
    user, isOnline, lastOnlineTimestamp, currentUserId,
    handleToggleCanChat, handleToggleAdmin, handleOpenPermissions, formatLastOnline,
}: {
    user: UserProfile; isOnline: boolean; lastOnlineTimestamp: number | null;
    currentUserId: string; handleToggleCanChat: (uid: string, canChat: boolean) => void;
    handleToggleAdmin: (uid: string, isAdmin: boolean) => void;
    handleOpenPermissions: (user: UserProfile) => void;
    formatLastOnline: (ts: number) => string;
}) => {
    const isSelf = user.uid === currentUserId;
    console.log(user)
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group bg-white dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07]
        rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-300 dark:hover:border-indigo-500/30
        hover:shadow-sm transition-all duration-150"
        >
            {/* Top row */}
            <div className="flex items-start gap-3">
                <UserAvatar user={user} isOnline={isOnline} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/85 truncate">
                            {user.displayName}
                        </p>
                        {user.isAdmin && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium
                bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400
                border border-indigo-200 dark:border-indigo-500/20">
                                <Shield className="w-2.5 h-2.5" /> Admin
                            </span>
                        )}
                        {isSelf && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium
                bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400
                border border-violet-200 dark:border-violet-500/20">
                                You
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-white/30 truncate mt-0.5">{user.email}</p>
                </div>
            </div>

            {/* Status row */}
            <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-gray-400 dark:text-white/25" />
                    <span className={isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-white/30"}>
                        {isOnline ? "Online" : lastOnlineTimestamp ? formatLastOnline(lastOnlineTimestamp) : "Offline"}
                    </span>
                </div>
                <span className={`flex items-center gap-1 font-medium
          ${user.isPermitted ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {user.isPermitted ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {user.isPermitted ? "Pemission on" : "Permission off"}


                </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />

            {/* Action buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => handleToggleCanChat(user.uid, user.isPermitted)}
                    disabled={isSelf}
                    title={user.isPermitted ? "Revoke chat" : "Grant chat"}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
            border transition-all disabled:opacity-30 disabled:cursor-not-allowed
            ${user.isPermitted
                            ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/15"
                            : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/15"
                        }`}
                >
                    {user.isPermitted ? <Ban className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                    {user.isPermitted ? "Revoke" : "Grant"}
                </button>
                <button
                    onClick={() => handleToggleAdmin(user.uid, user.isAdmin)}
                    disabled={isSelf}
                    title={user.isAdmin ? "Remove admin" : "Promote to admin"}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
            border border-amber-200 dark:border-amber-500/20
            bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400
            hover:bg-amber-100 dark:hover:bg-amber-500/15
            transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {user.isAdmin ? <UserPlus className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {user.isAdmin ? "Demote" : "Promote"}
                </button>
                <button
                    onClick={() => handleOpenPermissions(user)}
                    title="Edit page permissions"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[11px]
            border border-black/[0.07] dark:border-white/[0.07]
            bg-white dark:bg-white/[0.03] text-gray-400 dark:text-white/30
            hover:border-indigo-300 dark:hover:border-indigo-500/40
            hover:text-indigo-500 dark:hover:text-indigo-400
            transition-all"
                >
                    <Key className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
});
UserCard.displayName = "UserCard";

export default UserCard