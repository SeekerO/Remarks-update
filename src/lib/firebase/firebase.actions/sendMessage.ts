// src/lib/firebase/firebase.actions/sendMessage.ts
import { db } from "../firebase";
import { ref, push, serverTimestamp } from "firebase/database";
import { encryptMessage } from "@/lib/util/crypto";

/**
 * Sends a new message to a specified chat.
 * The content is encrypted with AES-GCM before writing to Firebase.
 *
 * @param chatId   The ID of the chat.
 * @param senderId The UID of the sender.
 * @param content  Plaintext message content (or a file URL).
 * @param type     "text" | "file" — file URLs are also encrypted.
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  type: "text" | "file" = "text"
) {
  const messagesRef = ref(db, `chats/${chatId}/messages`);

  // Encrypt every content value before persisting
  const encryptedContent = await encryptMessage(content);

  await push(messagesRef, {
    senderId,
    content: encryptedContent,
    type,
    timestamp: serverTimestamp(),
    isEdited: false,
    editedAt: null,
  });
}