"use client";

import React from 'react';
import { Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion'; // 1. Import motion
import { UserCardProps } from '@/lib/types/adminTypes';
import UserAvatar from '@/lib/components/avatar';

const UserCard: React.FC<UserCardProps> = React.memo(({
    user,
    isOnline,
    lastOnlineTimestamp,
    currentUserId,
    formatLastOnline,
}) => (
    <motion.div
        layout // 2. Enable liquid layout animations
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        whileHover={{
            y: -5,
            scale: 1.02,
            transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-shadow duration-300 h-full flex flex-col cursor-pointer select-none"
    >
        {/* User Avatar and Info */}
        <div className="flex items-center space-x-4 mb-4">
            <UserAvatar
                user={user}
                isOnline={isOnline}
                lastOnlineTimestamp={lastOnlineTimestamp}
                formatLastOnline={formatLastOnline}
            />

            <div className="flex-grow min-w-0">
                <motion.h3
                    layout="position" // Ensures text doesn't jitter during card resize
                    className="font-bold text-lg text-gray-900 dark:text-white truncate"
                >
                    {user.name}
                </motion.h3>
                <motion.p
                    layout="position"
                    className="text-sm text-gray-500 dark:text-gray-400 truncate"
                >
                    {user.email}
                </motion.p>
            </div>
        </div>

        {/* Role Badge */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center justify-center w-full">
            {user.isAdmin ? (
                <div className={`${user.uid === currentUserId ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"} flex items-center gap-2 font-semibold`} >
                    <Shield className="w-4 h-4 " />
                    <span className="text-xs tracking-wider uppercase">
                        Admin
                    </span>
                </div>
            ) : (
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider uppercase">
                    User
                </span>
            )}
        </div>

        {/* Details Section */}
        <div className="space-y-3 flex-grow flex flex-col justify-end">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-blue-500" />
                    Status
                </span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight ${isOnline
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                    {isOnline
                        ? 'Online'
                        : lastOnlineTimestamp
                            ? formatLastOnline(lastOnlineTimestamp)
                            : 'Offline'
                    }
                </span>
            </div>
        </div>
    </motion.div>
), (prevProps, nextProps) => {
    return (
        prevProps.user === nextProps.user &&
        prevProps.isOnline === nextProps.isOnline &&
        prevProps.lastOnlineTimestamp === nextProps.lastOnlineTimestamp
    );
});

UserCard.displayName = 'UserCard';

export default UserCard;