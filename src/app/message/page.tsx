"use client";
// ─────────────────────────────────────────────────────────────────
//  Full-page Chat — src/app/message/page.tsx
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ref, onValue, get, update, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { useUserChats } from "./lib/hooks/useUserChats";
import { useChatMessages } from "./lib/hooks/useChatMessages";
import { createChat } from "@/lib/firebase/firebase.actions/createChat";
import { sendMessage } from "@/lib/firebase/firebase.actions/sendMessage";
import { deleteChat } from "@/lib/firebase/firebase.actions/deleteChat";
import { uploadFile } from "@/lib/firebase/firebase.actions/uploadFile";
import { editMessage } from "./lib/actions/messageActions";
import { setTyping } from "./lib/components/setTyping";
import { useNicknames } from "./lib/hooks/useNicknames";
import {
  setUserNickname,
  updateGroupName,
  addUsersToGroupChat,
  clearUnreadMessages,
} from "./lib/actions/chatActions";
import {
  NicknameModal,
  GroupNameModal,
  AddMembersModal,
} from "./lib/components/ChatModals";
import VideoCallModal from "./lib/components/voiceCallModal";
import { useWebRTC, type UseWebRTCReturn } from "./lib/hooks/useWebRTC";

import {
  Search,
  Plus,
  Users,
  MoreVertical,
  Trash2,
  Edit3,
  Send,
  Paperclip,
  ArrowLeft,
  Video,
  X,
  Check,
  CheckCheck,
  ChevronLeft,
  UserPlus,
  Phone,
  PhoneOff,
} from "lucide-react";
import { IoMdNotifications } from "react-icons/io";

// ─── Types ────────────────────────────────────────────────────────
interface UserDetail {
  name: string;
  photoURL: string | null;
  email?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: "text" | "file";
  timestamp: number;
  isEdited?: boolean;
  editedAt?: number;
}

interface UserProfile {
  uid: string;
  name: string;
  photoURL: string | null;
  email: string;
  canChat?: boolean;
}

interface ChatWithUnread {
  id: string;
  name: string | null;
  participants: Record<string, boolean>;
  unreadCount?: number;
  lastMessageTimestamp?: number;
  createdAt: number;
  isGroupChat?: boolean;
  lastMessageSenderName?: string;
  lastMessageContent?: string;
}

// ─── Avatar ───────────────────────────────────────────────────────
const Avatar = ({
  src,
  name,
  size = 36,
  online,
}: {
  src?: string | null;
  name: string;
  size?: number;
  online?: boolean;
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-indigo-500 to-violet-600"
          style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#0d0d1a] ${
            online ? "bg-emerald-400" : "bg-gray-600"
          }`}
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </div>
  );
};

// ─── Group Avatar (overlapping) ───────────────────────────────────
const GroupAvatar = ({ pics }: { pics: (string | null)[] }) => (
  <div className="relative flex-shrink-0" style={{ width: 44, height: 36 }}>
    {pics.slice(0, 2).map((pic, i) => (
      <div
        key={i}
        className="absolute"
        style={{
          left: i * 14,
          zIndex: 2 - i,
          transform: `rotate(${i === 0 ? "-6deg" : "6deg"})`,
        }}
      >
        <Avatar src={pic} name={`User ${i}`} size={28} />
      </div>
    ))}
  </div>
);

// ─── Typing dots ──────────────────────────────────────────────────
const TypingDots = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
      />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  CHAT LIST PANEL
// ═══════════════════════════════════════════════════════════════════
const ChatListPanel = ({
  currentUserId,
  isPermitted,
  selectedChatId,
  onSelectChat,
}: {
  currentUserId: string;
  isPermitted: boolean;
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
}) => {
  const { user } = useAuth();
  const rawChats = useUserChats(currentUserId);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [chatsWithUnread, setChatsWithUnread] = useState<ChatWithUnread[]>([]);
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    const unsub1 = onValue(ref(db, "users"), (snap) => {
      const data = snap.val() || {};
      setAllUsers(
        Object.keys(data)
          .filter(
            (uid) => uid !== currentUserId && (data[uid].isPermitted ?? true),
          )
          .map((uid) => ({
            uid,
            name: data[uid].name || data[uid].email,
            photoURL: data[uid].photoURL || null,
            email: data[uid].email,
          })),
      );
    });
    const unsub2 = onValue(ref(db, "presence"), (snap) => {
      const data = snap.val() || {};
      const map: Record<string, boolean> = {};
      for (const uid in data) map[uid] = data[uid]?.online === true;
      setOnlineUsers(map);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!user || rawChats.length === 0 || !isPermitted) {
      setChatsWithUnread([]);
      return;
    }
    const unsubs: (() => void)[] = [];
    const temp: Record<string, ChatWithUnread> = {};

    rawChats.forEach((chat) => {
      const metaRef = ref(db, `userChats/${user.uid}/${chat.id}`);
      const u1 = onValue(metaRef, (metaSnap) => {
        const lastReadId = metaSnap.val()?.lastReadMessageId || null;
        const msgsRef = ref(db, `chats/${chat.id}/messages`);
        const u2 = onValue(msgsRef, (msgsSnap) => {
          const data = msgsSnap.val();
          let unread = 0;
          let latestTs = chat.createdAt;
          let lastSenderId: string | undefined;
          let lastContent: string | undefined;

          if (data) {
            const list: ChatMessage[] = Object.keys(data).map((k) => ({
              id: k,
              ...data[k],
            }));
            list.sort((a, b) => a.timestamp - b.timestamp);
            const last = list[list.length - 1];
            latestTs = last.timestamp;
            lastSenderId = last.senderId;
            lastContent = last.content;
            unread = list.filter(
              (m) =>
                m.senderId !== user.uid && (!lastReadId || m.id > lastReadId),
            ).length;
          }

          const senderName = lastSenderId
            ? lastSenderId === user.uid
              ? "You"
              : allUsers.find((u) => u.uid === lastSenderId)?.name || "Unknown"
            : undefined;

          temp[chat.id] = {
            ...chat,
            unreadCount: unread,
            lastMessageTimestamp: latestTs,
            lastMessageSenderName: senderName,
            lastMessageContent: lastContent,
          };
          setChatsWithUnread(Object.values(temp));
        });
        unsubs.push(u2);
      });
      unsubs.push(u1);
    });
    return () => unsubs.forEach((u) => u());
  }, [user, rawChats, isPermitted, allUsers]);

  const getChatName = (chat: ChatWithUnread) => {
    if (chat.name) return chat.name;
    const ids = Object.keys(chat.participants || {});
    if (ids.length === 2) {
      const other = ids.find((id) => id !== user?.uid);
      return allUsers.find((u) => u.uid === other)?.name || "Direct Message";
    }
    const others = ids
      .filter((id) => id !== user?.uid)
      .map((id) => allUsers.find((u) => u.uid === id)?.name || "?")
      .join(", ");
    return others || "Group Chat";
  };

  const getChatPic = (chat: ChatWithUnread): string | null | string[] => {
    const ids = Object.keys(chat.participants || {});
    if (chat.isGroupChat || ids.length > 2) {
      return ids
        .filter((id) => id !== user?.uid)
        .map((id) => allUsers.find((u) => u.uid === id)?.photoURL || null)
        .filter(Boolean) as string[];
    }
    const other = ids.find((id) => id !== user?.uid);
    return allUsers.find((u) => u.uid === other)?.photoURL || null;
  };

  const getChatOnline = (chat: ChatWithUnread) => {
    const ids = Object.keys(chat.participants || {});
    if (ids.length === 2) {
      const other = ids.find((id) => id !== user?.uid);
      return other ? onlineUsers[other] === true : false;
    }
    return false;
  };

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateChat = async () => {
    if (!user || selectedUsers.length === 0 || createLoading) return;
    try {
      setCreateLoading(true);
      setCreateError(null);
      const id = await createChat(
        selectedUsers.length > 1 ? groupName.trim() || null : null,
        user.uid,
        selectedUsers,
      );
      setShowNewChat(false);
      setSelectedUsers([]);
      setGroupName("");
      setUserSearch("");
      setTimeout(() => onSelectChat(id), 300);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create conversation");
    } finally {
      setCreateLoading(false);
    }
  };

  const sorted = [...chatsWithUnread].sort(
    (a, b) =>
      (b.lastMessageTimestamp || b.createdAt) -
      (a.lastMessageTimestamp || a.createdAt),
  );

  const filtered = sorted.filter((c) =>
    getChatName(c).toLowerCase().includes(search.toLowerCase()),
  );

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a] border-r border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
        <div>
          <div className="font-semibold text-white/90 gap-[7px] flex h-fit relative">
            <h2 className="text-indigo-500/70 text-[11px] tracking-wider absolute top-0.5">
              BETA
            </h2>
            <h3 className="pl-7 text-2xl">Messages</h3>
          </div>
          <p className="text-[10px] text-white/30 mt-0.5">
            {sorted.length} conversations
          </p>
        </div>
        <button
          onClick={() => setShowNewChat((v) => !v)}
          className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/30 transition-colors"
        >
          {showNewChat ? (
            <X className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* New Chat Form */}
      {showNewChat && (
        <div className="px-3 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2">
            New Conversation
          </p>
          {selectedUsers.length > 1 && (
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name (optional)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-indigo-500/50 mb-2"
            />
          )}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25" />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 mb-2">
            {filteredUsers.map((u) => (
              <label
                key={u.uid}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(u.uid)}
                  onChange={() =>
                    setSelectedUsers((prev) =>
                      prev.includes(u.uid)
                        ? prev.filter((id) => id !== u.uid)
                        : [...prev, u.uid],
                    )
                  }
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                    selectedUsers.includes(u.uid)
                      ? "bg-indigo-500 border-indigo-500"
                      : "border-white/20"
                  }`}
                >
                  {selectedUsers.includes(u.uid) && (
                    <Check className="w-2.5 h-2.5 text-white" />
                  )}
                </div>
                <Avatar
                  src={u.photoURL}
                  name={u.name}
                  size={24}
                  online={onlineUsers[u.uid]}
                />
                <span className="text-xs text-white/70 truncate">{u.name}</span>
              </label>
            ))}
          </div>
          {createError && (
            <p className="text-[11px] text-red-400 mb-2">{createError}</p>
          )}
          <button
            onClick={handleCreateChat}
            disabled={selectedUsers.length === 0 || createLoading}
            className="w-full py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {createLoading ? (
              <>
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : selectedUsers.length > 1 ? (
              "Create Group"
            ) : (
              "Start Chat"
            )}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-white/[0.04]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-8 pr-3 py-2 text-xs text-white/70 placeholder-white/25 focus:outline-none focus:border-indigo-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-white/20" />
            </div>
            <p className="text-xs text-white/30">No conversations yet</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-3 text-[11px] text-indigo-400 hover:text-indigo-300"
            >
              Start one →
            </button>
          </div>
        )}

        {filtered.map((chat) => {
          const name = getChatName(chat);
          const pic = getChatPic(chat);
          const isGroup =
            chat.isGroupChat || Object.keys(chat.participants || {}).length > 2;
          const isOnline = getChatOnline(chat);
          const isActive = chat.id === selectedChatId;

          return (
            <button
              key={chat.id}
              onClick={() => {
                clearUnreadMessages(chat.id, currentUserId).catch(() => {});
                onSelectChat(chat.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all relative group ${
                isActive
                  ? "bg-indigo-500/15 border-r-2 border-indigo-400"
                  : "hover:bg-white/[0.03]"
              }`}
            >
              {isGroup ? (
                <GroupAvatar pics={Array.isArray(pic) ? pic : [pic]} />
              ) : (
                <Avatar
                  src={Array.isArray(pic) ? pic[0] : pic}
                  name={name}
                  size={38}
                  online={isOnline}
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`text-xs font-medium truncate ${isActive ? "text-white" : "text-white/80"}`}
                  >
                    {name}
                  </span>
                  {(chat.unreadCount ?? 0) > 0 && !isActive && (
                    <span className="flex items-center gap-0.5 bg-indigo-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1">
                      <IoMdNotifications className="w-2.5 h-2.5" />
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                {chat.lastMessageContent && (
                  <p className="text-[11px] text-white/35 truncate">
                    {chat.lastMessageSenderName && (
                      <span className="text-white/45">
                        {chat.lastMessageSenderName}:{" "}
                      </span>
                    )}
                    {chat.lastMessageContent}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  CHAT ROOM PANEL
// ═══════════════════════════════════════════════════════════════════
const ChatRoomPanel = ({
  chatId,
  isPermitted,
  onDeleted,
  onStartCall,
}: {
  chatId: string;
  isPermitted: boolean;
  onDeleted: () => void;
  onStartCall: (name: string, photo: string | null, chatId: string) => void;
}) => {
  const { user } = useAuth();
  const messages = useChatMessages(chatId);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, UserDetail>>(
    {},
  );
  const [usersInChat, setUsersInChat] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [chatName, setChatName] = useState<string | null>(null);
  const [userLastReads, setUserLastReads] = useState<
    Record<string, string | null>
  >({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const nicknames = useNicknames(chatId, user?.uid || "");
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const [groupNameModalOpen, setGroupNameModalOpen] = useState(false);
  const [groupNameLoading, setGroupNameLoading] = useState(false);
  const [groupNameError, setGroupNameError] = useState<string | null>(null);

  const handleSaveGroupName = async (name: string) => {
    if (!user) return;
    try {
      setGroupNameLoading(true);
      setGroupNameError(null);
      await updateGroupName(chatId, user.uid, name);
    } catch (err: any) {
      setGroupNameError(err.message || "Failed to update group name");
      throw err;
    } finally {
      setGroupNameLoading(false);
    }
  };

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [addMembersModalOpen, setAddMembersModalOpen] = useState(false);
  const [addMembersLoading, setAddMembersLoading] = useState(false);
  const [addMembersError, setAddMembersError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onValue(ref(db, "users"), (snap) => {
      const data = snap.val() || {};
      setAllUsers(
        Object.keys(data)
          .filter((uid) => uid !== user?.uid && (data[uid].isPermitted ?? true))
          .map((uid) => ({
            uid,
            name: data[uid].name || data[uid].email,
            photoURL: data[uid].photoURL || null,
            email: data[uid].email,
          })),
      );
    });
    return () => unsub();
  }, [user?.uid]);

  const handleAddMembers = async (userIds: string[]) => {
    if (!user) return;
    try {
      setAddMembersLoading(true);
      setAddMembersError(null);
      await addUsersToGroupChat(chatId, user.uid, userIds);
    } catch (err: any) {
      setAddMembersError(err.message || "Failed to add members");
      throw err;
    } finally {
      setAddMembersLoading(false);
    }
  };

  const handleSaveNickname = async (nickname: string) => {
    if (!user) return;
    const otherId = usersInChat.find((uid) => uid !== user.uid);
    if (!otherId) return;
    try {
      setNicknameLoading(true);
      setNicknameError(null);
      await setUserNickname(chatId, user.uid, otherId, nickname);
    } catch (err: any) {
      setNicknameError(err.message || "Failed to save nickname");
      throw err;
    } finally {
      setNicknameLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user || messages.length === 0 || !isPermitted) return;
    const last = messages[messages.length - 1];
    if (!last?.id) return;
    const readRef = ref(db, `userChats/${user.uid}/${chatId}`);
    get(readRef).then((snap) => {
      const currentId = snap.val()?.lastReadMessageId;
      if (!currentId || last.id > currentId) {
        update(readRef, {
          lastReadMessageId: last.id,
          lastReadAt: serverTimestamp(),
        });
      }
    });
  }, [messages, user, chatId, isPermitted]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchUser = useCallback(
    async (uid: string) => {
      if (userDetails[uid]) return userDetails[uid];
      try {
        const snap = await get(ref(db, `users/${uid}`));
        if (snap.exists()) {
          const d = snap.val();
          const detail: UserDetail = {
            name: d.name || d.email || uid,
            photoURL: d.photoURL || null,
          };
          setUserDetails((prev) => ({ ...prev, [uid]: detail }));
          return detail;
        }
      } catch {}
      const fallback: UserDetail = {
        name: `User ${uid.slice(0, 4)}`,
        photoURL: null,
      };
      setUserDetails((prev) => ({ ...prev, [uid]: fallback }));
      return fallback;
    },
    [userDetails],
  );

  useEffect(() => {
    if (!user) return;
    const chatUnsub = onValue(ref(db, `chats/${chatId}`), async (snap) => {
      const data = snap.val();
      if (!data?.users) return;
      setChatName(data.name || null);
      const uids: string[] = Object.keys(data.users);
      setUsersInChat(uids);
      await Promise.all(uids.map(fetchUser));

      const presenceUnsubs = uids.map((uid) =>
        onValue(ref(db, `presence/${uid}`), (ps) => {
          setOnlineUsers((prev) => ({
            ...prev,
            [uid]: ps.val()?.online === true,
          }));
        }),
      );

      const readUnsubs = uids.map((uid) =>
        onValue(ref(db, `userChats/${uid}/${chatId}/lastReadMessageId`), (rs) =>
          setUserLastReads((prev) => ({ ...prev, [uid]: rs.val() })),
        ),
      );
      return () => {
        presenceUnsubs.forEach((u) => u());
        readUnsubs.forEach((u) => u());
      };
    });

    const typingUnsub = onValue(ref(db, `chats/${chatId}/typing`), (snap) => {
      const data = snap.val() || {};
      setTypingUsers(
        Object.entries(data)
          .filter(([uid, v]) => v && uid !== user.uid)
          .map(([uid]) => uid),
      );
    });

    return () => {
      chatUnsub();
      typingUnsub();
    };
  }, [chatId, user, fetchUser]);

  useEffect(() => {
    messages.forEach((m) => {
      if (!userDetails[m.senderId]) fetchUser(m.senderId);
    });
  }, [messages, userDetails, fetchUser]);

  const handleSend = async () => {
    if (!input.trim() || !user || !isPermitted) return;
    await sendMessage(chatId, user.uid, input);
    setInput("");
    setTyping(chatId, user.uid, false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!user || !isPermitted) return;
    setTyping(chatId, user.uid, e.target.value.length > 0);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(
      setTimeout(() => setTyping(chatId, user.uid, false), 1500),
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !isPermitted) return;
    try {
      const url = await uploadFile(file, chatId);
      await sendMessage(chatId, user.uid, url, "file");
    } catch {}
    e.target.value = "";
  };

  const handleEditSave = async () => {
    if (!editingId || !editingContent.trim() || !user) return;
    await editMessage(chatId, editingId, editingContent, user.uid);
    setEditingId(null);
    setEditingContent("");
  };

  const handleDelete = async () => {
    if (!user) return;
    await deleteChat(chatId, user.uid);
    setConfirmDelete(false);
    onDeleted();
  };

  const hasBeenRead = (msgId: string) =>
    usersInChat.some((uid) => {
      if (uid === user?.uid) return false;
      const lastRead = userLastReads[uid];
      return lastRead && msgId <= lastRead;
    });

  const otherUserId = usersInChat.find((uid) => uid !== user?.uid);

  const headerName = () => {
    if (chatName) return chatName;
    if (usersInChat.length === 2 && otherUserId) {
      const nick = nicknames[otherUserId]?.nickname;
      return nick || userDetails[otherUserId]?.name || "…";
    }
    return `Group · ${usersInChat.length} members`;
  };

  const headerPic = () => {
    if (usersInChat.length === 2 && otherUserId)
      return userDetails[otherUserId]?.photoURL ?? null;
    return null;
  };

  const headerOnline = () => {
    if (usersInChat.length === 2 && otherUserId)
      return onlineUsers[otherUserId] ?? false;
    return false;
  };

  const isGroup = usersInChat.length > 2;

  return (
    <div className="flex flex-col h-full bg-[#0f0e17]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] bg-[#0d0d1a] flex-shrink-0">
        <Avatar
          src={headerPic()}
          name={headerName()}
          size={36}
          online={!isGroup ? headerOnline() : undefined}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-white/90 truncate">
              {headerName()}
            </p>
            {!isGroup && otherUserId && (
              <button
                onClick={() => setNicknameModalOpen(true)}
                className="flex-shrink-0 p-1 text-white/25 hover:text-white/60 transition-colors"
                title="Edit nickname"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
            {isGroup && (
              <button
                onClick={() => setGroupNameModalOpen(true)}
                className="flex-shrink-0 p-1 text-white/25 hover:text-white/60 transition-colors"
                title="Edit group name"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-white/30">
            {isGroup
              ? `${usersInChat.length} members`
              : headerOnline()
                ? "Online"
                : "Offline"}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* ── FIX: pass chatId to onStartCall so root knows which chat to call ── */}
          <button
            onClick={() => {
              const name = otherUserId
                ? nicknames[otherUserId]?.nickname ||
                  userDetails[otherUserId]?.name ||
                  "User"
                : "Group Call";
              const photo = otherUserId
                ? userDetails[otherUserId]?.photoURL || null
                : null;
              onStartCall(name, photo, chatId);
            }}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-[#13132b] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50">
                {isGroup && (
                  <button
                    onClick={() => {
                      setAddMembersModalOpen(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/[0.05] border-b border-white/[0.06] transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Add members
                  </button>
                )}
                <button
                  onClick={() => {
                    setConfirmDelete(true);
                    setShowMenu(false);
                  }}
                  disabled={!isPermitted}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-sm text-white/40">No messages yet</p>
            <p className="text-xs text-white/20 mt-1">
              Start the conversation!
            </p>
          </div>
        )}

        {messages.map((msg: ChatMessage, index) => {
          const sender = userDetails[msg.senderId];
          const isMe = msg.senderId === user?.uid;
          const isLast = index === messages.length - 1;
          const showAvatar =
            !isMe &&
            (index === 0 || messages[index - 1].senderId !== msg.senderId);
          const canEdit =
            isMe && Date.now() - msg.timestamp <= 2 * 60 * 1000 && isPermitted;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <div className="flex-shrink-0" style={{ width: 28 }}>
                  {showAvatar && (
                    <Avatar
                      src={sender?.photoURL}
                      name={sender?.name || "?"}
                      size={28}
                    />
                  )}
                </div>
              )}

              <div
                className={`flex flex-col max-w-[65%] ${isMe ? "items-end" : "items-start"}`}
              >
                {isGroup && !isMe && showAvatar && (
                  <p className="text-[10px] text-white/35 mb-1 px-1">
                    {sender?.name}
                  </p>
                )}

                {msg.id === editingId ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    <input
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                      className="bg-white/[0.08] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-indigo-500/50"
                      autoFocus
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 rounded-lg text-[10px] border border-white/[0.08] text-white/40 hover:text-white/70 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditSave}
                        className="px-2.5 py-1 rounded-lg text-[10px] bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-white/[0.07] text-white/85 rounded-bl-sm"
                      }`}
                    >
                      {msg.type === "file" ? (
                        <a
                          href={msg.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-blue-300 hover:underline"
                        >
                          <Paperclip className="w-3 h-3" />
                          {msg.content.split("/").pop() || "File"}
                        </a>
                      ) : (
                        <span>
                          {msg.content}
                          {msg.isEdited && (
                            <span className="text-[9px] opacity-50 ml-1">
                              (edited)
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditingId(msg.id);
                          setEditingContent(msg.content);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1c1b2e] border border-white/[0.1] flex items-center justify-center text-white/40 hover:text-white/80 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1 mt-1 px-0.5">
                  <span className="text-[9px] text-white/25">
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "…"}
                  </span>
                  {isMe &&
                    isLast &&
                    (hasBeenRead(msg.id) ? (
                      <CheckCheck className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <Check className="w-3 h-3 text-white/25" />
                    ))}
                </div>
              </div>

              {isMe && (
                <Avatar
                  src={userDetails[user.uid]?.photoURL}
                  name={userDetails[user.uid]?.name || "You"}
                  size={28}
                />
              )}
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex items-end gap-2.5">
            <Avatar
              src={userDetails[typingUsers[0]]?.photoURL}
              name={userDetails[typingUsers[0]]?.name || "?"}
              size={28}
            />
            <div className="bg-white/[0.07] rounded-2xl rounded-bl-sm">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3.5 border-t border-white/[0.06] bg-[#0d0d1a]">
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="file-up"
            className="hidden"
            onChange={handleFileChange}
            disabled={!isPermitted}
          />
          <label
            htmlFor="file-up"
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
              isPermitted
                ? "border-white/[0.08] text-white/40 hover:bg-white/[0.05] hover:text-white/70 cursor-pointer"
                : "border-white/[0.04] text-white/20 cursor-not-allowed"
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
          </label>

          <input
            value={input}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={
              isPermitted
                ? "Type a message…"
                : "You don't have permission to send messages"
            }
            disabled={!isPermitted}
            className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white/85 placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-40"
          />

          <button
            onClick={handleSend}
            disabled={!isPermitted || !input.trim()}
            className="w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 flex items-center justify-center text-white transition-colors flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Nickname Modal */}
      {!isGroup && otherUserId && (
        <NicknameModal
          isOpen={nicknameModalOpen}
          onClose={() => {
            setNicknameModalOpen(false);
            setNicknameError(null);
          }}
          targetUserName={userDetails[otherUserId]?.name || "this user"}
          currentNickname={nicknames[otherUserId]?.nickname || null}
          onSave={handleSaveNickname}
          loading={nicknameLoading}
          error={nicknameError}
        />
      )}

      {/* Group Name Modal */}
      {isGroup && (
        <GroupNameModal
          isOpen={groupNameModalOpen}
          onClose={() => {
            setGroupNameModalOpen(false);
            setGroupNameError(null);
          }}
          currentGroupName={chatName}
          onSave={handleSaveGroupName}
          loading={groupNameLoading}
          error={groupNameError}
        />
      )}

      {/* Add Members Modal */}
      {isGroup && (
        <AddMembersModal
          isOpen={addMembersModalOpen}
          onClose={() => {
            setAddMembersModalOpen(false);
            setAddMembersError(null);
          }}
          availableUsers={allUsers}
          currentMembers={Object.fromEntries(
            usersInChat.map((uid) => [uid, true]),
          )}
          onAdd={handleAddMembers}
          loading={addMembersLoading}
          error={addMembersError}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#13132b] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-white/85 mb-1.5">
              Delete conversation?
            </h3>
            <p className="text-xs text-white/40 leading-relaxed mb-5">
              This will permanently delete the chat and all messages. This
              action cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/50 text-xs hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  EMPTY STATE
// ═══════════════════════════════════════════════════════════════════
const EmptyState = ({ onNew }: { onNew: () => void }) => (
  <div className="flex flex-col items-center justify-center h-full bg-[#0f0e17] gap-4">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center"
      style={{
        background: "rgba(99,102,241,0.12)",
        border: "0.5px solid rgba(99,102,241,0.25)",
      }}
    >
      <Users className="w-7 h-7 text-indigo-400" />
    </div>
    <div className="text-center">
      <p className="text-sm font-medium text-white/60">Select a conversation</p>
      <p className="text-xs text-white/25 mt-1">or start a new one</p>
    </div>
    <button
      onClick={onNew}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-medium hover:bg-indigo-500/30 transition-colors"
    >
      <UserPlus className="w-3.5 h-3.5" />
      New conversation
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  ROOT PAGE
// ═══════════════════════════════════════════════════════════════════
export default function ChatPage() {
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "room">("list");

  // ── Call state (stable, not reactive) ────────────────────────────
  // The active call chatId is stored in a ref so the WebRTC hook never
  // reinitializes mid-call when other state changes (e.g. selectedChatId,
  // incomingChatId clearing after ringing→connected transition).
  const activeCallChatIdRef = useRef<string>("");
  const [activeCallChatId, setActiveCallChatId] = useState<string>("");

  const [callModalOpen, setCallModalOpen] = useState(false);
  const [calleeDisplayName, setCalleeDisplayName] = useState("User");
  const [calleeDisplayPhoto, setCalleeDisplayPhoto] = useState<string | null>(
    null,
  );
  const [currentUserName, setCurrentUserName] = useState("You");
  const [currentUserPhoto, setCurrentUserPhoto] = useState<string | null>(null);

  // Load current user details once
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onValue(ref(db, `users/${user.uid}`), (snap) => {
      const d = snap.val();
      if (d) {
        setCurrentUserName(d.name || d.email || "You");
        setCurrentUserPhoto(d.photoURL || null);
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // ── WebRTC hook — chatId only changes when a call starts/ends ────
  const webRTC = useWebRTC({
    currentUserId: user?.uid || "",
    currentUserName,
    currentUserPhoto,
  });

  
  // ── Detect incoming calls across all user chats ───────────────────
  const userChatsForCalls = useUserChats(user?.uid || "");

  useEffect(() => {
    if (!user?.uid || userChatsForCalls.length === 0) return;

    const unsubs = userChatsForCalls.map((chat) =>
      onValue(ref(db, `calls/${chat.id}`), (snap) => {
        const data = snap.val();

        // Someone is calling us on this chat
        if (
          data?.state === "ringing" &&
          data?.callerId !== user.uid &&
          // Only lock in if we're not already in a call
          activeCallChatIdRef.current === ""
        ) {
          activeCallChatIdRef.current = chat.id;
          setActiveCallChatId(chat.id);
          setCalleeDisplayName(data.callerName || "Unknown");
          setCalleeDisplayPhoto(data.callerPhoto || null);
        }

        // Call ended or removed — release the lock ONLY if this is the active call
        if (
          (!data || data.state === "ended") &&
          activeCallChatIdRef.current === chat.id
        ) {
          // Give the modal a moment to read the "ended" state before clearing
          setTimeout(() => {
            activeCallChatIdRef.current = "";
            setActiveCallChatId("");
            setCallModalOpen(false);
          }, 1500);
        }
      }),
    );

    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, userChatsForCalls.length]);

  // ── Sync modal open state with call state machine ─────────────────
  // IMPORTANT: only open on *active* call states; never close from here
  // (closing is handled explicitly via hangUp or the ended listener above).
  useEffect(() => {
    const activeStates = [
      "calling",
      "requesting-media",
      "connecting",
      "connected",
      "incoming",
    ];
    if (activeStates.includes(webRTC.callState)) {
      setCallModalOpen(true);
    }
  }, [webRTC.callState]);

  // ── Start an outgoing call ────────────────────────────────────────
  const handleStartCall = useCallback(
    (name: string, photo: string | null, chatId: string) => {
      if (
        activeCallChatIdRef.current !== "" &&
        activeCallChatIdRef.current !== chatId
      ) {
        // Already in a call on a different chat
        return;
      }
      setCalleeDisplayName(name);
      setCalleeDisplayPhoto(photo);
      activeCallChatIdRef.current = chatId;
      setActiveCallChatId(chatId);
      // webRTC.startCall is called by the ChatRoomPanel button after this
    },
    [],
  );

  // ── Handle hangup (cleans up both sides) ─────────────────────────
  const handleHangUp = useCallback(async () => {
    await webRTC.hangUp();
    activeCallChatIdRef.current = "";
    setActiveCallChatId("");
    setCallModalOpen(false);
  }, [webRTC]);

  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    setMobileView("room");
  };

  const handleDeleted = () => {
    setSelectedChatId(null);
    setMobileView("list");
  };

  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0f0e17]">
        <p className="text-xs text-white/30">Please log in to view messages.</p>
      </div>
    );
  }

  const isPermitted = user.isPermitted ?? false;

  return (
    <div className="flex h-full w-full bg-[#0f0e17] overflow-hidden">
      {/* ── Global VideoCallModal ─────────────────────────────────── */}
      <VideoCallModal
        isOpen={callModalOpen}
        onClose={handleHangUp}
        webRTC={webRTC}
        calleeName={webRTC.incomingCall?.callerName || calleeDisplayName}
        calleePhoto={webRTC.incomingCall?.callerPhoto || calleeDisplayPhoto}
      />

      {/* ── Incoming call overlay ─────────────────────────────────── */}
      {webRTC.callState === "incoming" && webRTC.incomingCall && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/80 backdrop-blur-xl">
          <div
            className="flex flex-col items-center gap-6 px-10 py-10 rounded-[28px]"
            style={{
              background: "linear-gradient(160deg,#0d0d1f 0%,#0a0a18 100%)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              boxShadow: "0 48px 96px rgba(0,0,0,0.85)",
              minWidth: 300,
            }}
          >
            {/* Pulse avatar */}
            <div className="relative flex items-center justify-center">
              <span
                className="absolute w-24 h-24 rounded-full border border-indigo-400/20 animate-ping"
                style={{ animationDuration: "1.8s" }}
              />
              <span
                className="absolute w-24 h-24 rounded-full border border-indigo-400/10 animate-ping"
                style={{ animationDuration: "1.8s", animationDelay: "0.6s" }}
              />
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl relative z-10"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                }}
              >
                {webRTC.incomingCall.callerName.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="text-center">
              <p className="text-white font-semibold text-lg tracking-tight">
                {webRTC.incomingCall.callerName}
              </p>
              <p className="text-white/40 text-xs mt-1">
                Incoming {webRTC.incomingCall.callType} call…
              </p>
            </div>

            <div className="flex items-center gap-6">
              {/* Decline */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleHangUp}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                  style={{ boxShadow: "0 4px 18px rgba(239,68,68,0.4)" }}
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
                <span className="text-[10px] text-white/35">Decline</span>
              </div>

              {/* Accept */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={async () => {
                    await webRTC.acceptCall();
                    setCallModalOpen(true);
                  }}
                  className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white transition-colors"
                  style={{ boxShadow: "0 4px 18px rgba(16,185,129,0.4)" }}
                >
                  <Phone className="w-5 h-5" />
                </button>
                <span className="text-[10px] text-white/35">Accept</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEFT: Chat list ───────────────────────────────────────── */}
      <div
        className={`flex-shrink-0 flex flex-col ${
          mobileView === "room" ? "hidden lg:flex" : "flex"
        }`}
        style={{ width: 280, minWidth: 280 }}
      >
        {!isPermitted ? (
          <div className="flex items-center justify-center h-full bg-[#0d0d1a] px-6 text-center">
            <p className="text-xs text-white/30 leading-relaxed">
              Your account doesn't have chat permission.
              <br />
              Contact an administrator.
            </p>
          </div>
        ) : (
          <ChatListPanel
            currentUserId={user.uid}
            isPermitted={isPermitted}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
          />
        )}
      </div>

      {/* ── RIGHT: Chat room or empty state ──────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          mobileView === "list" ? "hidden lg:flex" : "flex"
        }`}
      >
        {mobileView === "room" && selectedChatId && (
          <div className="lg:hidden flex items-center px-3 py-2 border-b border-white/[0.06] bg-[#0d0d1a]">
            <button
              onClick={() => {
                setMobileView("list");
                setSelectedChatId(null);
              }}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {selectedChatId ? (
          <ChatRoomPanel
            chatId={selectedChatId}
            isPermitted={isPermitted}
            onDeleted={handleDeleted}
            onStartCall={(name, photo, chatId) => {
              handleStartCall(name, photo, chatId);
              webRTC.startCall(chatId, "video");
            }}
          />
        ) : (
          <EmptyState onNew={() => {}} />
        )}
      </div>
    </div>
  );
}
