// src/lib/auth/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase/firebase";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import {
  ref,
  set,
  onDisconnect,
  serverTimestamp,
  get,
  onValue,
} from "firebase/database";
import { saveUserProfile } from "./saveUserProfile";
import { useOfflineLogSync } from "@/lib/hooks/useOfflineLogSync";

export type UserRole = "editor" | "user" | "comelec";

interface CustomUser extends User {
  isAdmin?: boolean;
  isPermitted?: boolean;
  allowedPages?: string[];
  roles?: UserRole[];
  allowedPresets?: string[];
  subscriptionStartDate?: string;
  subscriptionDays?: number;
  subscriptionInfinite?: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  isLoading: boolean;
  isOnline: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  uid?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

function extractUserFields(userData: Record<string, any>) {
  const rawPresets = userData.allowedPresets;
  const allowedPresets: string[] | undefined =
    Array.isArray(rawPresets) && rawPresets[0] === "__none__"
      ? []
      : Array.isArray(rawPresets)
        ? rawPresets
        : undefined;

  const sub = userData.subscription || {};

  return {
    isAdmin: userData.isAdmin || false,
    isPermitted:
      userData.isPermitted !== undefined ? userData.isPermitted : true,
    allowedPages: userData.allowedPages,
    roles: Array.isArray(sub.roles) ? (sub.roles as UserRole[]) : [],
    allowedPresets,
    subscriptionStartDate: sub.subscriptionStartDate,
    subscriptionDays: sub.subscriptionDays,
    subscriptionInfinite:
      sub.subscriptionInfinite === true ||
      userData.subscriptionInfinite === true,
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  const userRef = useRef(user);
  userRef.current = user;

  useOfflineLogSync();

  useEffect(() => {
    let unsubscribePermissions: (() => void) | null = null;
    let unsubscribePresence: (() => void) | null = null;
    let isInitialLoad = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await saveUserProfile(currentUser);

        const token = await currentUser.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }).catch(() => {});

        const userProfileRef = ref(db, `users/${currentUser.uid}`);
        const snapshot = await get(userProfileRef);

        let fields = {
          isAdmin: false,
          isPermitted: false,
          allowedPages: undefined,
          roles: [],
          allowedPresets: undefined,
          subscriptionStartDate: undefined,
          subscriptionDays: undefined,
          subscriptionInfinite: false,
        };

        if (snapshot.exists()) {
          fields = extractUserFields(snapshot.val()) as any;
        }

        setUser({ ...currentUser, ...fields });
        setIsLoading(false);

        // ✅ Write presence as object { online, lastSeen }
        const presenceRef = ref(db, `presence/${currentUser.uid}`);
        const connectedRef = ref(db, ".info/connected");

        onValue(connectedRef, (snap) => {
          if (snap.val() === true) {
            set(presenceRef, { online: true, lastSeen: serverTimestamp() });
            onDisconnect(presenceRef).set({
              online: false,
              lastSeen: serverTimestamp(),
            });
          }
        });

        // ✅ Subscribe to own presence node and sync to isOnline state
        unsubscribePresence = onValue(presenceRef, (snap) => {
          if (snap.exists()) {
            setIsOnline(snap.val()?.online === true);
          } else {
            setIsOnline(false);
          }
        });

        // ✅ Subscribe to user profile changes
        unsubscribePermissions = onValue(userProfileRef, (snap) => {
          if (isInitialLoad) {
            isInitialLoad = false;
            return;
          }

          if (snap.exists()) {
            const next = extractUserFields(snap.val());

            setUser((prev) => {
              if (!prev) return null;

              // ✅ Fixed semicolon bug from original
              const hasChanged =
                prev.isAdmin !== next.isAdmin ||
                prev.isPermitted !== next.isPermitted ||
                prev.subscriptionInfinite !== next.subscriptionInfinite ||
                prev.subscriptionStartDate !== next.subscriptionStartDate ||
                prev.subscriptionDays !== next.subscriptionDays ||
                JSON.stringify(prev.allowedPages) !==
                  JSON.stringify(next.allowedPages) ||
                JSON.stringify(prev.roles) !== JSON.stringify(next.roles) ||
                JSON.stringify(prev.allowedPresets) !==
                  JSON.stringify(next.allowedPresets);

              if (!hasChanged) return prev;
              return { ...prev, ...next };
            });
          }
        });
      } else {
        if (unsubscribePermissions) unsubscribePermissions();
        if (unsubscribePresence) unsubscribePresence();
        setUser(null);
        setIsOnline(false);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribePermissions) unsubscribePermissions();
      if (unsubscribePresence) unsubscribePresence();
    };
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  };

  const logout = async () => {
    // ✅ Immediately mark offline + cancel onDisconnect before signing out
    if (auth.currentUser) {
      const presenceRef = ref(db, `presence/${auth.currentUser.uid}`);
      await onDisconnect(presenceRef).cancel();
      await set(presenceRef, { online: false, lastSeen: serverTimestamp() });
    }

    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isOnline, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};