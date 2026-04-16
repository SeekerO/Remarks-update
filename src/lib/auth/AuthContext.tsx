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
import { ref, set, onDisconnect, serverTimestamp, get, onValue } from "firebase/database";
import { saveUserProfile } from "./saveUserProfile";
import { useOfflineLogSync } from "@/lib/hooks/useOfflineLogSync";

interface CustomUser extends User {
    isAdmin?: boolean;
    isPermitted?: boolean;
    allowedPages?: string[];
}

interface AuthContextType {
    user: CustomUser | null;
    isLoading: boolean; // ✅ Added
    loginWithGoogle: () => Promise<void>;
    logout: () => void;
    uid?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<CustomUser | null>(null);
    const [isLoading, setIsLoading] = useState(true); // ✅ Starts true — Firebase hasn't resolved yet

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
                }).catch(() => { }); // silent fail — don't block auth flow

                const userProfileRef = ref(db, `users/${currentUser.uid}`);
                const snapshot = await get(userProfileRef);

                let isAdmin = false;
                let isPermitted = false;
                let allowedPages: string[] | undefined = undefined;

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    isAdmin = userData.isAdmin || false;
                    isPermitted = userData.isPermitted !== undefined ? userData.isPermitted : true;
                    allowedPages = userData.allowedPages;
                }

                const userWithRoles: CustomUser = {
                    ...currentUser,
                    isAdmin,
                    isPermitted,
                    allowedPages,
                };
                setUser(userWithRoles);
                setIsLoading(false); // ✅ Done loading after user + permissions resolved

                unsubscribePermissions = onValue(userProfileRef, (snapshot) => {
                    if (isInitialLoad) {
                        isInitialLoad = false;
                        return;
                    }

                    if (snapshot.exists()) {
                        const userData = snapshot.val();

                        setUser((prevUser) => {
                            if (!prevUser) return null;

                            const newIsAdmin = userData.isAdmin || false;
                            const newisPermitted = userData.isPermitted !== undefined ? userData.isPermitted : true;
                            const newAllowedPages = userData.allowedPages;

                            const hasChanged =
                                prevUser.isAdmin !== newIsAdmin ||
                                prevUser.isPermitted !== newisPermitted ||
                                JSON.stringify(prevUser.allowedPages) !== JSON.stringify(newAllowedPages);

                            if (!hasChanged) return prevUser;

                            return {
                                ...prevUser,
                                isAdmin: newIsAdmin,
                                isPermitted: newisPermitted,
                                allowedPages: newAllowedPages,
                            };
                        });
                    }
                });

                const userStatusRef = ref(db, `presence/${currentUser.uid}`);
                set(userStatusRef, true);
                onDisconnect(userStatusRef).set(serverTimestamp());
            } else {
                if (unsubscribePermissions) {
                    unsubscribePermissions();
                    unsubscribePermissions = null;
                }

                if (userRef.current && userRef.current.uid) {
                    const userStatusRef = ref(db, `presence/${userRef.current.uid}`);
                    set(userStatusRef, serverTimestamp());
                }

                await fetch("/api/auth/session", { method: "DELETE" }).catch(() => { });
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

        // Sync token to cookie for middleware
        const token = await result.user.getIdToken();
        await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
    };


    const logout = async () => {
        await signOut(auth);

        // Clear session cookie
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