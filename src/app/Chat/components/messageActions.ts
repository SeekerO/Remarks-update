// messageActions.ts
import { db } from "../firebase/firebase";
import { ref, update, get, serverTimestamp } from "firebase/database";

/**
 * Edits an existing message in a chat.
 * Includes validation for sender and a 2-minute editing window.
 * @param chatId The ID of the chat where the message is located.
 * @param messageId The ID of the message to edit.
 * @param newContent The new content for the message.
 * @param userId The UID of the user attempting to edit the message.
 * @throws Error if the message is not found, the user is not the sender,
 * or the 2-minute editing window has expired.
 */
export async function editMessage(
  chatId: string,
  messageId: string,
  newContent: string,
  userId: string
) {
  const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`);
  const snapshot = await get(messageRef); // Get the current message data

  if (!snapshot.exists()) {
    throw new Error("Message not found.");
  }

  const message = snapshot.val();

  // Basic server-side validation (Firebase Security Rules should also enforce this for robustness)
  if (message.senderId !== userId) {
    throw new Error("You can only edit your own messages.");
  }

  // Define the editing window (2 minutes in milliseconds)
  const twoMinutes = 2 * 60 * 1000;
  // Check if the current time is within 2 minutes of the message's original timestamp
  if (Date.now() - message.timestamp > twoMinutes) {
    throw new Error("Message can only be edited within 2 minutes of sending.");
  }

  // Update the message content, set isEdited flag, and record the editedAt timestamp
  await update(messageRef, {
    content: newContent,
    isEdited: true,
    editedAt: serverTimestamp(), // Use serverTimestamp for consistent time
  });
}
