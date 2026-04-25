// src/app/message/lib/actions/messageActions.ts
import { db } from "@/lib/firebase/firebase";
import { ref, update, get, serverTimestamp } from "firebase/database";
import { encryptMessage } from "@/lib/util/crypto";

/**
 * Edits an existing message. New content is encrypted before persisting.
 * Enforces a 2-minute editing window and sender-only policy.
 */
export async function editMessage(
  chatId: string,
  messageId: string,
  newContent: string,
  userId: string
) {
  const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`);
  const snapshot = await get(messageRef);

  if (!snapshot.exists()) throw new Error("Message not found.");

  const message = snapshot.val();

  if (message.senderId !== userId)
    throw new Error("You can only edit your own messages.");

  const twoMinutes = 2 * 60 * 1000;
  if (Date.now() - message.timestamp > twoMinutes)
    throw new Error("Message can only be edited within 2 minutes of sending.");

  const encryptedContent = await encryptMessage(newContent);

  await update(messageRef, {
    content: encryptedContent,
    isEdited: true,
    editedAt: serverTimestamp(),
  });
}