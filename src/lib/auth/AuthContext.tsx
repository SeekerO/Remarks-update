// AuthContext.tsx
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
  // Subscription fields
  subscriptionStartDate?: string;
  subscriptionDays?: number;
  subscriptionInfinite?: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  isLoading: boolean;
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

  // Direct fix for your database structure
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
    // Checks both nested and root for safety
    subscriptionInfinite:
      sub.subscriptionInfinite === true ||
      userData.subscriptionInfinite === true,
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userRef = useRef(user);
  userRef.current = user;

  useOfflineLogSync();

  useEffect(() => {
    let unsubscribePermissions: (() => void) | null = null;
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

        unsubscribePermissions = onValue(userProfileRef, (snap) => {
          if (isInitialLoad) {
            isInitialLoad = false;
            return;
          }

          if (snap.exists()) {
            const next = extractUserFields(snap.val());

            setUser((prev) => {
              if (!prev) return null;

              const hasChanged =
                prev.isAdmin !== next.isAdmin ||
                prev.isPermitted !== next.isPermitted ||
                // CRITICAL: UI won't update without this line
                prev.subscriptionInfinite !== next.subscriptionInfinite ||
                prev.subscriptionStartDate !== next.subscriptionStartDate ||
                prev.subscriptionDays !== next.subscriptionDays;
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
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribePermissions) unsubscribePermissions();
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
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
