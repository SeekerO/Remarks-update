"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import Image from "next/image";
import { Search, UserCheck, Users, Globe, MessageSquareOff, MessageSquareText, Shield, ShieldOff, Lock, Unlock } from "lucide-react";
import { AVAILABLE_PAGES, PageId } from "@/lib/types/availablePages";


interface UserProfile {
    uid: string;
    name: string;
    profilePic: string | null;
    email: string;
    isAdmin: boolean;
    canChat: boolean;
    allowedPages?: PageId[]; // Optional - undefined means "not configured yet"
}

interface AdminPanelProps {
    currentUserId: string;
}

// --- Reusable Components: UserCard ---

interface UserCardProps {
    user: UserProfile;
    isOnline: boolean;
    lastOnlineTimestamp: number | null;
    currentUserId: string;
    handleToggleCanChat: (userId: string, currentCanChatStatus: boolean) => Promise<void>;
    handleToggleAdmin: (userId: string, currentAdminStatus: boolean) => Promise<void>;
    handleOpenPermissions: (user: UserProfile) => void;
    formatLastOnline: (timestamp: number) => string;
}

const UserCard: React.FC<UserCardProps> = ({
    user,
    isOnline,
    lastOnlineTimestamp,
    currentUserId,
    handleToggleCanChat,
    handleToggleAdmin,
    handleOpenPermissions,
    formatLastOnline,
}) => (
    <div
        key={user.uid}
        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 shadow-lg flex flex-col hover:shadow-xl transition-all duration-300 h-full"
    >
        <div className="flex items-center space-x-4 mb-4">
            <div className="relative shrink-0">
                {user.profilePic ? (
                    <Image
                        width={64}
                        height={64}
                        src={user.profilePic}
                        alt={`${user.name}'s profile`}
                        className="w-16 h-16 rounded-full object-cover border-4 border-blue-500/50 dark:border-blue-400/50"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xl text-gray-500 dark:text-gray-300">
                        <UserCheck size={32} />
                    </div>
                )}
                <span
                    title={isOnline ? "Online" : lastOnlineTimestamp ? `Last seen: ${formatLastOnline(lastOnlineTimestamp)}` : "Offline"}
                    className={`absolute bottom-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white dark:ring-gray-800 ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
                />
            </div>
            <div className="flex-grow min-w-0">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                    {user.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center justify-center w-full">
            {user.isAdmin ?
                <span className="ml-2 text-xs font-semibold text-blue-600 dark:text-blue-400 rounded-full tracking-wider">
                    ADMIN
                </span>
                :
                <span className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-400 rounded-full tracking-wider">
                    USER
                </span>
            }
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
            UID: {user.uid.substring(0, 12)}...
        </div>

        <div className="space-y-3 flex-grow">
            {/* Chat Access Toggle */}
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    {user.canChat ? <MessageSquareText className="w-4 h-4 mr-2 text-green-500" /> : <MessageSquareOff className="w-4 h-4 mr-2 text-red-500" />}
                    Chat Access
                </span>

                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={user.canChat}
                        onChange={() => handleToggleCanChat(user.uid, user.canChat)}
                        disabled={user.uid === currentUserId}
                        className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-focus:ring-4 ${user.uid === currentUserId ? 'peer-focus:ring-yellow-300 dark:bg-yellow-800' : 'peer-focus:ring-blue-300 dark:bg-gray-700'} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${user.canChat ? 'peer-checked:bg-blue-600' : ''} ${user.uid === currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
            </div>

            {/* Admin Status Toggle */}
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    {user.isAdmin ? <Shield className="w-4 h-4 mr-2 text-red-600" /> : <ShieldOff className="w-4 h-4 mr-2 text-gray-500" />}
                    Admin Role
                </span>

                <button
                    onClick={() => handleToggleAdmin(user.uid, user.isAdmin)}
                    disabled={user.uid === currentUserId}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center shadow-sm 
                        ${user.isAdmin
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }
                        ${user.uid === currentUserId ? "opacity-50 cursor-not-allowed" : ""}`
                    }
                >
                    {user.isAdmin ? "Revoke" : "Promote"}
                </button>
            </div>

            {/* Page Permissions Button */}
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-purple-500" />
                    Page Access
                </span>

                <button
                    onClick={() => handleOpenPermissions(user)}
                    disabled={user.uid === currentUserId}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center shadow-sm bg-purple-500 text-white hover:bg-purple-600
                        ${user.uid === currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    Configure
                </button>
            </div>

            <div className="flex justify-between items-center mt-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-blue-500" />
                    Last Status
                </span>
                <span className={`text-sm font-semibold ${isOnline ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                    {isOnline
                        ? "Online"
                        : lastOnlineTimestamp
                            ? formatLastOnline(lastOnlineTimestamp)
                            : "Offline"}
                </span>
            </div>
        </div>

        {user.uid === currentUserId && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 text-center">
                (Cannot modify your own permissions)
            </p>
        )}
    </div>
);

// --- Page Permissions Modal Component ---

interface PermissionsModalProps {
    user: UserProfile;
    onClose: () => void;
    onSave: (userId: string, allowedPages: PageId[]) => Promise<void>;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({ user, onClose, onSave }) => {
    // FIXED: If allowedPages is undefined (never configured), default to ALL pages
    // This treats "not configured" as "full access" for backward compatibility
    const initialPages = user.allowedPages !== undefined
        ? user.allowedPages
        : AVAILABLE_PAGES.map(p => p.id); // Default to all pages if not configured

    const [selectedPages, setSelectedPages] = useState<PageId[]>(initialPages);
    const [isSaving, setIsSaving] = useState(false);

    // Group pages by category
    const groupedPages = AVAILABLE_PAGES.reduce((acc, page) => {
        if (!acc[page.category]) {
            acc[page.category] = [];
        }
        acc[page.category].push(page);
        return acc;
    }, {} as Record<string, typeof AVAILABLE_PAGES[number][]>);

    const togglePage = (pageId: PageId) => {
        setSelectedPages(prev =>
            prev.includes(pageId)
                ? prev.filter(id => id !== pageId)
                : [...prev, pageId]
        );
    };

    const selectAll = () => {
        setSelectedPages(AVAILABLE_PAGES.map(p => p.id));
    };

    const deselectAll = () => {
        setSelectedPages([]);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(user.uid, selectedPages);
            onClose();
        } catch (error) {
            console.error("Error saving permissions:", error);
            alert("Failed to save permissions. Check console for details.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 w-screen h-screen justify-center items-center flex backdrop-blur-sm bg-black/50 z-[999]">
            <div className="w-[600px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Lock className="w-6 h-6 mr-3 text-purple-500" />
                        Page Access Control
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Managing permissions for: <span className="font-semibold text-gray-700 dark:text-gray-300">{user.name}</span>
                    </p>
                    {/* Show notice if permissions were never configured */}
                    {user.allowedPages === undefined && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            {`       ℹ️ This user's permissions were never configured. All pages are currently accessible (default behavior).`}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Quick Actions */}
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={selectAll}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                            Select All
                        </button>
                        <button
                            onClick={deselectAll}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                            Deselect All
                        </button>
                    </div>

                    {/* Pages by Category */}
                    <div className="space-y-6">
                        {Object.entries(groupedPages).map(([category, pages]) => (
                            <div key={category}>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                    {category}
                                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                        ({pages.filter(p => selectedPages.includes(p.id)).length}/{pages.length})
                                    </span>
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {pages.map((page) => (
                                        <label
                                            key={page.id}
                                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedPages.includes(page.id)
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPages.includes(page.id)}
                                                onChange={() => togglePage(page.id)}
                                                className="form-checkbox h-5 w-5 text-purple-600 rounded border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {page.name}
                                            </span>
                                            {selectedPages.includes(page.id) && (
                                                <Unlock className="ml-auto w-4 h-4 text-purple-500" />
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Admin Notice */}
                    {user.isAdmin && (
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Note:</strong> This user is an Admin and will have access to all pages regardless of these settings.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center"
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Admin Panel Component ---

export default function AdminPanel({ currentUserId }: AdminPanelProps) {
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean | number>>({});
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showOnlineOnly, setShowOnlineOnly] = useState<boolean>(false);
    const [showCanChatOnly, setShowCanChatOnly] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserProfile | null>(null);

    useEffect(() => {
        const usersRef = ref(db, "users");
        const presenceRef = ref(db, "presence");

        let usersLoaded = false;
        let presenceLoaded = false;
        const updateLoading = () => {
            if (usersLoaded && presenceLoaded) {
                setIsLoading(false);
            }
        };

        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            if (usersData) {
                const usersList = Object.keys(usersData).map((uid) => ({
                    uid,
                    name: usersData[uid].name || usersData[uid].email || "Unnamed User",
                    profilePic: usersData[uid].profilePic || null,
                    email: usersData[uid].email || "No Email",
                    isAdmin: usersData[uid].isAdmin || false,
                    canChat: usersData[uid].canChat !== undefined ? usersData[uid].canChat : true,
                    // FIXED: Keep undefined if not set, don't convert to empty array
                    allowedPages: usersData[uid].allowedPages !== undefined
                        ? usersData[uid].allowedPages
                        : undefined,
                }));
                setAllUsers(usersList);
            } else {
                setAllUsers([]);
            }
            usersLoaded = true;
            updateLoading();
        });

        const unsubscribePresence = onValue(presenceRef, (snapshot) => {
            const presenceData = snapshot.val() || {};
            const statusMap: Record<string, boolean | number> = {};
            for (const uid in presenceData) {
                statusMap[uid] = presenceData[uid];
            }
            setOnlineUsers(statusMap);
            presenceLoaded = true;
            updateLoading();
        });

        return () => {
            unsubscribeUsers();
            unsubscribePresence();
        };
    }, []);

    const handleToggleAdmin = useCallback(
        async (userId: string, currentAdminStatus: boolean) => {
            if (userId === currentUserId) {
                alert("For security, you cannot modify your own Admin status.");
                return;
            }

            try {
                const userRef = ref(db, `users/${userId}`);
                await update(userRef, { isAdmin: !currentAdminStatus });
            } catch (error) {
                console.error("Error toggling Admin status:", error);
                alert("Failed to update user admin permission. Check console for details.");
            }
        },
        [currentUserId]
    );

    const handleToggleCanChat = useCallback(
        async (userId: string, currentCanChatStatus: boolean) => {
            if (userId === currentUserId) {
                alert("You cannot modify your own chat permission status.");
                return;
            }
            try {
                const userRef = ref(db, `users/${userId}`);
                await update(userRef, { canChat: !currentCanChatStatus });
            } catch (error) {
                console.error("Error toggling canChat status:", error);
                alert("Failed to update user chat permission. Check console for details.");
            }
        },
        [currentUserId]
    );

    const handleOpenPermissions = useCallback((user: UserProfile) => {
        setSelectedUserForPermissions(user);
    }, []);

    const handleSavePermissions = useCallback(async (userId: string, allowedPages: PageId[]) => {
        try {
            const userRef = ref(db, `users/${userId}`);
            await update(userRef, { allowedPages });
        } catch (error) {
            alert("Failed to update page permissions. Check console for details.");
        }
    }, []);

    const formatLastOnline = (timestamp: number) => {
        const date = new Date(timestamp);
        try {
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            }).format(date);
        } catch (e) {
            return date.toLocaleString();
        }
    };

    const filteredUsers = allUsers.filter((user) => {
        const isOnline = onlineUsers[user.uid] === true;
        const matchesSearchTerm = user.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOnlineStatus = showOnlineOnly ? isOnline : true;
        const matchesCanChatStatus = showCanChatOnly ? user.canChat === true : true;
        return matchesSearchTerm && matchesOnlineStatus && matchesCanChatStatus;
    });

    if (isLoading) {
        return (
            <div className="p-10 w-full h-full flex justify-center items-center dark:bg-gray-900 bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent dark:border-blue-400 dark:border-t-transparent"></div>
                <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Loading user data...</p>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 md:p-10 min-h-screen w-full dark:bg-gray-900 bg-gray-50 font-sans overflow-y-auto">
                <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center">
                        <Users className="w-8 h-8 mr-3 text-blue-600" />
                        User Management Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Control access and view status for all platform users.</p>
                </header>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md mb-8">
                    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center space-x-6">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 dark:border-gray-500 dark:bg-gray-700 focus:ring-blue-500"
                                    checked={showOnlineOnly}
                                    onChange={(e) => setShowOnlineOnly(e.target.checked)}
                                />
                                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">Online Only</span>
                            </label>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 dark:border-gray-500 dark:bg-gray-700 focus:ring-blue-500"
                                    checked={showCanChatOnly}
                                    onChange={(e) => setShowCanChatOnly(e.target.checked)}
                                />
                                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">Chat Enabled Only</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredUsers.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-inner">
                            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
                                {allUsers.length === 0
                                    ? "No users found in the database."
                                    : "No users match your current search and filter criteria."}
                            </p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => {
                            const isOnline = onlineUsers[user.uid] === true;
                            const lastOnlineTimestamp = typeof onlineUsers[user.uid] === 'number'
                                ? (onlineUsers[user.uid] as number)
                                : null;

                            return (
                                <UserCard
                                    key={user.uid}
                                    user={user}
                                    isOnline={isOnline}
                                    lastOnlineTimestamp={lastOnlineTimestamp}
                                    currentUserId={currentUserId}
                                    handleToggleCanChat={handleToggleCanChat}
                                    handleToggleAdmin={handleToggleAdmin}
                                    handleOpenPermissions={handleOpenPermissions}
                                    formatLastOnline={formatLastOnline}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {/* Permissions Modal */}
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