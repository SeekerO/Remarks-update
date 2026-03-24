/* eslint-disable @typescript-eslint/no-explicit-any */

import { ref, get, update, set } from "firebase/database";
import { db } from "@/lib/firebase/firebase";


export const saveUserProfile = async (user: any) => {
  const userRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(userRef);

  const userData = {
    displayName: user.displayName,
    email: user.email,
    lastLogin: new Date().toISOString(),
    photoURL: user.photoURL ?? null,
  };

  if (snapshot.exists()) {
    // Preserve admin-controlled fields like allowedPages and isAdmin
    const existingData = snapshot.val();

    await update(userRef, {
      ...userData,
      isAdmin: existingData.isAdmin ?? false,
      canChat: existingData.canChat ?? true,
      allowedPages: existingData.allowedPages ?? [],
    });
  } else {
    // Create a new profile only if it doesn’t exist
    await set(userRef, {
      ...userData,
      isAdmin: false,
      canChat: true,
      allowedPages: [], // empty default for new users
    });
  }
};
