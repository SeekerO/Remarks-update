// src/app/admin/panel/hooks/useUserPresence.ts

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase/firebase"; // Assuming correct path to your Firebase db instance

// Define the type for the presence status map
// Key is UID (string), Value is boolean (online) or number (timestamp of last seen)
type PresenceStatusMap = Record<string, boolean | number>;

/**
 * Custom hook to subscribe to real-time user presence data from Firebase.
 * @returns {{
 * onlineUsers: PresenceStatusMap,
 * isPresenceLoading: boolean,
 * formatLastOnline: (timestamp: number | null) => string
 * }}
 */
export const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceStatusMap>({});
  const [isPresenceLoading, setIsPresenceLoading] = useState<boolean>(true);

  // Utility function (moved from page.tsx)
  const formatLastOnline = (timestamp: number | null): string => {
    if (timestamp === null) return "Offline";

    const date = new Date(timestamp);
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(date);
    } catch (e) {
      // Fallback for environment issues
      console.error("Intl.DateTimeFormat error:", e);
      return date.toLocaleString();
    }
  };

  useEffect(() => {
    const presenceRef = ref(db, "presence");
    let presenceLoaded = false;

    const unsubscribePresence = onValue(
      presenceRef,
      (snapshot) => {
        const presenceData = snapshot.val() || {};
        const statusMap: PresenceStatusMap = {};

        // Map the raw presence data (true for online, timestamp for offline)
        for (const uid in presenceData) {
          statusMap[uid] = presenceData[uid];
        }

        setOnlineUsers(statusMap);
        if (!presenceLoaded) {
          setIsPresenceLoading(false);
          presenceLoaded = true;
        }
      },
      (error) => {
        console.error("Firebase presence subscription error:", error);
        setIsPresenceLoading(false);
      }
    );

    // Cleanup subscription on component unmount
    return () => {
      unsubscribePresence();
    };
  }, []); // Empty dependency array ensures it runs only on mount/unmount

  return { onlineUsers, isPresenceLoading, formatLastOnline };
};
