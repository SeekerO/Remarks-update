"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth/AuthContext";
import { usePathname } from "next/navigation";
import { ChevronDown, X, Menu } from "lucide-react";
import { CiLogout } from "react-icons/ci";
import { IoIosSettings } from "react-icons/io";
import DarkModeToggle from "@/lib/components/dark-button";
import { navItems, NavItem, UserRole } from "@/lib/types/adminTypes";
import Image from "next/image";
import Logo from "@/../public/Avexi.png";
import { ref, onValue, get, update } from "firebase/database";
import { db } from "@/lib/firebase/firebase";

/* ─────────────────────────────────────────────
   UNREAD COUNT HOOK
   ───────────────────────────────────────────── */
function useMessageUnreadCount(userId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const userChatsRef = ref(db, `userChats/${userId}`);
    let chatUnsubs: (() => void)[] = [];

    const userChatsUnsub = onValue(userChatsRef, (snap) => {
      // Clear previous chat listeners
      chatUnsubs.forEach((u) => u());
      chatUnsubs = [];

      const chatData = snap.val();
      if (!chatData) {
        setCount(0);
        return;
      }

      const chatIds = Object.keys(chatData);
      const unreadPerChat: Record<string, number> = {};

      chatIds.forEach((chatId) => {
        const lastReadId: string | null =
          chatData[chatId]?.lastReadMessageId ?? null;

        const msgsRef = ref(db, `chats/${chatId}/messages`);
        const msgUnsub = onValue(msgsRef, (msgsSnap) => {
          const msgs = msgsSnap.val();
          if (!msgs) {
            unreadPerChat[chatId] = 0;
          } else {
            const entries = Object.entries(msgs as Record<string, any>);
            unreadPerChat[chatId] = entries.filter(
              ([msgId, msg]) =>
                msg.senderId !== userId &&
                !msg.isSystemMessage &&
                (!lastReadId || msgId > lastReadId),
            ).length;
          }
          setCount(Object.values(unreadPerChat).reduce((a, b) => a + b, 0));
        });

        chatUnsubs.push(msgUnsub);
      });
    });

    return () => {
      userChatsUnsub();
      chatUnsubs.forEach((u) => u());
    };
  }, [userId]);

  return count;
}

/* ─────────────────────────────────────────────
   SETTINGS MODAL
   ───────────────────────────────────────────── */
const SettingsModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const ref2 = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [allowCalls, setAllowCalls] = useState(true);

  // Load current value
  useEffect(() => {
    if (!user?.uid || !open) return;
    get(ref(db, `users/${user.uid}/allowCalls`)).then((snap: any) => {
      setAllowCalls(snap.val() ?? true);
    });
  }, [user?.uid, open]);

  const toggleAllowCalls = async () => {
    if (!user?.uid) return;
    const next = !allowCalls;
    setAllowCalls(next);
    await update(ref(db, `users/${user.uid}`), { allowCalls: next });
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref2.current && !ref2.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 dark:bg-black/55 backdrop-blur-md">
      <div
        ref={ref2}
        className="flex flex-col items-center gap-5 p-8 w-64 rounded-2xl
          bg-white dark:bg-[#0f0e17]
          border border-black/10 dark:border-white/10
          shadow-2xl"
      >
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
          Appearance
        </p>
        <DarkModeToggle />
        <div className="w-full flex items-center justify-between px-1">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-white/70">
              Allow Calls
            </p>
            <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">
              {allowCalls ? "Others can call you" : "Chat only"}
            </p>
          </div>
          <button
            onClick={toggleAllowCalls}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              allowCalls ? "bg-indigo-500" : "bg-gray-300 dark:bg-white/10"
            }`}
          >
            <div
              className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                allowCalls ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   UNREAD BADGE
   ───────────────────────────────────────────── */
const UnreadBadge = ({
  count,
  collapsed,
}: {
  count: number;
  collapsed?: boolean;
}) => {
  if (count === 0) return null;

  const label = count > 99 ? "99+" : count.toString();

  if (collapsed) {
    // Dot-only mode when sidebar is collapsed
    return (
      <span
        className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full
          bg-indigo-500 border border-[#0d0d1a]
          flex items-center justify-center
          text-[9px] font-bold text-white leading-none px-1"
      >
        {count > 9 ? "9+" : label}
      </span>
    );
  }

  return (
    <span
      className="ml-auto min-w-[18px] h-[18px] rounded-full
        bg-indigo-500
        flex items-center justify-center
        text-[10px] font-bold text-white leading-none px-1.5
        flex-shrink-0"
    >
      {label}
    </span>
  );
};

/* ─────────────────────────────────────────────
   NAV ITEM  (flat link)
   ───────────────────────────────────────────── */
const SidebarNavItem = ({
  item,
  isActive,
  isSublink,
  collapsed,
  onNavigate,
  unreadCount = 0,
}: {
  item: NavItem;
  isActive: boolean;
  isSublink?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  unreadCount?: number;
}) => {
  const Icon = item.icon;
  const showBadge = item.href === "/message" && unreadCount > 0;

  return (
    <Link
      href={item.href || "#"}
      onClick={onNavigate}
      title={collapsed ? item.name : undefined}
      className={[
        "flex items-center gap-2.5 rounded-md text-[13px] transition-all duration-150 no-underline",
        collapsed
          ? "justify-center p-2.5 relative"
          : isSublink
            ? "py-1.5 px-3 pl-7"
            : "py-1.5 px-2.5",
        "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
        "dark:text-white/50 dark:hover:text-white/80 dark:hover:bg-white/5",
        isActive
          ? "!bg-indigo-50 !text-indigo-600 font-medium dark:!bg-indigo-500/15 dark:!text-indigo-300 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-r before:bg-indigo-500 dark:before:bg-indigo-400"
          : "",
        "relative",
      ].join(" ")}
    >
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      {!collapsed && <span className="flex-1 truncate">{item.name}</span>}

      {/* Badge */}
      {showBadge && <UnreadBadge count={unreadCount} collapsed={collapsed} />}
    </Link>
  );
};

/* ─────────────────────────────────────────────
   NAV GROUP  (dropdown)
   ───────────────────────────────────────────── */
const SidebarNavGroup = ({
  item,
  collapsed,
  getSubAccess,
  onNavigate,
  onExpand,
  unreadCount = 0,
}: {
  item: NavItem;
  collapsed: boolean;
  getSubAccess: (s: NavItem) => boolean;
  onNavigate?: () => void;
  onExpand?: () => void;
  unreadCount?: number;
}) => {
  const pathname = usePathname();
  const subs = item.sublinks.filter(getSubAccess);
  const parentActive = subs.some((s) => pathname.startsWith(s.href));
  const [open, setOpen] = useState(parentActive);
  const Icon = item.icon;

  // Total unread for subs that include /message
  const groupHasMessage = subs.some((s) => s.href === "/message");

  useEffect(() => {
    if (parentActive) setOpen(true);
  }, [parentActive]);
  if (subs.length === 0) return null;

  const handleClick = () => {
    if (collapsed) {
      onExpand?.();
      setTimeout(() => setOpen(true), 80);
    } else {
      setOpen((v) => !v);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        title={collapsed ? item.name : undefined}
        className={[
          "flex items-center gap-2.5 w-full rounded-md text-[13px] transition-all duration-150 relative",
          collapsed ? "justify-center p-2.5" : "py-1.5 px-2.5",
          parentActive
            ? "bg-indigo-50 text-indigo-600 font-medium dark:bg-indigo-500/15 dark:text-indigo-300"
            : "text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-white/50 dark:hover:text-white/80 dark:hover:bg-white/5",
        ].join(" ")}
      >
        <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.name}</span>
            {/* Show aggregate badge on group header when collapsed OR when closed */}
            {groupHasMessage && !open && unreadCount > 0 && (
              <UnreadBadge count={unreadCount} />
            )}
            <ChevronDown
              className={`w-3 h-3 flex-shrink-0 opacity-40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
        {/* Collapsed dot badge on group button */}
        {collapsed && groupHasMessage && unreadCount > 0 && (
          <UnreadBadge count={unreadCount} collapsed />
        )}
      </button>

      {!collapsed && open && (
        <div className="mt-0.5 space-y-0.5">
          {subs.map((sub) => (
            <SidebarNavItem
              key={sub.name}
              item={sub}
              isActive={pathname === sub.href}
              isSublink
              onNavigate={onNavigate}
              unreadCount={sub.href === "/message" ? unreadCount : 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   USER POPUP MENU
   ───────────────────────────────────────────── */
const UserPopup = ({
  user,
  onSettings,
  onLogout,
  onClose,
}: {
  user: any;
  onSettings: () => void;
  onLogout: () => void;
  onClose: () => void;
}) => (
  <div
    className="absolute bottom-[calc(100%+4px)] left-2 right-2 z-60
    rounded-xl overflow-hidden
    bg-white border border-gray-200
    dark:bg-[#13132b] dark:border-white/10
    shadow-[0_-8px_24px_rgba(0,0,0,0.15)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.4)]"
  >
    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-white/[0.06]">
      <p className="text-xs font-medium text-gray-800 dark:text-white/85 truncate">
        {user?.displayName}
      </p>
      <p className="text-[10px] text-gray-400 dark:text-white/30 truncate">
        {user?.email}
      </p>
    </div>
    <button
      onClick={() => {
        onClose();
        onSettings();
      }}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs
        text-gray-500 hover:bg-gray-50
        dark:text-white/55 dark:hover:bg-white/5
        transition-colors"
    >
      <IoIosSettings size={13} /> Settings
    </button>
    <div className="mx-2 h-px bg-gray-100 dark:bg-white/[0.06]" />
    <button
      onClick={() => {
        onClose();
        onLogout();
      }}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs
        text-red-500 hover:bg-red-50
        dark:text-red-400 dark:hover:bg-red-500/8
        transition-colors"
    >
      <CiLogout size={13} /> Sign out
    </button>
  </div>
);

/* ─────────────────────────────────────────────
   SIDEBAR INNER CONTENT
   ───────────────────────────────────────────── */
const SidebarContent = ({
  collapsed,
  onToggleCollapse,
  onNavigate,
  onSettings,
  onLogout,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Global unread count for Message nav item
  const unreadCount = useMessageUnreadCount(user?.uid);

  const userRole: UserRole = user?.isAdmin ? "admin" : "standard";
  const allowedPages: string[] | null =
    userRole === "admin"
      ? null
      : user?.allowedPages == null
        ? []
        : user.allowedPages;

  const hasAccess = useCallback(
    (item: NavItem): boolean => {
      if (userRole !== "admin" && item.requiredRole === "admin") return false;
      if (allowedPages === null) return true;
      if (item.pagePermissionId === undefined) return false;
      return allowedPages.includes(item.pagePermissionId);
    },
    [userRole, allowedPages],
  );

  useEffect(() => {
    if (!userMenuOpen) return;
    const h = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      )
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [userMenuOpen]);

  const initials2 = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      {/* ── Logo row ── */}
      <button
        onClick={onToggleCollapse}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={[
          "flex items-center justify-center gap-2 w-full shrink-0",
          "px-3.5 py-4",
          "border-b border-gray-200 dark:border-white/[0.06]",
          "bg-transparent",
          onToggleCollapse ? "cursor-pointer" : "cursor-default",
          "hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors duration-150",
        ].join(" ")}
      >
        <Image src={Logo} alt={"Avexi"} width={36} />
        {!collapsed && (
          <>
            <Link
              href={"/dashboard"}
              className="flex-1 text-[15px] font-semibold tracking-[-0.04em] text-gray-900 dark:text-white/90"
            >
              Avexi
              <span className="text-indigo-500 dark:text-indigo-400">.</span>
            </Link>
            <span className="text-[9px] text-gray-300 dark:text-white/20 font-mono pr-0.5">
              ←
            </span>
          </>
        )}
      </button>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2.5 px-2 scrollbar-none">
        {collapsed ? (
          <div className="h-px bg-gray-200 dark:bg-white/[0.08] mx-2.5 my-1.5" />
        ) : (
          <p className="text-[10px] font-medium tracking-[0.07em] uppercase text-gray-400 dark:text-white/20 px-2.5 pt-1 pb-1">
            Workspace
          </p>
        )}

        <div className="space-y-0.5">
          {navItems.map((item) => {
            const direct = hasAccess(item);
            const anySub = item.sublinks.some((s) => hasAccess(s));
            if (!direct && !anySub) return null;

            if (item.sublinks.length > 0) {
              return (
                <SidebarNavGroup
                  key={item.name}
                  item={item}
                  collapsed={collapsed}
                  getSubAccess={hasAccess}
                  onNavigate={onNavigate}
                  onExpand={onToggleCollapse}
                  unreadCount={unreadCount}
                />
              );
            }

            return (
              <SidebarNavItem
                key={item.name}
                item={item}
                isActive={pathname === item.href}
                collapsed={collapsed}
                onNavigate={onNavigate}
                unreadCount={item.href === "/message" ? unreadCount : 0}
              />
            );
          })}
        </div>
      </nav>

      {/* ── Footer / user chip ── */}
      <div
        ref={userMenuRef}
        className="relative shrink-0 px-2 pt-2 pb-3 border-t border-gray-200 dark:border-white/[0.06]"
      >
        {userMenuOpen && !collapsed && (
          <UserPopup
            user={user}
            onSettings={onSettings}
            onLogout={onLogout}
            onClose={() => setUserMenuOpen(false)}
          />
        )}

        <button
          onClick={() => {
            if (collapsed) {
              onToggleCollapse?.();
              return;
            }
            setUserMenuOpen((v) => !v);
          }}
          className={[
            "flex items-center gap-2 w-full px-2 py-1.5 rounded-md",
            "hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-150",
            "overflow-hidden",
          ].join(" ")}
        >
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center
            text-[11px] font-semibold text-white overflow-hidden
            bg-gradient-to-br from-indigo-500 to-violet-600"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              initials2
            )}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-medium text-gray-800 dark:text-white/85 truncate">
                  {user?.displayName}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-white/30 capitalize">
                  {user?.isAdmin ? "Administrator" : "User"}
                </p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            </>
          )}
        </button>

        {!collapsed && (
          <p className="text-center mt-1.5 text-[10px] text-gray-300 dark:text-white/10 font-mono">
            Avexi v5.0.0
          </p>
        )}
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   MOBILE SLIDE DRAWER
   ───────────────────────────────────────────── */
const SlideDrawer = ({
  open,
  onClose,
  onSettings,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) => {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-[200] bg-black/40 dark:bg-black/60 backdrop-blur-sm",
          "transition-opacity duration-200",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      />
      <div
        className={[
          "fixed top-0 left-0 bottom-0 z-[201]",
          "w-[270px] flex flex-col",
          "bg-white dark:bg-[#0d0d1a]",
          "border-r border-gray-200 dark:border-white/[0.07]",
          "shadow-[8px_0_32px_rgba(0,0,0,0.12)] dark:shadow-[8px_0_32px_rgba(0,0,0,0.5)]",
          "transition-transform duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          <SidebarContent
            collapsed={false}
            onNavigate={onClose}
            onSettings={onSettings}
            onLogout={onLogout}
          />
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   BOTTOM TAB BAR  (< lg)
   ───────────────────────────────────────────── */
const BottomTabBar = ({ onMenuOpen }: { onMenuOpen: () => void }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const userRole: UserRole = user?.isAdmin ? "admin" : "standard";
  const allowedPages: string[] | null =
    userRole === "admin" ? null : (user?.allowedPages ?? []);
  const unreadCount = useMessageUnreadCount(user?.uid);

  const hasAccess = (item: NavItem): boolean => {
    if (userRole !== "admin" && item.requiredRole === "admin") return false;
    if (allowedPages === null) return true;
    if (!item.pagePermissionId) return false;
    return allowedPages.includes(item.pagePermissionId);
  };

  const tabItems = navItems.filter((i) => i.active && hasAccess(i)).slice(0, 3);

  const initials3 = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100]
        flex items-stretch h-[60px]
        bg-white dark:bg-[#0d0d1a]
        border-t border-gray-200 dark:border-white/[0.07]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Hamburger */}
      <button
        onClick={onMenuOpen}
        className="flex-1 flex flex-col items-center justify-center gap-0.5
          text-gray-400 hover:text-gray-700
          dark:text-white/45 dark:hover:text-white/70
          transition-colors"
      >
        <Menu className="w-[18px] h-[18px]" />
        <span className="text-[9px] font-medium tracking-[0.04em]">Menu</span>
      </button>

      {/* Quick links */}
      {tabItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        const isMsg = item.href === "/message";

        return (
          <Link
            key={item.name}
            href={item.href}
            className={[
              "flex-1 flex flex-col items-center justify-center gap-0.5 no-underline relative",
              active
                ? "text-indigo-600 dark:text-indigo-300"
                : "text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/70",
              "transition-colors",
            ].join(" ")}
          >
            {active && (
              <div className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-b bg-indigo-500 dark:bg-indigo-400" />
            )}
            <div className="relative">
              <Icon className="w-[18px] h-[18px]" />
              {/* Unread dot on message icon in bottom tab */}
              {isMsg && unreadCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full
                  bg-indigo-500 border border-white dark:border-[#0d0d1a]
                  flex items-center justify-center
                  text-[8px] font-bold text-white leading-none px-0.5"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span
              className={`text-[9px] tracking-[0.04em] max-w-[52px] truncate ${active ? "font-semibold" : "font-normal"}`}
            >
              {item.name}
            </span>
          </Link>
        );
      })}

      {/* Avatar → open drawer */}
      <button
        onClick={onMenuOpen}
        className="flex-1 flex flex-col items-center justify-center gap-0.5"
      >
        <div
          className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center
          text-[9px] font-semibold text-white
          bg-gradient-to-br from-indigo-500 to-violet-600"
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            initials3
          )}
        </div>
        <span className="text-[9px] text-gray-400 dark:text-white/40 tracking-[0.04em]">
          Profile
        </span>
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────
   ROOT EXPORT
   ───────────────────────────────────────────── */
const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <>
      {/* DESKTOP (lg+): persistent, collapsible */}
      <aside
        className="hidden lg:flex flex-col bg-white dark:bg-[var(--nexus-sidebar-bg)]
          border-r border-gray-200 dark:border-transparent"
        style={{
          width: collapsed ? 72 : 240,
          minWidth: collapsed ? 72 : 240,
          transition:
            "width 220ms cubic-bezier(0.4,0,0.2,1), min-width 220ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onSettings={() => setSettingsOpen(true)}
          onLogout={logout}
        />
      </aside>

      {/* MOBILE + TABLET (< lg): tab bar + drawer */}
      <div className="lg:hidden">
        <BottomTabBar onMenuOpen={() => setDrawerOpen(true)} />
      </div>

      <SlideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSettings={() => {
          setDrawerOpen(false);
          setSettingsOpen(true);
        }}
        onLogout={logout}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};

export default Sidebar;
