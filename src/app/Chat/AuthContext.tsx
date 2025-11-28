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

// Extend User type to include custom properties like isAdmin and allowedPages
interface CustomUser extends User {
    isAdmin?: boolean;
    canChat?: boolean;
    allowedPages?: string[];
}

// Define the shape of the authentication context
interface AuthContextType {
    user: CustomUser | null;
    loginWithGoogle: () => Promise<void>;
    logout: () => void;
    uid?: string;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<CustomUser | null>(null);

    // Use a ref to hold the current user state for reliable cleanup/logout
    const userRef = useRef(user);
    userRef.current = user;

    useEffect(() => {
        let unsubscribePermissions: (() => void) | null = null;
        let isInitialLoad = true;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // 1. Save/Update Profile
                await saveUserProfile(currentUser);

                // 2. Fetch the SAVED profile to get initial roles and permissions
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

                // 3. Set up real-time listener for permission changes
                unsubscribePermissions = onValue(userProfileRef, (snapshot) => {
                    // Skip the first call (initial data) since we already set it above
                    if (isInitialLoad) {
                        isInitialLoad = false;
                        return;
                    }

                    if (snapshot.exists()) {
                        const userData = snapshot.val();

                        // Only update if permissions actually changed
                        setUser((prevUser) => {
                            if (!prevUser) return null;

                            const newIsAdmin = userData.isAdmin || false;
                            const newCanChat = userData.canChat !== undefined ? userData.canChat : true;
                            const newAllowedPages = userData.allowedPages;

                            // Check if anything actually changed
                            const hasChanged =
                                prevUser.isAdmin !== newIsAdmin ||
                                prevUser.canChat !== newCanChat ||
                                JSON.stringify(prevUser.allowedPages) !== JSON.stringify(newAllowedPages);

                            if (!hasChanged) {
                                return prevUser; // No change, return same reference
                            }

                            // Something changed, return new user object
                            return {
                                ...prevUser,
                                isAdmin: newIsAdmin,
                                canChat: newCanChat,
                                allowedPages: newAllowedPages,
                            };
                        });
                    }
                });

                // Presence/Online Status logic
                const userStatusRef = ref(db, `presence/${currentUser.uid}`);
                set(userStatusRef, true);
                onDisconnect(userStatusRef).set(serverTimestamp());
            } else {
                // Clean up permissions listener when user logs out
                if (unsubscribePermissions) {
                    unsubscribePermissions();
                    unsubscribePermissions = null;
                }

                // Set last online timestamp
                if (userRef.current && userRef.current.uid) {
                    const userStatusRef = ref(db, `presence/${userRef.current.uid}`);
                    set(userStatusRef, serverTimestamp());
                }
                setUser(null);
            }
        });

        return () => {
            unsubscribe();
            // Clean up permissions listener on unmount
            if (unsubscribePermissions) {
                unsubscribePermissions();
            }
        };
    }, []);

    // Function to handle Google login
    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    // Function to handle user logout
    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily access the authentication context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};