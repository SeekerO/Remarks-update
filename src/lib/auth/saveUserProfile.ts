// saveUserProfile.ts
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
    const existingData = snapshot.val();

    await update(userRef, {
      ...userData,
      isAdmin: existingData.isAdmin ?? false,
      isPermitted: existingData.isPermitted ?? false,
      allowCalls: existingData.allowCalls ?? true, 
      // CRITICAL: Preserve the nested subscription object
      subscription: existingData.subscription ?? {},
      allowedPages: existingData.allowedPages ?? [],
    });
  } else {
    // Default for new users
    await set(userRef, {
      ...userData,
      isAdmin: false,
      isPermitted: false,
        allowCalls: true,
      subscription: {
        subscriptionInfinite: false,
        subscriptionDays: 0, // or whatever default
        subscriptionStartDate: new Date().toISOString(),
        roles: [],
      },
      allowedPages: [],
    });
  }
};
