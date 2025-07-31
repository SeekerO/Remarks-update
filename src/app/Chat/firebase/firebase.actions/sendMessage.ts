// sendMessage.ts
import { db } from "../firebase";
import { ref, push, serverTimestamp } from "firebase/database";

/**
 * Sends a new message to a specified chat.
 * @param chatId The ID of the chat to send the message to.
 * @param senderId The UID of the user sending the message.
 * @param content The content of the message (text or file URL).
 * @param type The type of message ("text" or "file"). Defaults to "text".
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  type: "text" | "file" = "text" // Default type is "text"
) {
  // Reference to the messages collection within the specific chat
  const messagesRef = ref(db, `chats/${chatId}/messages`);

  // Push a new message object to the database, generating a unique ID
  await push(messagesRef, {
    senderId,
    content,
    type,
    timestamp: serverTimestamp(), // Use serverTimestamp for consistent time across clients
    isEdited: false, // Initialize message as not edited
    editedAt: null, // No edit timestamp initially
  });
}
