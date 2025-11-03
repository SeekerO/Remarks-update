// src/app/admin/panel/component/UserCard.tsx (MODIFIED)

import React from 'react';
// REMOVED: Image import is no longer needed here
import { Shield, ShieldOff, Globe, MessageSquareText, MessageSquareOff, Lock } from 'lucide-react';
import { UserCardProps } from '@/lib/types/adminTypes'; // Adjusted import path
import UserAvatar from '@/lib/components/avatar'; // 🔑 IMPORT THE NEW AVATAR COMPONENT

// The component function itself can remain the same
const UserCard: React.FC<UserCardProps> = React.memo(({
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
            {/* 🔑 REPLACE AVATAR LOGIC WITH THE NEW COMPONENT */}
            <UserAvatar
                user={user}
                isOnline={isOnline}
                lastOnlineTimestamp={lastOnlineTimestamp}
                formatLastOnline={formatLastOnline}
            />
            {/* 🔑 END REPLACEMENT */}

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
), (prevProps, nextProps) => {
    // Custom memoization remains to prevent re-renders unless data changes
    return (
        prevProps.user === nextProps.user &&
        prevProps.isOnline === nextProps.isOnline &&
        prevProps.lastOnlineTimestamp === nextProps.lastOnlineTimestamp
    );
});

UserCard.displayName = 'UserCard';

export default UserCard;