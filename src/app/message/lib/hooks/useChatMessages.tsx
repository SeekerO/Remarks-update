// src/app/message/lib/hooks/useChatMessages.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import { decryptMessage } from "@/lib/util/crypto";

interface ChatMessage {
  id: string;
  senderId: string;
  content: string; // already-decrypted value
  type: "text" | "file";
  timestamp: number;
  isEdited?: boolean;
  editedAt?: number;
  reads?: Record<string, number>;
}

/**
 * Subscribes to messages in `chatId`, decrypts each content field, and
 * returns them sorted by timestamp ascending.
 */
export const useChatMessages = (chatId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild("timestamp"));

    const unsubscribe = onValue(messagesQuery, async (snapshot) => {
      const raw = snapshot.val();
      if (!raw) {
        setMessages([]);
        return;
      }

      const entries: any[] = Object.keys(raw).map((key) => ({
        id: key,
        ...raw[key],
      }));

      // Decrypt all messages in parallel
      const decrypted: ChatMessage[] = await Promise.all(
        entries.map(async (msg) => ({
          ...msg,
          content: await decryptMessage(msg.content ?? ""),
        }))
      );

      decrypted.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(decrypted);
    });

    return () => unsubscribe();
  }, [chatId]);

  return messages;
};