// useChatMessages.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { db } from '../firebase/firebase';

// Interface for a chat message
interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    type: "text" | "file";
    timestamp: number;
    isEdited?: boolean;
    editedAt?: number;
    reads?: Record<string, number>; // For granular read receipts (optional)
}

/**
 * Custom hook to fetch and listen for real-time updates to messages in a specific chat.
 * Messages are ordered by timestamp.
 * @param chatId The ID of the chat to fetch messages for.
 * @returns An array of ChatMessage objects.
 */
export const useChatMessages = (chatId: string) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            return;
        }

        // Reference to the messages node for the given chat
        const messagesRef = ref(db, `chats/${chatId}/messages`);

        // Create a query to order messages by timestamp and limit to a certain number (e.g., last 100)
        // orderByChild is used here. If you need to order by Firebase push keys (which are time-based),
        // you might omit orderByChild and just listen to the ref directly, then sort in client.
        // For simplicity and to avoid potential index issues with orderByChild on large datasets,
        // we'll fetch all and sort client-side if needed, but for 'messages' ordered by timestamp,
        // orderByChild is usually appropriate if an index is defined in rules.
        // For now, we assume a basic structure where push keys are sufficient or timestamps are indexed.
        // Let's use orderByChild('timestamp') for explicit ordering.
        const messagesQuery = query(messagesRef, orderByChild('timestamp'));

        // Listener for real-time updates to messages
        const unsubscribe = onValue(messagesQuery, (snapshot) => {
            const messagesData = snapshot.val();
            if (messagesData) {
                // Convert the messages data object into a sorted array of ChatMessage objects
                const loadedMessages: ChatMessage[] = Object.keys(messagesData)
                    .map(key => ({
                        id: key,
                        ...messagesData[key]
                    }))
                    // Ensure messages are sorted by timestamp in ascending order
                    .sort((a, b) => a.timestamp - b.timestamp);
                setMessages(loadedMessages);
            } else {
                setMessages([]); // No messages found in this chat
            }
        });

        // Cleanup function to unsubscribe from the listener when the component unmounts or chatId changes
        return () => unsubscribe();
    }, [chatId]); // Re-run effect if chatId changes

    return messages;
};

