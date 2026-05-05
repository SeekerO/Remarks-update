"use client";

import React, { useState } from "react";
import {
  Shield,
  Globe,
  MessageSquare,
  Ban,
  Key,
  CheckCircle2,
  X,
  Zap,
  StickyNote,
  UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";

import { UserProfile } from "@/lib/types/adminTypes";
import UserAvatar from "./avatarUI";

// ── UserCard ──────────────────────────────────────────────────────────────────
const UserCard = React.memo(
  ({
    user,
    isOnline,
    lastOnlineTimestamp,
    currentUserId,
    handleToggleCanChat,
    handleToggleAdmin,
    handleOpenPermissions,
    handleOpenCredits,
    handleOpenNotes,
    formatLastOnline,
  }: {
    user: UserProfile;
    isOnline: boolean;
    lastOnlineTimestamp: number | null;
    currentUserId: string;
    handleToggleCanChat: (uid: string, isPermitted: boolean) => void;
    handleToggleAdmin: (uid: string, isAdmin: boolean) => void;
    handleOpenPermissions: (user: UserProfile) => void;
    handleOpenCredits: (user: UserProfile) => void;
    handleOpenNotes: (user: UserProfile) => void;
    formatLastOnline: (ts: number) => string;
  }) => {
    const isSelf = user.uid === currentUserId;
    const hasNotes = !!(user.notes && user.notes.trim().length > 0);

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
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium
                bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400
                border border-indigo-200 dark:border-indigo-500/20"
                >
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-white/30 truncate mt-0.5">
              {user.email}
            </p>
          </div>
        </div>

        {/* Notes preview */}
        {hasNotes && (
          <div className="px-2.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <p className="text-[10px] text-amber-700 dark:text-amber-300 line-clamp-2 leading-relaxed">
              {user.notes}
            </p>
          </div>
        )}

        {/* Status row */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-gray-400 dark:text-white/25" />
            <span
              className={
                isOnline
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-400 dark:text-white/30"
              }
            >
              {isOnline
                ? "Online"
                : lastOnlineTimestamp
                  ? formatLastOnline(lastOnlineTimestamp)
                  : "Offline"}
            </span>
          </div>

          {/* Permission status */}
          <span
            className={`flex items-center gap-1 font-medium
          ${user.isPermitted ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
          >
            {user.isPermitted ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            {user.isPermitted ? "Access on" : "Access off"}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />

        {/* Action buttons row 1 — Access / Admin */}
        <div className="flex gap-2">
          <button
            onClick={() => handleToggleCanChat(user.uid, user.isPermitted)}
            disabled={isSelf}
            title={!user.isPermitted ? "Grant Access" : "Revoke Access"}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
            border transition-all disabled:opacity-30 disabled:cursor-not-allowed
            ${
              user.isPermitted
                ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/15"
                : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/15"
            }`}
          >
            {user.isPermitted ? (
              <Ban className="w-3 h-3" />
            ) : (
              <MessageSquare className="w-3 h-3" />
            )}
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
            {user.isAdmin ? (
              <UserPlus className="w-3 h-3" />
            ) : (
              <Shield className="w-3 h-3" />
            )}
            {user.isAdmin ? "Demote" : "Promote"}
          </button>
        </div>

        {/* Action buttons row 2 — Pages / Credits / Notes */}
        <div className="flex gap-2">
          {!user.isAdmin && (
            <button
              onClick={() => handleOpenPermissions(user)}
              title="Edit page permissions"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
              border border-black/[0.07] dark:border-white/[0.07]
              bg-white dark:bg-white/[0.03] text-gray-500 dark:text-white/40
              hover:border-indigo-300 dark:hover:border-indigo-500/40
              hover:text-indigo-500 dark:hover:text-indigo-400 transition-all"
            >
              <Key className="w-3 h-3" /> Pages
            </button>
          )}

          <button
            onClick={() => handleOpenCredits(user)}
            title="Manage tool credits"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
              border border-indigo-200 dark:border-indigo-500/20
              bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400
              hover:bg-indigo-100 dark:hover:bg-indigo-500/15 transition-all"
          >
            <Zap className="w-3 h-3" /> Credits
          </button>

          <button
            onClick={() => handleOpenNotes(user)}
            title="Admin notes"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
              border transition-all
              ${hasNotes
                ? "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/15"
                : "border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-white/[0.03] text-gray-500 dark:text-white/40 hover:border-amber-300 dark:hover:border-amber-500/40 hover:text-amber-500 dark:hover:text-amber-400"
              }`}
          >
            <StickyNote className="w-3 h-3" />
            {hasNotes ? "Notes" : "Note"}
          </button>
        </div>
      </motion.div>
    );
  },
);
UserCard.displayName = "UserCard";

export default UserCard;