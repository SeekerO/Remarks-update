// src/app/admin/panel/component/UserAvatar.tsx

import React from 'react';
import Image from 'next/image';
import { UserCheck } from 'lucide-react';
import { UserProfile } from '../types/adminTypes'; // Assuming path to your types

/**
 * Props for the UserAvatar component.
 */
interface UserAvatarProps {
    user: Pick<UserProfile, 'displayName' | 'photoURL'>;
    isOnline: boolean;
    lastOnlineTimestamp: number | null;
    formatLastOnline: (timestamp: number) => string;
}

/**
 * A standalone component to display a user's profile picture and online status badge.
 * This enhances reusability and component isolation.
 *
 * @param {UserAvatarProps} props - The component props.
 */
const UserAvatar: React.FC<UserAvatarProps> = React.memo(({
    user,
    isOnline,
    lastOnlineTimestamp,
    formatLastOnline,
}) => {
    // Construct the tooltip title based on status
    const statusTitle = isOnline
        ? "Online"
        : lastOnlineTimestamp
            ? `Last seen: ${formatLastOnline(lastOnlineTimestamp)}`
            : "Offline";

    return (
        <div className="relative shrink-0">
            {user.photoURL ? (
                // Use Next/Image for optimized image display
                <Image
                    width={64}
                    height={64}
                    src={user.photoURL}
                    alt={`${user.displayName}'s profile`}
                    // Consistent size and border styling
                    className="w-16 h-16 rounded-full object-cover border-4 border-blue-500/50 dark:border-blue-400/50"
                // Add a loading placeholder or skeleton if needed
                />
            ) : (
                // Fallback avatar when no profile picture is available
                <div className="w-16 h-16 p-3 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xl text-gray-500 dark:text-gray-300">
                    <UserCheck size={32} />
                </div>
            )}

            {/* Online Status Badge */}
            <span
                title={statusTitle} // Tooltip for detailed status
                className={`absolute bottom-0 right-2 h-4 w-4 rounded-full ring-2 ring-white dark:ring-gray-800 ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
            />
        </div>
    );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;