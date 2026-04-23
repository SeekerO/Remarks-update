"use client";

// Drop this file at: src/app/component/MessageNotification.tsx
// Then add <MessageNotification /> inside ThemeWrapper (night_mode_wrapper.tsx),
// just before the closing </main> tag — it renders nothing when there's nothing to show.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ref, onValue, get } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface IncomingNotification {
  id: string;           // unique toast id
  chatId: string;
  chatName: string;
  senderName: string;
  senderPhoto: string | null;
  messagePreview: string;
  timestamp: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function truncate(str: string, max = 55) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Single Toast ───────────────────────────────────────────────────────────────

const Toast = ({
  notif,
  onDismiss,
  index,
}: {
  notif: IncomingNotification;
  onDismiss: (id: string) => void;
  index: number;
}) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // staggered entrance
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(t);
  }, [index]);

  // auto-dismiss after 5s
  useEffect(() => {
    timerRef.current = setTimeout(() => handleDismiss(), 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(notif.id), 320);
  }, [notif.id, onDismiss]);

  return (
    <div
      style={{
        transform: visible && !leaving ? "translateX(0)" : "translateX(calc(100% + 24px))",
        opacity: visible && !leaving ? 1 : 0,
        transition: leaving
          ? "transform 0.32s cubic-bezier(0.4,0,1,1), opacity 0.28s ease"
          : "transform 0.42s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
      }}
      className="relative w-[340px] overflow-hidden"
    >
      {/* progress bar */}
      <div
        className="absolute bottom-0 left-0 h-[2px] bg-indigo-400/60 rounded-full"
        style={{
          animation: "notif-progress 5s linear forwards",
        }}
      />

      <Link
        href="/message"
        onClick={handleDismiss}
        className="flex items-start gap-3 p-3.5 no-underline
          rounded-2xl border border-white/[0.08]
          bg-[#13132b]/95 backdrop-blur-xl
          shadow-[0_8px_32px_rgba(0,0,0,0.55),0_0_0_0.5px_rgba(255,255,255,0.06)]
          hover:bg-[#1a1a38]/95 hover:border-white/[0.12]
          transition-colors duration-150 group cursor-pointer"
      >
        {/* avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center
              text-[11px] font-bold text-white overflow-hidden
              bg-gradient-to-br from-indigo-500 to-violet-600"
          >
            {notif.senderPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={notif.senderPhoto}
                alt={notif.senderName}
                className="w-full h-full object-cover"
              />
            ) : (
              initials(notif.senderName)
            )}
          </div>
          {/* message icon badge */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full
              bg-indigo-500 border-2 border-[#13132b]
              flex items-center justify-center"
          >
            <MessageCircle className="w-2 h-2 text-white" />
          </div>
        </div>

        {/* content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[11px] font-semibold text-white/85 truncate">
              {notif.chatName}
            </p>
            <span className="text-[9px] text-white/25 whitespace-nowrap flex-shrink-0">
              now
            </span>
          </div>
          <p className="text-[10px] text-indigo-300/80 font-medium mb-0.5">
            {notif.senderName}
          </p>
          <p className="text-[11px] text-white/45 leading-relaxed">
            {truncate(notif.messagePreview)}
          </p>
        </div>

        {/* close */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDismiss();
          }}
          className="flex-shrink-0 p-1 -m-1 rounded-lg
            text-white/20 hover:text-white/60
            opacity-0 group-hover:opacity-100
            transition-all duration-150"
        >
          <X className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function MessageNotification() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<IncomingNotification[]>([]);

  // Track last known message IDs per chat to detect NEW ones
  const lastMessageIds = useRef<Record<string, string>>({});
  const isFirstLoad = useRef<Record<string, boolean>>({});
  const userDetailsCache = useRef<Record<string, { name: string; photo: string | null }>>({});

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const fetchUserDetail = useCallback(async (uid: string) => {
    if (userDetailsCache.current[uid]) return userDetailsCache.current[uid];
    try {
      const snap = await get(ref(db, `users/${uid}`));
      if (snap.exists()) {
        const d = snap.val();
        const detail = {
          name: d.displayName || d.name || d.email || uid,
          photo: d.photoURL || null,
        };
        userDetailsCache.current[uid] = detail;
        return detail;
      }
    } catch {}
    const fallback = { name: "Someone", photo: null };
    userDetailsCache.current[uid] = fallback;
    return fallback;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Watch userChats for the list of chat IDs
    const userChatsRef = ref(db, `userChats/${user.uid}`);
    const chatUnsubscribers: (() => void)[] = [];

    const userChatsUnsub = onValue(userChatsRef, (snap) => {
      const chatIds = snap.val() ? Object.keys(snap.val()) : [];

      // For each chat, watch its messages
      chatIds.forEach((chatId) => {
        if (chatUnsubscribers[chatId as any]) return; // already watching

        const messagesRef = ref(db, `chats/${chatId}/messages`);

        const msgUnsub = onValue(messagesRef, async (msgSnap) => {
          const data = msgSnap.val();
          if (!data) return;

          const messageList = Object.entries(data as Record<string, any>)
            .map(([k, v]) => ({ id: k, ...v }))
            .sort((a, b) => a.timestamp - b.timestamp);

          const latest = messageList[messageList.length - 1];
          if (!latest) return;

          // On first load for this chat, just record the latest ID — no toast
          if (!isFirstLoad.current[chatId]) {
            isFirstLoad.current[chatId] = true;
            lastMessageIds.current[chatId] = latest.id;
            return;
          }

          // If the latest message is the same as what we already know → skip
          if (lastMessageIds.current[chatId] === latest.id) return;

          // Update the cursor
          lastMessageIds.current[chatId] = latest.id;

          // Skip if:
          // - Message is from the current user
          // - User is currently viewing the message page
          // - System messages
          if (
            latest.senderId === user.uid ||
            pathname.startsWith("/message") ||
            latest.isSystemMessage
          ) {
            return;
          }

          // Fetch sender + chat name concurrently
          const [senderDetail, chatSnap] = await Promise.all([
            fetchUserDetail(latest.senderId),
            get(ref(db, `chats/${chatId}`)),
          ]);

          const chatData = chatSnap.val();
          let chatName = chatData?.name || "";

          if (!chatName) {
            const uids: string[] = chatData?.users ? Object.keys(chatData.users) : [];
            const otherId = uids.find((id) => id !== user.uid);
            if (otherId) {
              const other = await fetchUserDetail(otherId);
              chatName = other.name;
            } else {
              chatName = "Message";
            }
          }

          const preview =
            latest.type === "file"
              ? "📎 Sent a file"
              : latest.content || "New message";

          const newNotif: IncomingNotification = {
            id: `${chatId}-${latest.id}-${Date.now()}`,
            chatId,
            chatName,
            senderName: senderDetail.name,
            senderPhoto: senderDetail.photo,
            messagePreview: preview,
            timestamp: latest.timestamp || Date.now(),
          };

          setNotifications((prev) => {
            // Cap at 4 toasts
            const next = [newNotif, ...prev].slice(0, 4);
            return next;
          });
        });

        // Store unsub keyed by chatId (hack: use array index + record)
        (chatUnsubscribers as any)[chatId] = msgUnsub;
      });
    });

    return () => {
      userChatsUnsub();
      Object.values(chatUnsubscribers).forEach((fn) =>
        typeof fn === "function" && fn()
      );
    };
  }, [user, pathname, fetchUserDetail]);

  if (!user || notifications.length === 0) return null;

  return (
    <>
      {/* Keyframe for progress bar */}
      <style>{`
        @keyframes notif-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* Toast stack — upper right, above everything */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none"
        aria-live="polite"
        aria-label="New message notifications"
      >
        {notifications.map((n, i) => (
          <div key={n.id} className="pointer-events-auto">
            <Toast notif={n} onDismiss={dismiss} index={i} />
          </div>
        ))}
      </div>
    </>
  );
}