// createChat.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from "../firebase";
import {
  push, // Used to generate a unique ID for a new chat
  ref, // Used to create a reference to a specific location in the database
  set, // Used to write data to a database reference
  update, // Used to update specific fields in a database reference
  get, // Used to read data once from a database reference
} from "firebase/database";

/**
 * Creates a new chat (either 1-on-1 or group).
 * For 1-on-1 chats, it checks if an existing chat between the two users already exists
 * to avoid creating duplicates.
 *
 * @param chatName The name of the chat (optional for 1-on-1 chats, required for group chats).
 * @param creatorId The UID of the user creating the chat.
 * @param userIds An array of UIDs of all users (excluding the creator, who will be added automatically).
 * @returns The ID of the newly created or existing chat.
 * @throws Error if no users are provided.
 */
export async function createChat(
  chatName: string | null, // Nullable for 1-on-1 chats where a name isn't explicitly given
  creatorId: string,
  userIds: string[]
): Promise<string> {
  // Ensure the creator is always included in the list of users and remove duplicates
  const allUserIds = Array.from(new Set([...userIds, creatorId]));

  if (allUserIds.length < 1) {
    throw new Error("A chat must have at least one user (the creator).");
  }

  // --- Handle 1-on-1 chat creation ---
  // If there are exactly two users, check for an existing 1-on-1 chat
  if (allUserIds.length === 2) {
    // Sort user IDs to ensure a consistent lookup order (e.g., ["userA", "userB"] vs ["userB", "userA"])
    const [user1, user2] = allUserIds.sort();

    let existingChatId: string | null = null;

    // 1. Get all chat IDs that user1 is a part of from the 'userChats' node
    const user1ChatsRef = ref(db, `userChats/${user1}`);
    const user1ChatsSnapshot = await get(user1ChatsRef);
    const user1ChatIds = user1ChatsSnapshot.val()
      ? Object.keys(user1ChatsSnapshot.val())
      : [];

    // 2. Iterate through user1's chats to find if user2 is also a user AND it's a 1-on-1 chat
    for (const chatId of user1ChatIds) {
      const chatRef = ref(db, `chats/${chatId}`);
      const chatSnapshot = await get(chatRef);
      if (chatSnapshot.exists()) {
        const chat = chatSnapshot.val();
        // Check if user2 is also a user and if the chat has exactly two users
        if (
          chat.users && // Changed from chat.participants
          chat.users[user2] && // Changed from chat.participants[user2]
          Object.keys(chat.users).length === 2 // Changed from chat.participants
        ) {
          existingChatId = chatId; // Found the existing 1-on-1 chat
          break; // No need to check further
        }
      }
    }

    if (existingChatId) {
      console.log(`Existing 1-on-1 chat found: ${existingChatId}`);
      return existingChatId; // Return the ID of the existing chat
    }
  }

  // --- Logic for creating a new chat (applies to both new 1-on-1 and group chats) ---

  // Generate a unique key for the new chat using push()
  const newChatRef = push(ref(db, "chats"));
  const chatId = newChatRef.key!; // Get the unique ID for the new chat

  // Create a users object where keys are UIDs and values are 'true'
  const users = Object.fromEntries(
    // Changed from participants
    allUserIds.map((id) => [id, true])
  );

  // Set the initial data for the new chat
  await set(newChatRef, {
    name: chatName, // Will be null for 1-on-1 chats if not provided
    createdBy: creatorId,
    users, // Changed from participants
    createdAt: Date.now(), // Timestamp of chat creation
    // Determine if it's a group chat: more than 2 users OR an explicit name was provided
    isGroupChat: allUserIds.length > 2 || chatName !== null,
  });

  // Update the 'userChats' node for each user to link them to this new chat
  const updates: Record<string, any> = {};
  for (const id of allUserIds) {
    // Changed from allParticipantIds
    updates[`userChats/${id}/${chatId}`] = true; // Link user to chat
  }
  // Perform a multi-path update to efficiently update all userChats nodes
  await update(ref(db), updates);

  return chatId; // Return the ID of the newly created chat
}
