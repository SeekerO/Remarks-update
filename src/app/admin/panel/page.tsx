// src/app/admin/panel/page.tsx
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useCallback } from "react";
import { ref, onValue, update } from "firebase/database";
import { Search, Users } from "lucide-react";

// Assuming your AuthContext and Firebase imports are correct
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/app/Chat/AuthContext"; // 🔑 CRITICAL FIX: Import useAuth
import { PageId, UserProfile } from "../lib/types"
import UserCard from "./component/UserCard";
import PermissionsModal from "./component/PermissionsModal";



// --- Main Admin Panel Component (The Page Default Export) ---

export default function AdminPanel() { // 🔑 FIXED: Removed custom props
    const { user } = useAuth(); // Fetch user from context
    // Now we have the current user's UID for the rest of the component's logic


    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean | number>>({});
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showOnlineOnly, setShowOnlineOnly] = useState<boolean>(false);
    const [showCanChatOnly, setShowCanChatOnly] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserProfile | null>(null);
    const currentUserId = user?.uid ?? '';

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
                    // Keeping it undefined allows the PermissionsModal to default to ALL pages 
                    // for older users who haven't had permissions configured yet.
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


    // All handler functions are correctly using useCallback with currentUserId as a dependency, 
    // which is stable after the initial fetch from useAuth.
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
            // This updates the 'allowedPages' field in the database
            await update(userRef, { allowedPages });
        } catch (error) {
            alert("Failed to update page permissions. Check console for details.");
        }
    }, []);


    // 🔑 Handle Loading and Unauthorized User
    if (!user) {
        // You might show a full-screen spinner or redirect
        return (
            <div className="p-10 w-full h-screen flex justify-center items-center dark:bg-gray-900 bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Authenticating...</p>
            </div>
        );
    }




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



