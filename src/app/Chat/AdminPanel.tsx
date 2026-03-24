"use client";

import { useState, useEffect, useCallback } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../lib/firebase/firebase";
import Image from "next/image";

// Interface for user profile data
interface UserProfile {
  uid: string;
  name: string;
  profilePic: string | null;
  email: string;
  isAdmin: boolean;
  canChat: boolean;
}

// Props for the AdminPanel component
interface AdminPanelProps {
  currentUserId: string; // The UID of the currently logged-in admin user
}

export default function AdminPanel({ currentUserId }: AdminPanelProps) {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  // onlineUsers now stores either 'true' or a timestamp (number)
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean | number>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showOnlineOnly, setShowOnlineOnly] = useState<boolean>(false);
  const [showCanChatOnly, setShowCanChatOnly] = useState<boolean>(false);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        const usersList = Object.keys(usersData).map((uid) => ({
          uid,
          name: usersData[uid].name || usersData[uid].email,
          profilePic: usersData[uid].profilePic || null,
          email: usersData[uid].email,
          isAdmin: usersData[uid].isAdmin || false,
          canChat:
            usersData[uid].canChat !== undefined
              ? usersData[uid].canChat
              : true,
        }));
        setAllUsers(usersList);
      } else {
        setAllUsers([]);
      }
    });

    const presenceRef = ref(db, "presence");
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      const statusMap: Record<string, boolean | number> = {}; // Updated type
      for (const uid in presenceData) {
        // Store 'true' for online, or the timestamp for offline
        statusMap[uid] = presenceData[uid];
      }
      setOnlineUsers(statusMap);
    });

    return () => {
      unsubscribeUsers();
      unsubscribePresence();
    };
  }, []);

  const handleToggleCanChat = useCallback(
    async (userId: string, currentCanChatStatus: boolean) => {
      try {
        const userRef = ref(db, `users/${userId}`);
        await update(userRef, { canChat: !currentCanChatStatus });
        console.log(
          `User ${userId} canChat status toggled to ${!currentCanChatStatus}`
        );
      } catch (error) {
        console.error("Error toggling canChat status:", error);
        alert("Failed to update user chat permission.");
      }
    },
    []
  );

  // Helper function to format timestamp
  const formatLastOnline = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(); // Formats date and time based on user's locale
  };

  // Filtered users based on search term and filter checkboxes
  const filteredUsers = allUsers.filter((user) => {
    const isOnline = onlineUsers[user.uid] === true;
    const matchesSearchTerm = user.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesOnlineStatus = showOnlineOnly
      ? isOnline
      : true; // Only show online if filter is true
    const matchesCanChatStatus = showCanChatOnly ? user.canChat === true : true;

    return matchesSearchTerm && matchesOnlineStatus && matchesCanChatStatus;
  });

  return (
    <div className="p-4 h-full overflow-y-auto dark:bg-gray-900 bg-white rounded-lg shadow-md font-sans">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3 dark:text-gray-50">
        Admin Panel - User Management
      </h2>

      <div className="mb-6 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <input
          type="text"
          placeholder="Search by name..."
          className="p-3 border border-gray-300 rounded-lg w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex items-center space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600 rounded "
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-200">Online Only</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600 rounded "
              checked={showCanChatOnly}
              onChange={(e) => setShowCanChatOnly(e.target.checked)}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-200">Can Chat Only</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredUsers.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 text-lg py-10">
            {allUsers.length === 0
              ? "No users found."
              : "No users match your search and filter criteria."}
          </p>
        ) : (
          filteredUsers.map((user) => {
            const isOnline = onlineUsers[user.uid] === true;
            const lastOnlineTimestamp = typeof onlineUsers[user.uid] === 'number'
              ? (onlineUsers[user.uid] as number)
              : null;

            return (
              <div
                key={user.uid}
                className="border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col items-center dark:bg-slate-700 bg-gray-50 hover:shadow-md transition-shadow duration-200"
              >
                {user.profilePic && (
                  <Image
                    width={80}
                    height={80}
                    src={user.profilePic}
                    alt={`${user.name}'s profile`}
                    className="w-20 h-20 rounded-full mb-3 object-cover border-2 border-blue-300"
                  />
                )}
                <h3 className="font-semibold text-xl text-gray-900 mb-1 dark:text-white">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 truncate max-w-full dark:text-gray-200">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-300 mb-3">
                  UID: {user.uid.substring(0, 8)}...
                </p>

                {/* Online Status Indicator & Last Online Time */}
                <div className="flex items-center mt-2">
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${isOnline ? "bg-green-500" : "bg-gray-400 dark:text-gray-200"
                      }`}
                  ></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {isOnline
                      ? "Online"
                      : lastOnlineTimestamp
                        ? <span className="italic text-gray-500 dark:text-gray-200">Last online: {formatLastOnline(lastOnlineTimestamp)}</span>
                        : "Offline"}
                  </span>
                </div>

                {/* Can Chat Toggle */}
                <div className="mt-4 flex items-center space-x-3">
                  <span className="text-base font-medium text-gray-800 dark:text-gray-50">
                    Can Chat:
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={user.canChat}
                      onChange={() => handleToggleCanChat(user.uid, user.canChat)}
                      disabled={user.uid === currentUserId}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  {user.uid === currentUserId && (
                    <span className="text-xs text-gray-500 ml-2 dark:text-gray-50">
                      (You cannot disable your own chat)
                    </span>
                  )}
                </div>

                {/* Admin Status */}
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-50">
                  Admin Status:{" "}
                  <span
                    className={`font-bold ${user.isAdmin ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {user.isAdmin ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}