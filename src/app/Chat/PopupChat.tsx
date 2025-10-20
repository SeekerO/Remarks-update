// PopupChat.tsx
"use client";
import React, { useState } from 'react';
import ChatRoom from './ChatRoom'; // Chat room component
import { useAuth } from './AuthContext'; // Authentication context
import ChatList from './ChatList'; // Chat list component
import AdminPanel from './AdminPanel'; // Admin panel component
import { IoArrowBackCircle, IoChatbubblesSharp, IoClose } from "react-icons/io5"; // Back icon
import { CgLogOut } from "react-icons/cg"; // Logout icon

export default function PopupChat() {
    const [isOpen, setIsOpen] = useState(false); // State to control chat popup visibility
    const [currentChatId, setCurrentChatId] = useState<string | null>(null); // State for the currently selected chat room
    const [showAdminPanel, setShowAdminPanel] = useState(false); // State to control admin panel visibility
    const { user, loginWithGoogle, logout } = useAuth(); // Get user, login, and logout functions from AuthContext

    // Toggles the main chat popup open/closed
    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (isOpen) {
            // When closing the chat, reset current chat and hide admin panel
            setCurrentChatId(null);
            setShowAdminPanel(false);
        }
    };


    // Handles logout click
    const handleLogoutClick = () => {
        logout(); // Log out the user
        setIsOpen(false); // Close the chat popup
        setCurrentChatId(null); // Clear selected chat
        setShowAdminPanel(false); // Hide admin panel
    };

    // Callback function to select a specific chat room
    const handleSelectChat = (chatId: string) => {
        setCurrentChatId(chatId); // Set the selected chat ID
        setShowAdminPanel(false); // Hide admin panel if a chat is selected
    };

    // Navigates back to the chat list or hides the admin panel
    const handleBackToChatList = () => {
        setCurrentChatId(null); // Clear current chat
        setShowAdminPanel(false); // Hide admin panel
    };

    // Toggles the visibility of the admin panel
    const handleToggleAdminPanel = () => {
        setShowAdminPanel(prev => !prev); // Toggle admin panel state
        setCurrentChatId(null); // Clear current chat when opening admin panel
    };

    const handleToggleCloseChat = () => {
        setCurrentChatId(null); // Clear current chat when opening admin panel
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 font-sans">
            {/* Main button to open/close the chat popup */}
            <button
                onClick={toggleChat}
                className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 ease-in-out transform hover:scale-105"
                aria-expanded={isOpen}
                aria-controls="chat-popup-window"
            >

                {isOpen ? <IoClose size={24} /> : <IoChatbubblesSharp size={24} />}
            </button>

            {/* Chat Popup Window */}
            {isOpen && (
                <div
                    id="chat-popup-window"
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl dark:shadow-gray-800/50 p-4 w-[90vw] max-w-[500px] h-[70vh] flex flex-col fixed bottom-20 right-4 animate-fade-in-up"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="chat-popup-title"
                >
                    {/* Header section with title and navigation */}
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                        {/* Back button for chat room or admin panel */}
                        {(currentChatId || showAdminPanel) && (
                            <button
                                onClick={handleBackToChatList}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                title="Back to Chat List"
                            >
                                <IoArrowBackCircle size={30} />
                            </button>
                        )}


                        <h2 id="chat-popup-title" className="text-xl font-bold text-gray-800 dark:text-white flex-grow text-center">
                            {showAdminPanel ? "Admin Panel" : (currentChatId ? "Chat Room" : "KKK Chats")}
                        </h2>
                        {/* Close button for the popup */}
                        <button
                            onClick={toggleChat}
                            className="text-gray-500 hover:text-gray-700 text-3xl p-1 rounded-full hover:bg-gray-100 transition-colors"
                            title="Close Chat"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Conditional rendering based on authentication status */}
                    {user && <>
                        <div className="flex-grow overflow-hidden">
                            {showAdminPanel ? (
                                <AdminPanel currentUserId={user.uid} />
                            ) : currentChatId ? (
                                <ChatRoom chatId={currentChatId} canChat={user.canChat ?? false} toggleChat={handleToggleCloseChat} />
                            ) : (
                                <ChatList onSelectChat={handleSelectChat} currentUserId={user.uid} canChat={user.canChat ?? false} />
                            )}
                        </div>

                        <div className='flex items-center justify-between mt-1 pt-3'>
                            {/* Logout button */}
                            <button
                                title="Logout"
                                onClick={handleLogoutClick}
                                className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 flex items-center gap-2 font-semibold text-sm transition-colors shadow-sm"
                            >
                                <CgLogOut size={22} /> Logout
                            </button>


                            <div className="text-sm text-gray-600 ml-4 flex items-center gap-1">
                                Logged in as: <span className="font-medium">{user.displayName || user.email}</span>
                                {/* Admin Panel button (only for admins) */}
                                {(user?.isAdmin && !showAdminPanel) && (
                                    <button
                                        title="Admin Panel"
                                        onClick={handleToggleAdminPanel}
                                        className="text-sm px-3  rounded-full bg-slate-400 text-white hover:bg-slate-500 transition-colors flex items-center gap-1 font-light italic"
                                    >
                                        Admin
                                    </button>
                                )}
                            </div>

                        </div>
                    </>}
                </div>
            )}
        </div>
    );
}

