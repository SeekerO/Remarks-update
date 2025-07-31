// useUserChats.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { ref, onValue, get } from "firebase/database";
import { db } from "../firebase/firebase";

// Interface for a simplified chat object for the list
interface UserChat {
  id: string;
  name: string | null;
  participants: Record<string, boolean>;
  createdAt: number;
  isGroupChat?: boolean;
}

/**
 * Custom hook to fetch and listen for a user's chats from Firebase Realtime Database.
 * It fetches chat metadata (name, participants, creation time) for all chats the user is part of.
 * @param userId The UID of the current user.
 * @returns An array of UserChat objects.
 */
export const useUserChats = (userId: string) => {
  const [userChats, setUserChats] = useState<UserChat[]>([]);

  useEffect(() => {
    if (!userId) {
      setUserChats([]);
      return;
    }

    // Reference to the user's chats node
    const userChatsRef = ref(db, `userChats/${userId}`);

    // Listener for changes in the user's chat IDs
    const unsubscribe = onValue(userChatsRef, async (snapshot) => {
      const chatIdsData = snapshot.val();
      if (chatIdsData) {
        const chatIds = Object.keys(chatIdsData);
        const fetchedChats: UserChat[] = [];

        // Fetch details for each chat ID
        for (const chatId of chatIds) {
          const chatRef = ref(db, `chats/${chatId}`);
          const chatSnapshot = await get(chatRef); // Use get() to fetch once
          if (chatSnapshot.exists()) {
            const chatData = chatSnapshot.val();
            fetchedChats.push({
              id: chatId,
              name: chatData.name || null,
              participants: chatData.users || {},
              createdAt: chatData.createdAt || 0,
              isGroupChat: chatData.isGroupChat || false,
            });
          }
        }
        // Update state with the fetched chat details.
        // Sort by creation time, newest first.
        setUserChats(fetchedChats.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setUserChats([]); // No chats found for this user
      }
    });

    // Cleanup function to unsubscribe from the listener when the component unmounts or userId changes
    return () => unsubscribe();
  }, [userId]); // Re-run effect if userId changes

  return userChats;
};
