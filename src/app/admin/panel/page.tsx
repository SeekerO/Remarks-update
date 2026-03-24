"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useCallback } from "react";
import { ref, onValue, update } from "firebase/database";
import { Search, Users, Command } from "lucide-react";

import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { PageId, UserProfile } from "@/lib/types/adminTypes";
import UserCard from "./component/UserCard";
import PermissionsModal from "./component/PermissionsModal";
import AdminCommandPalette from "./component/AdminCommandPalette";
import { useUserPresence } from "@/lib/hooks/useUserPresence";

export default function AdminPanel() {
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showOnlineOnly, setShowOnlineOnly] = useState<boolean>(false);
    const [showCanChatOnly, setShowCanChatOnly] = useState<boolean>(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserProfile | null>(null);

    const currentUserId = user?.uid ?? '';
    const { onlineUsers, isPresenceLoading, formatLastOnline } = useUserPresence();
    const isLoading = isLoadingUsers || isPresenceLoading;

    useEffect(() => {
        const usersRef = ref(db, "users");
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            if (usersData) {
                const usersList = Object.keys(usersData).map((uid) => ({
                    uid,
                    photoURL: usersData[uid].photoURL || null,
                    displayName: usersData[uid].displayName || "Unmaed user",
                    email: usersData[uid].email || "No Email",
                    isAdmin: usersData[uid].isAdmin || false,
                    canChat: usersData[uid].canChat !== undefined ? usersData[uid].canChat : true,
                    allowedPages: usersData[uid].allowedPages || undefined,
                }));
                setAllUsers(usersList);
            } else {
                setAllUsers([]);
            }
            setIsLoadingUsers(false);
        });
        return () => unsubscribeUsers();
    }, []);

    const handleToggleAdmin = useCallback(async (userId: string, currentAdminStatus: boolean) => {
        if (userId === currentUserId) return alert("You cannot modify your own Admin status.");
        try {
            await update(ref(db, `users/${userId}`), { isAdmin: !currentAdminStatus });
        } catch (error) {
            console.error("Admin Update Error:", error);
        }
    }, [currentUserId]);

    const handleToggleCanChat = useCallback(async (userId: string, currentCanChatStatus: boolean) => {
        if (userId === currentUserId) return alert("You cannot modify your own chat status.");
        try {
            await update(ref(db, `users/${userId}`), { canChat: !currentCanChatStatus });
        } catch (error) {
            console.error("Chat Update Error:", error);
        }
    }, [currentUserId]);

    const handleOpenPermissions = useCallback((user: UserProfile) => {
        setSelectedUserForPermissions(user);
    }, []);

    const handleSavePermissions = useCallback(async (userId: string, allowedPages: PageId[]) => {
        try {
            await update(ref(db, `users/${userId}`), { allowedPages });
        } catch (error) {
            alert("Failed to update page permissions.");
        }
    }, []);

    if (!user) return <div className="h-screen w-screen flex items-center justify-center dark:bg-gray-900 bg-gray-50"><p>Authenticating...</p></div>;

    const filteredUsers = allUsers.filter((u) => {
        const isOnline = onlineUsers[u.uid] === true;
        const matchesSearch = u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOnline = showOnlineOnly ? isOnline : true;
        const matchesChat = showCanChatOnly ? u.canChat === true : true;
        return matchesSearch && matchesOnline && matchesChat;
    });

    if (isLoading) return <div className="h-screen w-screen flex items-center justify-center dark:bg-gray-900 bg-gray-50"><p>Loading User Data...</p></div>;

    return (
        <>
            {/* The Enhanced Command Palette */}
            <AdminCommandPalette
                allUsers={allUsers}
                onlineUsers={onlineUsers}
                onToggleAdmin={handleToggleAdmin}
                onToggleChat={handleToggleCanChat}
                onOpenPermissions={handleOpenPermissions}
                currentUserId={currentUserId}
                formatLastOnline={formatLastOnline}
            />

            <div className="p-6 md:p-10 min-h-screen w-full bg-gray-50 dark:bg-[#0f0e17]   font-sans overflow-y-auto">
                <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center">
                            <Users className="w-8 h-8 mr-3 text-blue-600" />
                            User Management
                        </h1>
                    </div>
                    {/* Desktop shortcut hint */}
                    <p className="hidden md:block text-xs text-gray-400 dark:text-gray-500 font-mono">
                        Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">⌘K</kbd> to quick-search
                    </p>
                </header>

                {/* Filter Section */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md mb-8 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg w-full focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* <div className="flex items-center space-x-6">
                            <label className="flex items-center cursor-pointer text-sm text-gray-700 dark:text-gray-200">
                                <input type="checkbox" className="mr-2" checked={showOnlineOnly} onChange={(e) => setShowOnlineOnly(e.target.checked)} />
                                Online Only
                            </label>
                            <label className="flex items-center cursor-pointer text-sm text-gray-700 dark:text-gray-200">
                                <input type="checkbox" className="mr-2" checked={showCanChatOnly} onChange={(e) => setShowCanChatOnly(e.target.checked)} />
                                Chat Enabled
                            </label>
                        </div> */}
                    </div>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {filteredUsers.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-inner text-gray-500">
                            No users match your criteria.
                        </div>
                    ) : (
                        filteredUsers.map((u) => (
                            <div
                                key={u.uid}
                                className="h-full"
                            >
                                <UserCard
                                    user={u}
                                    isOnline={onlineUsers[u.uid] === true}
                                    lastOnlineTimestamp={typeof onlineUsers[u.uid] === 'number' ? onlineUsers[u.uid] as number : null}
                                    currentUserId={currentUserId}
                                    handleToggleCanChat={handleToggleCanChat}
                                    handleToggleAdmin={handleToggleAdmin}
                                    handleOpenPermissions={handleOpenPermissions}
                                    formatLastOnline={formatLastOnline}
                                />
                            </div>
                        ))
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