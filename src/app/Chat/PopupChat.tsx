// app/Chat/PopupChat.tsx
"use client";
import React, { useState, useEffect } from 'react';
import ChatRoom from './ChatRoom'; // Assuming ChatRoom.tsx is in the same folder
import { useAuth } from './AuthContext'; // Path adjusted
import { ref, get, child } from 'firebase/database'; // Import get and child for database queries
import { db } from './firebase'; // Import your Firebase db instance
import { CgLogOut } from "react-icons/cg";

interface PopupChatProps {
    // You can pass the predefined chat ID as a prop, or hardcode it
    // For now, let's hardcode it for simplicity, but a prop is more flexible
    predefinedChatId?: string;
}

// Define your specific chat ID here. You MUST create this chat manually in Firebase
// or ensure it's created by your system with the correct participants.
const YOUR_PREDEFINED_CHAT_ID = "support_chat_general"; // <<<--- IMPORTANT: REPLACE WITH YOUR ACTUAL CHAT ID

export default function PopupChat({ predefinedChatId }: PopupChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const { user, loginWithGoogle, logout } = useAuth();




    useEffect(() => {
        const checkAccess = async () => {
            if (user) {
                console.log("User found, attempting to check access for UID:", user.uid);
                const chatToJoin = predefinedChatId || YOUR_PREDEFINED_CHAT_ID;
                const chatParticipantsRef = child(ref(db, 'chats'), `${chatToJoin}/participants/${user.uid}`);

                try {
                    const snapshot = await get(chatParticipantsRef)

                    if (snapshot.exists() && snapshot.val() === true) {
                        setHasAccess(true);
                        setCurrentChatId(chatToJoin);
                    } else {
                        setHasAccess(false);
                        setCurrentChatId(null);
                    }
                } catch (error) {
                    console.error("Error checking chat access (Caught Error):", error); // ALSO CHECK FOR THIS ERROR
                    setHasAccess(false);
                    setCurrentChatId(null);
                }
            }
        };

        checkAccess();
    }, [user, predefinedChatId]);


    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleLoginClick = async () => {
        try {
            await loginWithGoogle();
            // AuthContext's onAuthStateChanged will update the 'user' state,
            // which in turn triggers the useEffect above to check access.
        } catch (error) {
            console.error("Google login failed:", error);
            // Handle login errors (e.g., show a message to the user)
        }
    };

    const handleLogoutClick = () => {
        logout();
        setIsOpen(false); // Close chat on logout
    };


    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={toggleChat}
                className="bg-blue-500 text-white rounded-full p-4 shadow-lg focus:outline-none"
            >
                {isOpen ? 'Close Chat' : 'Open Chat'}
            </button>

            {isOpen && (
                <div className="bg-white rounded-lg shadow-xl p-4 w-[90vh] h-[60vh] flex flex-col fixed bottom-20 right-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-semibold">KKK Chat</h2>
                        <button onClick={toggleChat} className="text-gray-500 hover:text-gray-700">
                            &times;
                        </button>
                    </div>

                    {!user ? (
                        // This block should show if user is NULL (not logged in)
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <p className="text-gray-600">Please log in to access the chat.</p>
                            <button
                                onClick={handleLoginClick}
                                className="bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Login with Google
                            </button>

                        </div>
                    ) : (
                        // This block should show if user is NOT NULL (logged in)
                        hasAccess === null ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-600">Checking access...</p>
                            </div>
                        ) : hasAccess ? (
                            <div className="flex-grow">
                                <ChatRoom chatId={currentChatId!} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <p className="text-red-600 font-semibold">Access Denied</p>
                                <p className="text-gray-600 text-center">You do not have permission to access this chat.</p>
                                <button
                                    onClick={handleLogoutClick}
                                    className="bg-red-500 text-white rounded px-4 py-2 hover:bg-red-600"
                                >
                                    Logout
                                </button>
                            </div>
                        )
                    )}
                    {user && hasAccess && (
                        <div className='flex items-center justify-between mt-2'>
                            <button
                                title="Logout"
                                onClick={handleLogoutClick}
                                className="w-fit bg-red-500 text-white rounded px-3 py-1 hover:bg-red-600 flex items-center gap-2"
                            >
                                <CgLogOut size={25} />
                            </button>
                            <div className="text-xs text-gray-500 mt-2">
                                Logged in as: {user.displayName || user.email}
                            </div>
                        </div>

                    )}
                </div>
            )}
        </div>
    );
}