// setTyping.ts
import { db } from "../firebase/firebase";
import { ref, set } from "firebase/database";

/**
 * Sets or clears a user's typing status for a specific chat.
 * @param chatId The ID of the chat.
 * @param userId The UID of the user whose typing status is being set.
 * @param isTyping A boolean indicating whether the user is currently typing (true) or not (false).
 */
export async function setTyping(
  chatId: string,
  userId: string,
  isTyping: boolean
) {
  // Reference to the user's typing status within the specific chat
  const typingRef = ref(db, `chats/${chatId}/typing/${userId}`);
  // Set the typing status. If isTyping is false, it will remove the entry or set it to false.
  await set(typingRef, isTyping);
}
