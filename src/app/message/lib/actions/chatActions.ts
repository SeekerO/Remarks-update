// chatActions.ts
import { db } from "@/lib/firebase/firebase";
import { ref, update, get, serverTimestamp, set, push, remove } from "firebase/database";

/**
 * Sets a custom nickname for a user within a 1-on-1 chat.
 * The nickname is stored per-person (user1 can call user2 "Alex", user2 can call user1 "Bob")
 * @param chatId The ID of the 1-on-1 chat.
 * @param currentUserId The UID of the user setting the nickname.
 * @param targetUserId The UID of the user being nicknamed.
 * @param nickname The custom nickname to set.
 * @throws Error if chat is not found or if it's not a 1-on-1 chat.
 */
export async function setUserNickname(
    chatId: string,
    currentUserId: string,
    targetUserId: string,
    nickname: string
) {
    const chatRef = ref(db, `chats/${chatId}`);
    const snapshot = await get(chatRef);

    if (!snapshot.exists()) {
        throw new Error("Chat not found.");
    }

    const chat = snapshot.val();

    // Ensure this is a 1-on-1 chat
    if (chat.isGroupChat) {
        throw new Error("Nicknames can only be set in 1-on-1 chats.");
    }

    // Nickname storage path: chats/{chatId}/nicknames/{currentUserId}/{targetUserId}
    const nicknameRef = ref(db, `chats/${chatId}/nicknames/${currentUserId}/${targetUserId}`);
    await set(nicknameRef, {
        nickname: nickname.trim(),
        setAt: serverTimestamp(),
    });
}

/**
 * Retrieves the nickname that the current user set for another user.
 * @param chatId The ID of the 1-on-1 chat.
 * @param currentUserId The UID of the user who set the nickname.
 * @param targetUserId The UID of the user being nicknamed.
 * @returns The nickname object or null if not found.
 */
export async function getNickname(
    chatId: string,
    currentUserId: string,
    targetUserId: string
) {
    const nicknameRef = ref(db, `chats/${chatId}/nicknames/${currentUserId}/${targetUserId}`);
    const snapshot = await get(nicknameRef);
    return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Removes a custom nickname.
 * @param chatId The ID of the chat.
 * @param currentUserId The UID of the user removing the nickname.
 * @param targetUserId The UID of the user whose nickname is being removed.
 */
export async function removeNickname(
    chatId: string,
    currentUserId: string,
    targetUserId: string
) {
    const nicknameRef = ref(db, `chats/${chatId}/nicknames/${currentUserId}/${targetUserId}`);
    await set(nicknameRef, null);
}

/**
 * Updates the group chat name.
 * @param chatId The ID of the group chat.
 * @param currentUserId The UID of the user updating the name.
 * @param newGroupName The new name for the group.
 * @throws Error if chat is not found or if it's not a group chat.
 */
export async function updateGroupName(
    chatId: string,
    currentUserId: string,
    newGroupName: string
) {
    const chatRef = ref(db, `chats/${chatId}`);
    const snapshot = await get(chatRef);

    if (!snapshot.exists()) {
        throw new Error("Chat not found.");
    }

    const chat = snapshot.val();

    // Ensure this is a group chat
    if (!chat.isGroupChat) {
        throw new Error("Group name can only be updated for group chats.");
    }

    // Optional: Verify that the current user is part of the chat
    if (!chat.users || !chat.users[currentUserId]) {
        throw new Error("You are not a member of this group chat.");
    }

    // Update the group name and track who updated it
    await update(chatRef, {
        name: newGroupName.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId,
    });
}

/**
 * Adds one or more users to a group chat.
 * @param chatId The ID of the group chat.
 * @param currentUserId The UID of the user adding members.
 * @param userIdsToAdd Array of user UIDs to add to the group.
 * @throws Error if chat is not found, not a group chat, or if user is not a member.
 */
export async function addUsersToGroupChat(
    chatId: string,
    currentUserId: string,
    userIdsToAdd: string[]
) {
    const chatRef = ref(db, `chats/${chatId}`);
    const snapshot = await get(chatRef);

    if (!snapshot.exists()) {
        throw new Error("Chat not found.");
    }

    const chat = snapshot.val();

    // Ensure this is a group chat
    if (!chat.isGroupChat) {
        throw new Error("Users can only be added to group chats.");
    }

    // Verify that the current user is part of the chat
    if (!chat.users || !chat.users[currentUserId]) {
        throw new Error("You are not a member of this group chat.");
    }

    // Build update object for adding users
    const updateData: Record<string, boolean> = {};
    userIdsToAdd.forEach((uid) => {
        if (uid !== currentUserId && !chat.users[uid]) {
            updateData[`users/${uid}`] = true;
        }
    });

    if (Object.keys(updateData).length === 0) {
        throw new Error("No new users to add.");
    }

    // Update chat with new users
    await update(chatRef, updateData);

    // Also add the chatId to each user's userChats
    for (const uid of userIdsToAdd) {
        if (uid !== currentUserId && !chat.users[uid]) {
            const userChatsRef = ref(db, `userChats/${uid}/${chatId}`);
            await set(userChatsRef, true);
        }
    }

    // Log an event in the chat that users were added
    const newMessageRef = push(ref(db, `chats/${chatId}/messages`));
    await set(newMessageRef, {
        senderId: "SYSTEM",
        content: `${userIdsToAdd.length} new member(s) added by ${currentUserId}`,
        type: "text",
        timestamp: Date.now(),
        isSystemMessage: true,
    });
}

/**
 * Removes a user from a group chat.
 * @param chatId The ID of the group chat.
 * @param currentUserId The UID of the user performing the removal.
 * @param userIdToRemove The UID of the user to remove.
 * @throws Error if chat is not found, not a group chat, or if user is not authorized.
 */
export async function removeUserFromGroupChat(
    chatId: string,
    currentUserId: string,
    userIdToRemove: string
) {
    const chatRef = ref(db, `chats/${chatId}`);
    const snapshot = await get(chatRef);

    if (!snapshot.exists()) {
        throw new Error("Chat not found.");
    }

    const chat = snapshot.val();

    // Ensure this is a group chat
    if (!chat.isGroupChat) {
        throw new Error("Users can only be removed from group chats.");
    }

    // Verify that the current user is part of the chat
    if (!chat.users || !chat.users[currentUserId]) {
        throw new Error("You are not a member of this group chat.");
    }

    // Remove the user from the chat
    await remove(ref(db, `chats/${chatId}/users/${userIdToRemove}`));

    // Remove the chat from the user's userChats
    await set(ref(db, `userChats/${userIdToRemove}/${chatId}`), null);

    // Log an event in the chat
    const newMessageRef = push(ref(db, `chats/${chatId}/messages`));
    await set(newMessageRef, {
        senderId: "SYSTEM",
        content: `${userIdToRemove} was removed from the group by ${currentUserId}`,
        type: "text",
        timestamp: Date.now(),
        isSystemMessage: true,
    });
}

/**
 * Marks messages as read by the current user.
 * Stores read receipts at chats/{chatId}/messages/{messageId}/reads/{userId}
 * @param chatId The ID of the chat.
 * @param messageIds Array of message IDs to mark as read.
 * @param userId The UID of the user marking messages as read.
 */
export async function markMessagesAsRead(
    chatId: string,
    messageIds: string[],
    userId: string
) {
    const updates: Record<string, number> = {};

    messageIds.forEach((msgId) => {
        updates[`chats/${chatId}/messages/${msgId}/reads/${userId}`] = serverTimestamp() as any;
    });

    if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
    }
}

/**
 * Tracks unread message count for a user in a specific chat.
 * @param chatId The ID of the chat.
 * @param userId The UID of the user.
 * @param count The number of unread messages (set to 0 to clear).
 */
export async function setUnreadCount(
    chatId: string,
    userId: string,
    count: number
) {
    const unreadRef = ref(db, `userChats/${userId}/${chatId}/unreadCount`);
    if (count === 0) {
        await set(unreadRef, null);
    } else {
        await set(unreadRef, count);
    }
}

/**
 * Clears all unread messages for a user in a chat.
 * @param chatId The ID of the chat.
 * @param userId The UID of the user.
 */
export async function clearUnreadMessages(chatId: string, userId: string) {
    await setUnreadCount(chatId, userId, 0);
}

export async function blockCaller(userId: string, targetId: string): Promise<void> {
  await set(ref(db, `users/${userId}/blockedCallers/${targetId}`), true);
}

export async function unblockCaller(userId: string, targetId: string): Promise<void> {
  await remove(ref(db, `users/${userId}/blockedCallers/${targetId}`));
}

export async function isCallerBlocked(userId: string, targetId: string): Promise<boolean> {
  const snap = await get(ref(db, `users/${userId}/blockedCallers/${targetId}`));
  return snap.val() === true;
}