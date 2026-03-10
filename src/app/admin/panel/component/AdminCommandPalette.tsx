"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, MessageSquare, Ban, UserPlus, Key, User, CheckCircle } from 'lucide-react';
import { UserProfile } from "@/lib/types/adminTypes";

interface PaletteProps {
    allUsers: UserProfile[];
    onlineUsers: Record<string, boolean | number>;
    onToggleAdmin: (uid: string, status: boolean) => void;
    onToggleChat: (uid: string, status: boolean) => void;
    onOpenPermissions: (user: UserProfile) => void;
    currentUserId: string;
    formatLastOnline: (timestamp: number) => string;
    onOpenChange?: (isOpen: boolean) => void;
}

export default function AdminCommandPalette({
    allUsers,
    onlineUsers,
    onToggleAdmin,
    onToggleChat,
    onOpenPermissions,
    currentUserId,
    formatLastOnline,
    onOpenChange
}: PaletteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [mode, setMode] = useState<'search' | 'actions'>('search');

    // Notify parent component when open state changes
    useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    // Open/close palette with Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(prev => {
                    const newState = !prev;
                    // Reset to search mode when opening
                    if (newState) {
                        setMode('search');
                        setSelectedUser(null);
                        setSearch("");
                    }
                    return newState;
                });
            }
            if (e.key === 'Escape') {
                if (mode === 'actions') {
                    // Go back to search mode
                    setMode('search');
                    setSelectedUser(null);
                } else {
                    setIsOpen(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mode]);

    const filteredUsers = useMemo(() => {
        if (!search) return allUsers;
        const searchLower = search.toLowerCase();
        return allUsers.filter(user =>
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.uid.toLowerCase().includes(searchLower)
        );
    }, [allUsers, search]);

    const handleUserSelect = (user: UserProfile) => {
        setSelectedUser(user);
        setMode('actions');
    };

    const isSelf = selectedUser?.uid === currentUserId;

    const actions = useMemo(() => {
        if (!selectedUser) return [];
        return [
            {
                id: 'chat',
                label: selectedUser.canChat ? 'Revoke Chat Access' : 'Grant Chat Access',
                icon: selectedUser.canChat ? Ban : MessageSquare,
                color: selectedUser.canChat ? 'text-red-500' : 'text-emerald-500',
                onExecute: () => onToggleChat(selectedUser.uid, selectedUser.canChat),
            },
            {
                id: 'admin',
                label: selectedUser.isAdmin ? 'Remove Admin Privileges' : 'Promote to Admin',
                icon: selectedUser.isAdmin ? Shield : UserPlus,
                color: 'text-amber-500',
                onExecute: () => onToggleAdmin(selectedUser.uid, selectedUser.isAdmin),
            },
            {
                id: 'pages',
                label: 'Edit Page Permissions',
                icon: Key,
                color: 'text-purple-500',
                onExecute: () => onOpenPermissions(selectedUser),
            },
        ];
    }, [selectedUser, onToggleChat, onToggleAdmin, onOpenPermissions]);

    const handleBack = () => {
        setMode('search');
        setSelectedUser(null);
    };

    // ─── Mobile swipe-up to open ───────────────────────────────────────────────
const touchStartY = useRef<number | null>(null);

useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (touchStartY.current === null) return;
        const deltaY = touchStartY.current - e.changedTouches[0].clientY;
// Swipe down ≥ 60px from the top 80px of the screen
const fromTop = touchStartY.current < 80;
if (fromTop && deltaY <= -60 && !isOpen) {
    setIsOpen(true);
    setMode('search');
    setSelectedUser(null);
    setSearch("");
}
touchStartY.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
    };
}, [isOpen]);

    return (
        <AnimatePresence>
            {!isOpen && (
    <motion.div
        className="fixed bottom-0 left-0 right-0 z-[999] flex flex-col items-center pb-3 pt-2 md:hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        aria-label="Swipe up to open command palette"
    >
        {/* Pill handle */}
        <div className="w-10 h-1.5 rounded-full bg-gray-400/50 dark:bg-gray-500/50 mb-1" />
        <p className="text-[10px] text-gray-400 dark:text-gray-500 tracking-wide select-none">
            swipe up to search
        </p>
    </motion.div>
)}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[1000] w-full h-full flex flex-col justify-center items-center">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed w-full max-w-2xl z-[1001] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center">
                            <Search className="w-5 h-5 text-gray-400 mr-3" />
                            {mode === 'search' ? (
                                <input
                                    autoFocus
                                    placeholder="Search users by name, email, or UID..."
                                    className="w-full bg-transparent outline-none dark:text-white placeholder:text-gray-400"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            ) : (
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Actions for: <span className="font-semibold text-gray-900 dark:text-white">{selectedUser?.name}</span>
                                    </span>
                                    <button
                                        onClick={handleBack}
                                        className="text-xs px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {mode === 'search' ? (
                                <div className="p-3">
                                    {filteredUsers.length === 0 ? (
                                        <div className="py-12 text-center text-gray-400 text-sm italic">
                                            No users found matching "{search}"
                                        </div>
                                    ) : (
                                        <>
                                            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                {filteredUsers.length} User{filteredUsers.length !== 1 ? 's' : ''}
                                            </div>
                                            <div className="space-y-1">
                                                {filteredUsers.map(user => {
                                                    const isOnline = onlineUsers[user.uid] === true;
                                                    const lastOnline = typeof onlineUsers[user.uid] === 'number'
                                                        ? onlineUsers[user.uid] as number
                                                        : null;

                                                    return (
                                                        <button
                                                            key={user.uid}
                                                            onClick={() => handleUserSelect(user)}
                                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                {/* Avatar */}
                                                                <div className="relative flex-shrink-0">
                                                                    {user.profilePic ? (
                                                                        <img
                                                                            src={user.profilePic}
                                                                            alt={user.name}
                                                                            className="w-10 h-10 rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                                                            <span className="text-white font-semibold text-sm">
                                                                                {user.name.charAt(0).toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {/* Online indicator */}
                                                                    {isOnline && (
                                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                                                                    )}
                                                                </div>

                                                                {/* User info */}
                                                                <div className="flex-1 min-w-0 text-left">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                                            {user.name}
                                                                        </p>
                                                                        {user.isAdmin && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-semibold">
                                                                                ADMIN
                                                                            </span>
                                                                        )}
                                                                        {user.uid === currentUserId && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded font-semibold">
                                                                                YOU
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                        {user.email}
                                                                    </p>
                                                                </div>

                                                                {/* Status */}
                                                                <div className="flex-shrink-0 text-right">
                                                                    {isOnline ? (
                                                                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                                                            Online
                                                                        </span>
                                                                    ) : lastOnline ? (
                                                                        <span className="text-xs text-gray-400">
                                                                            {formatLastOnline(lastOnline)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-400">
                                                                            Offline
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3">
                                    {/* Selected User Details */}
                                    {selectedUser && (
                                        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                {selectedUser.profilePic ? (
                                                    <img
                                                        src={selectedUser.profilePic}
                                                        alt={selectedUser.name}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                                        <span className="text-white font-semibold">
                                                            {selectedUser.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {selectedUser.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {selectedUser.email}
                                                    </p>
                                                    <div className="flex gap-2 mt-1">
                                                        {selectedUser.isAdmin && (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-semibold">
                                                                ADMIN
                                                            </span>
                                                        )}
                                                        {selectedUser.canChat && (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-semibold">
                                                                CHAT ENABLED
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        Available Actions
                                    </div>
                                    <div className="space-y-1">
                                        {actions.map(action => (
                                            <button
                                                key={action.id}
                                                disabled={isSelf}
                                                onClick={() => {
                                                    action.onExecute();
                                                    setIsOpen(false);
                                                    setMode('search');
                                                    setSelectedUser(null);
                                                }}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <action.icon size={20} className={action.color} />
                                                    <span className="text-sm font-semibold dark:text-gray-200">
                                                        {action.label}
                                                    </span>
                                                </div>
                                                <CheckCircle size={16} className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>

                                    {isSelf && (
                                        <p className="text-center text-xs text-amber-500 font-medium py-3 mt-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                            ⚠️ Cannot modify your own permissions
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer hint */}
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <p className="text-[10px] text-gray-400 text-center">
                                {mode === 'search'
                                    ? 'Select a user to manage their permissions • ESC to close'
                                    : 'ESC to go back • Enter to execute action'
                                }
                            </p>
                        </div>
                    </motion.div>

                </div>
            )}
        </AnimatePresence>
    );
}