// AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth, db } from "../../lib/firebase/firebase";
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    User,
} from "firebase/auth";
import { ref, set, onDisconnect, serverTimestamp, get, onValue } from "firebase/database";
import { saveUserProfile } from "./components/saveUserProfile";

interface CustomUser extends User {
    isAdmin?: boolean;
    canChat?: boolean;
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

    useEffect(() => {
        let unsubscribePermissions: (() => void) | null = null;
        let isInitialLoad = true;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                await saveUserProfile(currentUser);

                const userProfileRef = ref(db, `users/${currentUser.uid}`);
                const snapshot = await get(userProfileRef);

                let isAdmin = false;
                let canChat = false;
                let allowedPages: string[] | undefined = undefined;

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    isAdmin = userData.isAdmin || false;
                    canChat = userData.canChat !== undefined ? userData.canChat : true;
                    allowedPages = userData.allowedPages;
                }

                const userWithRoles: CustomUser = {
                    ...currentUser,
                    isAdmin,
                    canChat,
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
                            const newCanChat = userData.canChat !== undefined ? userData.canChat : true;
                            const newAllowedPages = userData.allowedPages;

                            const hasChanged =
                                prevUser.isAdmin !== newIsAdmin ||
                                prevUser.canChat !== newCanChat ||
                                JSON.stringify(prevUser.allowedPages) !== JSON.stringify(newAllowedPages);

                            if (!hasChanged) return prevUser;

                            return {
                                ...prevUser,
                                isAdmin: newIsAdmin,
                                canChat: newCanChat,
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

                setUser(null);
                setIsLoading(false); // ✅ Done loading — confirmed no user
            }
        });

        return () => {
            unsubscribe();
            if (unsubscribePermissions) unsubscribePermissions();
        };
    }, []);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = () => signOut(auth);

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