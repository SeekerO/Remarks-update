"use client";

import React from "react";
import {
  Shield,
  Globe,
  MessageSquare,
  Ban,
  Key,
  UserPlus,
  CheckCircle2,
  X,
  Crown,
  Pencil,
  Users,
  Building2,
  Clock,
  Infinity,
  Zap,        // ← NEW
} from "lucide-react";
import { motion } from "framer-motion";

import { UserProfile } from "@/lib/types/adminTypes";
import { UserSubscription, UserRole } from "./userRolesModal";
import UserAvatar from "./avatarUI";

// ── Role badge config ─────────────────────────────────────────────────────────
const ROLE_BADGE: Record<
  UserRole,
  { label: string; color: string; icon: React.ElementType }
> = {
  editor: {
    label: "Editor",
    color:
      "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20",
    icon: Pencil,
  },
  user: {
    label: "User",
    color:
      "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
    icon: Users,
  },
  comelec: {
    label: "COMELEC",
    color:
      "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20",
    icon: Building2,
  },
};

// ── Subscription status helper ────────────────────────────────────────────────
function getSubStatus(sub?: UserSubscription): {
  label: string;
  color: string;
  expired: boolean;
} {
  if (!sub)
    return {
      label: "No subscription",
      color: "text-gray-400 dark:text-white/25",
      expired: false,
    };
  if (sub.subscriptionInfinite)
    return {
      label: "∞ Infinite",
      color: "text-sky-600 dark:text-sky-400",
      expired: false,
    };
  if (!sub.subscriptionStartDate || !sub.subscriptionDays)
    return {
      label: "Not set",
      color: "text-gray-400 dark:text-white/25",
      expired: false,
    };

  const start = new Date(sub.subscriptionStartDate);
  const expiry = new Date(start);
  expiry.setDate(expiry.getDate() + sub.subscriptionDays);
  const now = new Date();
  const daysLeft = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysLeft <= 0)
    return {
      label: "Expired",
      color: "text-red-500 dark:text-red-400",
      expired: true,
    };
  if (daysLeft <= 7)
    return {
      label: `${daysLeft}d left`,
      color: "text-amber-600 dark:text-amber-400",
      expired: false,
    };
  return {
    label: `${daysLeft}d left`,
    color: "text-emerald-600 dark:text-emerald-400",
    expired: false,
  };
}

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
    handleOpenRoles,
    handleOpenCredits,   // ← NEW prop
    handleRequestAccess,
    formatLastOnline,
  }: {
    user: UserProfile & { subscription?: UserSubscription };
    isOnline: boolean;
    lastOnlineTimestamp: number | null;
    currentUserId: string;
    handleToggleCanChat: (uid: string, isPermitted: boolean) => void;
    handleToggleAdmin: (uid: string, isAdmin: boolean) => void;
    handleOpenPermissions: (user: UserProfile) => void;
    handleOpenRoles: (
      user: UserProfile & { subscription?: UserSubscription },
    ) => void;
    handleOpenCredits: (user: UserProfile) => void;   // ← NEW prop type
    handleRequestAccess: (user: UserProfile) => void;
    formatLastOnline: (ts: number) => string;
  }) => {
    const isSelf = user.uid === currentUserId;
    const subStatus = getSubStatus(user.subscription);
    const roles = user.subscription?.roles ?? [];

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

        {/* Role badges */}
        {roles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {!user.isAdmin && user.subscription?.roles?.map((role) => {
              const cfg = ROLE_BADGE[role];
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <span
                  key={role}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${cfg.color}`}
                >
                  <Icon className="w-2.5 h-2.5" /> {cfg.label}
                </span>
              );
            })}
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
          <div className="flex items-center gap-1.5">
            {user.subscription?.subscriptionInfinite ? (
              <Infinity className="w-3 h-3 text-sky-400" />
            ) : (
              <Clock className="w-3 h-3 text-gray-400 dark:text-white/25" />
            )}
            <span className={subStatus.color}>{subStatus.label}</span>
          </div>
        </div>

        {/* Permission status */}
        <div className="flex items-center justify-between text-[11px]">
          <span
            className={`flex items-center gap-1 font-medium
          ${user.isPermitted ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
          >
            {user.isPermitted ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            {user.isPermitted ? "Permission on" : "Permission off"}
          </span>
          <span className="text-gray-400 dark:text-white/20 text-[10px]">
            {user.subscription?.allowedPresets?.length ?? 0} presets
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />

        {/* Action buttons row 1 */}
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

        {/* Action buttons row 2 — Roles / Pages */}
        <div className="flex gap-2">
          {user.isAdmin !== true && (
            <button
              onClick={() => handleOpenRoles(user)}
              title="Edit roles & subscription"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
            border border-violet-200 dark:border-violet-500/20
            bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400
            hover:bg-violet-100 dark:hover:bg-violet-500/15 transition-all"
            >
              <Crown className="w-3 h-3" /> Roles
            </button>
          )}

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
        </div>

        {/* Action buttons row 3 — Credits (always visible) */}
        <button
          onClick={() => handleOpenCredits(user)}
          title="Manage tool credits"
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
            border border-indigo-200 dark:border-indigo-500/20
            bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400
            hover:bg-indigo-100 dark:hover:bg-indigo-500/15 transition-all"
        >
          <Zap className="w-3 h-3" /> Credits
        </button>
      </motion.div>
    );
  },
);
UserCard.displayName = "UserCard";

export default UserCard;