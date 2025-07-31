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

// AuthProvider component to wrap your application and provide authentication context
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<CustomUser | null>(null);

    useEffect(() => {
        // Subscribe to Firebase authentication state changes
        // This listener will fire on initial load, and whenever the user's sign-in state changes.
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // If a user is logged in, save/update their profile in the Realtime Database
                await saveUserProfile(currentUser);

                // Fetch user-specific roles (isAdmin, canChat) from their profile
                const userProfileRef = ref(db, `users/${currentUser.uid}`);
                const snapshot = await get(userProfileRef);
                let isAdmin = false;
                let canChat = false; // Default chat permission to true

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    isAdmin = userData.isAdmin || false;
                    canChat = userData.canChat !== undefined ? userData.canChat : true;
                }

                // Update the user state with the fetched custom properties
                const userWithRoles: CustomUser = {
                    ...currentUser,
                    isAdmin,
                    canChat,
                };
                setUser(userWithRoles);

                // Set user's online status in the 'presence' node
                const userStatusRef = ref(db, `presence/${currentUser.uid}`);
                set(userStatusRef, true); // Set status to online (true)
                // Set up onDisconnect to update status to a timestamp when the user disconnects
                onDisconnect(userStatusRef).set(serverTimestamp());
                console.log(`User ${currentUser.uid} set to online. onDisconnect set.`);
            } else {
                // If user logs out, explicitly set their status offline if they were previously logged in
                // Only attempt to set offline if there was a user logged in previously
                if (user && user.uid) { // Check if 'user' state was previously set
                    const userStatusRef = ref(db, `presence/${user.uid}`);
                    set(userStatusRef, serverTimestamp()); // Set LastOnline timestamp on logout
                    console.log(`User ${user.uid} set to offline on logout.`);
                }
                setUser(null); // Clear user state
            }
        });
        // Unsubscribe from auth state changes when the component unmounts
        return () => unsubscribe();
    }, []); // Removed 'user' from dependency array to prevent excessive re-renders

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
