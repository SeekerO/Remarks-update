import { ref, remove, get } from "firebase/database";
import { db } from "../firebase"; // Assuming firebase.ts exports `db`

export const deleteChat = async (chatId: string, currentUserId: string) => {
  if (!chatId || !currentUserId) {
    throw new Error(
      "Chat ID and current user ID are required to delete a chat."
    );
  }

  try {
    // 1. Get chat participants to delete from their userChats nodes
    const chatRef = ref(db, `chats/${chatId}`);
    const chatSnapshot = await get(chatRef);
    const chatData = chatSnapshot.val();

    if (!chatData) {
      console.warn(`Chat with ID ${chatId} not found.`);
      return; // Chat already doesn't exist, no action needed
    }

    const usersInChat: Record<string, boolean> = chatData.users || {}; // Assuming 'users' holds participant UIDs
    const participantUids = Object.keys(usersInChat);

    // Only allow deletion if the current user is a participant
    if (!participantUids.includes(currentUserId)) {
      throw new Error("You do not have permission to delete this chat.");
    }

    // 2. Remove chat entry from each user's userChats
    const deletePromises = participantUids.map(async (uid) => {
      const userChatRef = ref(db, `userChats/${uid}/${chatId}`);
      await remove(userChatRef);
      console.log(`Removed chat ${chatId} from user ${uid}'s userChats.`);
    });

    await Promise.all(deletePromises);

    // 3. Delete the chat itself from the 'chats' node (this will also delete all messages under it)
    await remove(chatRef);
    console.log(
      `Chat ${chatId} and its messages deleted successfully from 'chats' node.`
    );
  } catch (error) {
    console.error(`Error deleting chat ${chatId}:`, error);
    throw error; // Re-throw to be caught by the calling component
  }
};
