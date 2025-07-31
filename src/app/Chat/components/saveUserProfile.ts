// saveUserProfile.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "../firebase/firebase";
import { ref, set, get } from "firebase/database";

/**
 * Saves or updates a user's profile in the Firebase Realtime Database.
 * It fetches existing data to preserve custom properties like isAdmin and canChat.
 * @param user The Firebase User object.
 */
export async function saveUserProfile(user: any) {
  const userRef = ref(db, `users/${user.uid}`);

  // Fetch existing user data to preserve isAdmin and canChat if they exist
  const snapshot = await get(userRef);
  const existingData = snapshot.val() || {};

  // Set the user's profile data, preserving existing custom roles
  await set(userRef, {
    email: user.email,
    name: user.displayName,
    profilePic: user.photoURL, // Stores the profile picture URL from Google
    // Preserve existing isAdmin and canChat, or set defaults if not present
    isAdmin: existingData.isAdmin !== undefined ? existingData.isAdmin : false,
    canChat: existingData.canChat !== undefined ? existingData.canChat : true,
  });
}
