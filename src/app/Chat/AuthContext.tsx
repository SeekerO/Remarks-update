// AuthContext.tsx
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase/firebase";
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    User,
} from "firebase/auth";
import { ref, set, onDisconnect, serverTimestamp, get } from "firebase/database";
import { saveUserProfile } from "./components/saveUserProfile";

// Extend User type to include custom properties like isAdmin and canChat
interface CustomUser extends User {
    isAdmin?: boolean;
    canChat?: boolean;
}

// Define the shape of the authentication context
interface AuthContextType {
    user: CustomUser | null;
    loginWithGoogle: () => Promise<void>;
    logout: () => void;
    uid?: string; // Ensure uid is always present
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<CustomUser | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                await saveUserProfile(currentUser);


                const userProfileRef = ref(db, `users/${currentUser.uid}`);
                const snapshot = await get(userProfileRef);
                let isAdmin = false;
                let canChat = false;

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    isAdmin = userData.isAdmin || false;
                    canChat = userData.canChat !== undefined ? userData.canChat : true;
                }


                const userWithRoles: CustomUser = {
                    ...currentUser,
                    isAdmin,
                    canChat,
                };
                setUser(userWithRoles);
                5
                const userStatusRef = ref(db, `presence/${currentUser.uid}`);
                set(userStatusRef, true);
                onDisconnect(userStatusRef).set(serverTimestamp());
                console.log(`User ${currentUser.uid} set to online. onDisconnect set.`);
            } else {

                if (user && user.uid) {
                    const userStatusRef = ref(db, `presence/${user.uid}`);
                    set(userStatusRef, serverTimestamp());
                    console.log(`User ${user.uid} set to offline on logout.`);
                }
                setUser(null);
            }
        });

        return () => unsubscribe();
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
