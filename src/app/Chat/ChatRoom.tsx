"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext"; // Authentication context
import { useChatMessages } from "./hooks/useChatMessages"; // Custom hook for messages
import { sendMessage } from "./firebase/firebase.actions/sendMessage"; // Function to send messages
import { editMessage } from "./components/messageActions"; // Function to edit messages
import { setTyping } from "./utils/setTyping"; // Function to set typing status
import { uploadFile } from "./firebase/firebase.actions/uploadFile"; // Function to upload files
import { ref, onValue, get, update, serverTimestamp } from "firebase/database"; // Firebase Realtime Database functions
import { db } from "./firebase/firebase"; // Firebase database instance
import Image from "next/image"; // Assuming Next.js Image component for optimization
import { BiCheckDouble } from "react-icons/bi";
import { AiFillEdit } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs"; // Icon for the 3-dot menu
import { deleteChat } from "./firebase/firebase.actions/deleteChat"; // Import the new deleteChat function
import { useRouter } from "next/navigation"; // For redirection after chat deletion
import { FaUser } from "react-icons/fa";

// Props for the ChatRoom component
interface ChatRoomProps {
    chatId: string; // The ID of the current chat room
    canChat: boolean; // Permission flag from AuthContext
    toggleChat: () => void; // Function to toggle the chat popup
}

// Interface for user details (for displaying sender info)
interface UserDetail {
    name: string;
    profilePic: string | null;
}

// Interface for a chat message
interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    type: "text" | "file";
    timestamp: number;
    isEdited?: boolean; // Optional, only present if edited
    editedAt?: number;  // Optional, only present if edited
    // reads?: Record<string, number>; // Granular read receipts (can be heavy, using lastReadMessageId instead)
}

export default function ChatRoom({ chatId, canChat, toggleChat }: ChatRoomProps) {
    const { user } = useAuth(); // Get current user from AuthContext
    const messages = useChatMessages(chatId); // Fetch and listen to messages using custom hook
    const [input, setInput] = useState(""); // State for message input
    const [typingUsers, setTypingUsers] = useState<string[]>([]); // UIDs of users currently typing
    const [typingTimeout, setTypingTimeout] = useState<any>(null); // Timeout for typing indicator
    const [userDetails, setUserDetails] = useState<Record<string, UserDetail>>({}); // Cache for user details
    const [usersInChat, setUsersInChat] = useState<string[]>([]); // UIDs of chat users (Changed from participants)
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({}); // Online status of users
    const [chatName, setChatName] = useState<string | null>(null); // State for chat name
    const router = useRouter(); // Initialize Next.js router

    // State for message editing
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingMessageContent, setEditingMessageContent] = useState("");

    // State for 3-dot menu and confirmation dialog
    const [showMenu, setShowMenu] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null); // Ref for the 3-dot menu


    // State for tracking each user's last read message ID for this chat
    const [userLastReads, setUserLastReads] = useState<Record<string, string | null>>({}); // Changed from participantLastReads

    const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling to bottom

    // Function to scroll to the bottom of the messages list
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };

    // Effect to scroll to bottom when messages change and to mark messages as read
    useEffect(() => {
        scrollToBottom(); // Scroll on new messages
        // Mark messages as read when new messages arrive and the chat is open and user has permission
        if (user && messages.length > 0 && canChat) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.id) {
                const userLastReadRef = ref(db, `userChats/${user.uid}/${chatId}`);
                // Fetch the current last read message ID for the user
                get(userLastReadRef).then(snapshot => {
                    const currentLastReadId = snapshot.val()?.lastReadMessageId;
                    // Only update if the last message in the chat is newer (lexicographically greater)
                    if (!currentLastReadId || lastMessage.id > currentLastReadId) {
                        update(userLastReadRef, { // Update the user's chat metadata
                            lastReadMessageId: lastMessage.id,
                            lastReadAt: serverTimestamp(),
                        }).catch(error => console.error("Error updating last read message:", error));
                    }
                }).catch(error => console.error("Error fetching current last read ID:", error));
            }
        }
    }, [messages, user, chatId, canChat]); // Depend on messages, user, chatId, and canChat

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    // Function to fetch user details and cache them
    const fetchUserDetails = useCallback(async (uid: string) => {
        // Return from cache if details already exist
        if (userDetails[uid]) {
            return userDetails[uid];
        }

        try {
            const userRef = ref(db, `users/${uid}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const fetchedDetail: UserDetail = {
                    name: userData.name || userData.email || uid,
                    profilePic: userData.profilePic || null,
                };
                setUserDetails((prev) => ({ ...prev, [uid]: fetchedDetail }));
                return fetchedDetail;
            } else {
                const defaultDetail: UserDetail = { name: `User ${uid.substring(0, 4)}`, profilePic: null };
                setUserDetails((prev) => ({ ...prev, [uid]: defaultDetail }));
                return defaultDetail;
            }
        } catch (error) {
            const defaultDetail: UserDetail = { name: "Error User", profilePic: null };
            setUserDetails((prev) => ({ ...prev, [uid]: defaultDetail }));
            return defaultDetail;
        }
    }, [userDetails]); // Depend on userDetails for caching logic

    // Effect to fetch chat users, their details, online status, and last read messages
    useEffect(() => {
        if (!user) {
            return;
        }

        const chatRef = ref(db, `chats/${chatId}`);
        const unsubscribeChat = onValue(chatRef, async (snapshot) => {
            const chatData = snapshot.val();
            if (chatData && chatData.users) { // Changed from chatData.participants
                setChatName(chatData.name || null); // Set chat name
                const userUids = Object.keys(chatData.users); // Changed from chatData.participants
                setUsersInChat(userUids); // Changed from setParticipants

                // Fetch details for all users
                const detailsPromises = userUids.map(uid => fetchUserDetails(uid));
                await Promise.all(detailsPromises); // Ensure all details are fetched and cached

                // Subscribe to presence for each user
                const unsubscribePresence: (() => void)[] = [];
                userUids.forEach((uid) => {
                    const presenceRef = ref(db, `presence/${uid}`);
                    const unsub = onValue(presenceRef, (presenceSnapshot) => {
                        // `true` for online, a timestamp for offline
                        const isOnline = presenceSnapshot.val() === true;
                        setOnlineUsers((prev) => ({ ...prev, [uid]: isOnline }));
                    });
                    unsubscribePresence.push(unsub);
                });

                // Subscribe to each user's lastReadMessageId for this chat
                const unsubscribeLastReads: (() => void)[] = [];
                userUids.forEach(uId => { // Changed from pId
                    const userChatRef = ref(db, `userChats/${uId}/${chatId}/lastReadMessageId`);
                    const unsub = onValue(userChatRef, (lastReadSnapshot) => {
                        setUserLastReads(prev => ({ // Changed from setParticipantLastReads
                            ...prev,
                            [uId]: lastReadSnapshot.val() // Store the lastReadMessageId
                        }));
                    });
                    unsubscribeLastReads.push(unsub);
                });

                // Return a cleanup function for this specific onValue listener
                return () => {
                    unsubscribePresence.forEach(unsub => unsub());
                    unsubscribeLastReads.forEach(unsub => unsub());
                };

            } else {
                // Reset states if chat data or users are missing
                setUsersInChat([]); // Changed from setParticipants
                setUserDetails({}); // Clear cached details specific to this chat
                setOnlineUsers({});
                setUserLastReads({}); // Changed from setParticipantLastReads
                setChatName(null);
            }
        },
            // Add error handling for the onValue listener itself
            (error) => {
                // Optionally redirect or show an error message to the user
                // router.push('/chats'); // Example: redirect to chat list
            }
        );

        // Listener for typing status (separate from chat data listener for clarity)
        const typingRef = ref(db, `chats/${chatId}/typing`);
        const unsubscribeTyping = onValue(typingRef, (snapshot) => {
            const data = snapshot.val() || {};
            const typingUids = Object.entries(data)
                .filter(([uid, isTyping]) => isTyping && uid !== user.uid) // Filter out current user
                .map(([uid]) => {
                    fetchUserDetails(uid); // Ensure user details are fetched for typing users
                    return uid;
                });
            setTypingUsers(typingUids);
        });

        // Overall cleanup for this component's effects
        return () => {
            unsubscribeChat();
            unsubscribeTyping();
        };
    }, [chatId, user, fetchUserDetails, router]); // Depend on chatId, user, and memoized fetchUserDetails

    // Ensure user details for message senders are always fetched
    useEffect(() => {
        messages.forEach((msg) => {
            if (msg.senderId && !userDetails[msg.senderId]) {
                fetchUserDetails(msg.senderId);
            }
        });
    }, [messages, userDetails, fetchUserDetails]); // Depend on messages, userDetails, and fetchUserDetails

    // Handler for sending messages
    const handleSend = async () => {
        if (!input.trim() || !user || !canChat) return; // Prevent sending if input is empty, no user, or no permission
        try {
            await sendMessage(chatId, user.uid, input);
            setInput(""); // Clear input field
            setTyping(chatId, user.uid, false); // Turn off typing indicator
        } catch (error) {
            alert("Failed to send message."); // Use a custom modal in production
        }
    };

    // Handler for typing input
    const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (!user || !canChat) return; // Prevent if no user or no permission

        // Set typing status based on input length
        setTyping(chatId, user.uid, e.target.value.length > 0);
        clearTimeout(typingTimeout); // Clear previous typing timeout
        // Set a new timeout to turn off typing status after a short delay
        const timeout = setTimeout(() => setTyping(chatId, user.uid, false), 1500);
        setTypingTimeout(timeout);
    }, [chatId, user, typingTimeout, canChat]); // Depend on chatId, user, typingTimeout, and canChat

    // Handler for file input change (uploading files)
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !canChat) { // Prevent if no user or no permission
            alert("You do not have permission to upload files.");
            return;
        }
        const file = e.target.files?.[0]; // Get the selected file
        if (file) {
            try {
                const fileUrl = await uploadFile(file, chatId); // Upload file and get URL
                await sendMessage(chatId, user.uid, fileUrl, "file"); // Send message with file URL
            } catch (error) {
                alert("Failed to upload file. Please try again."); // Use a custom modal in production
            } finally {
                e.target.value = ''; // Clear the file input
            }
        }
    };

    // --- Message Editing Handlers ---
    const handleEditClick = (message: ChatMessage) => {
        if (!canChat) { // Prevent if no permission
            alert("You do not have permission to edit messages.");
            return;
        }
        // Client-side validation for editing: must be sender's message and within 2 minutes
        const messageTime = message.timestamp;
        const currentTime = Date.now();
        const twoMinutes = 2 * 60 * 1000;

        if (user?.uid === message.senderId && currentTime - messageTime <= twoMinutes) {
            setEditingMessageId(message.id);
            setEditingMessageContent(message.content);
        } else {
            alert("This message cannot be edited (either not yours or the 2-minute window has expired).");
        }
    };

    const handleSaveEdit = async () => {
        if (!editingMessageId || !editingMessageContent.trim() || !user || !canChat) return; // Prevent if invalid state or no permission
        try {
            await editMessage(chatId, editingMessageId, editingMessageContent, user.uid);
            setEditingMessageId(null); // Clear editing state
            setEditingMessageContent("");
        } catch (error: any) {
            alert(`Failed to save edit: ${error.message}`); // Use a custom modal in production
        }
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null); // Clear editing state
        setEditingMessageContent("");
    };

    // --- Chat Deletion Handlers ---
    const handleDeleteChat = async () => {
        if (!user || !canChat) {
            alert("You do not have permission to delete this chat.");
            setShowConfirmDelete(false);
            setShowMenu(false);
            return;
        }

        try {
            await deleteChat(chatId, user.uid);
        } catch (error: any) {
            alert(`Failed to delete chat: ${error.message}`);
        } finally {
            setShowConfirmDelete(false); // Close confirmation dialog
            setShowMenu(false); // Close the 3-dot menu
            toggleChat()
        }
    };

    const hasBeenReadBy = useCallback((messageId: string, readerId: string) => {
        const lastReadId = userLastReads[readerId]; // Changed from 
        return lastReadId && messageId <= lastReadId;
    }, [userLastReads]); // Changed from participantLastReads

    if (!user) {
        return <div className="p-4 text-center text-gray-600">Please log in to chat.</div>;
    }

    return (
        <div className="flex  h-full shadow-md font-sans">

            {/* Chat Content (Right) */}
            <div className=" flex flex-col flex-grow ">
                {/* Chat Header with Name and 3-dot menu */}
                <div className="w-full p-4 border-b border-gray-200 bg-white dark:bg-slate-800 dark:border-gray-600 flex justify-between items-center">
                    <UserList
                        usersInChat={usersInChat}
                        userDetails={userDetails}
                        onlineUsers={onlineUsers}
                        user={user}
                    >
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white w-full">
                            {usersInChat.length === 2 ?
                                <div>
                                    {usersInChat.map((uid) => {
                                        const detail = userDetails[uid];
                                        const isOnline = onlineUsers[uid]; // Get online status
                                        if (!detail) return null;
                                        return (
                                            <div className="flex items-center " key={uid}>
                                                {uid !== user.uid &&
                                                    <div className="relative">
                                                        <Image
                                                            width={36}
                                                            height={36}
                                                            src={detail.profilePic || ""} // Fallback profile picture
                                                            alt={`${detail.name}'s profile`}
                                                            className="w-9 h-9 rounded-full mr-3 object-cover border-2 border-blue-200"
                                                        />
                                                        <span className={`absolute bottom-0 right-2 w-3 h-3 ${isOnline ? "bg-green-500" : "bg-gray-500"} rounded-full border-2 border-white`}></span>
                                                    </div>
                                                }

                                                <span key={uid} className="font-medium text-gray-700 dark:text-white">
                                                    {uid !== user.uid && detail.name}
                                                </span>
                                            </div>

                                        );
                                    })}
                                </div>
                                :
                                <>
                                    {chatName === null ?
                                        <p className="flex gap-2">
                                            <span className="flex items-center gap-1 px-2 text-white bg-blue-400 rounded-lg text-md"><FaUser size={15} />
                                                {usersInChat?.length}
                                            </span> Group Chat
                                        </p> : chatName
                                    }
                                </>
                            }

                        </h3>
                    </UserList>
                    {/* 3-dot menu button */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Chat options"
                        >
                            <BsThreeDotsVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10">
                                <button
                                    onClick={() => {
                                        setShowConfirmDelete(true);
                                        setShowMenu(false); // Close the 3-dot menu immediately
                                    }}
                                    className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                    disabled={!canChat} // Disable if user can't chat
                                >
                                    Delete Chat
                                </button>
                                {/* Add other menu items here if needed */}
                            </div>
                        )}
                    </div>
                </div>

                {/* Confirmation Dialog for Delete Chat */}
                {showConfirmDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center">
                            <h4 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Confirm Chat Deletion</h4>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">Are you sure you want to delete this chat? This action cannot be undone.</p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => setShowConfirmDelete(false)}
                                    className="px-5 py-2 rounded-md bg-gray-300 text-gray-800 hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteChat}
                                    className="px-5 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                <div className=" flex-grow overflow-y-auto p-4 bg-white dark:bg-slate-900 ">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-10 text-lg">
                            No messages yet. Start the conversation!
                        </div>
                    )}

                    {messages.map((msg: ChatMessage, index) => {
                        const senderDetail = userDetails[msg.senderId];
                        const senderName = senderDetail?.name || msg.senderId;
                        const senderProfilePic = senderDetail?.profilePic;
                        const isMyMessage = msg.senderId === user.uid;
                        const messageTimestamp = msg.timestamp;
                        // Check if message can be edited (by sender, within 2 mins, and user has chat permission)
                        const canEdit = isMyMessage && (Date.now() - messageTimestamp) <= (2 * 60 * 1000) && canChat;

                        // Determine if this is the last message in the chat
                        const isLastMessage = index === messages.length - 1;

                        // Get users who have read this specific message (for the last message only)
                        const readersForLastMessage: UserDetail[] = [];
                        if (isLastMessage && isMyMessage) {
                            usersInChat.forEach(uId => { // Changed from participants
                                if (uId !== user.uid && hasBeenReadBy(msg.id, uId)) {
                                    const readerDetail = userDetails[uId];
                                    if (readerDetail) {
                                        readersForLastMessage.push(readerDetail);
                                    }
                                }
                            });
                        }

                        return (
                            <div key={msg.id} className={`mb-4 flex items-end ${isMyMessage ? 'justify-end' : ''}`}>
                                {!isMyMessage && senderProfilePic && (
                                    <Image
                                        width={36}
                                        height={36}
                                        src={senderProfilePic}
                                        alt={`${senderName}'s profile`}
                                        className="w-9 h-9 rounded-full mr-3 object-cover border border-gray-200"
                                    />
                                )}
                                <div
                                    className="relative"
                                >
                                    {/* Display message content or edit input */}
                                    {msg.id === editingMessageId ? (
                                        <div className="flex flex-col">
                                            <input
                                                type="text"
                                                value={editingMessageContent}
                                                onChange={(e) => setEditingMessageContent(e.target.value)}
                                                className="border rounded px-2 py-1 mb-2 w-full text-gray-800"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') handleSaveEdit();
                                                }}
                                                disabled={!canChat} // Disable editing input if canChat is false
                                            />
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={handleSaveEdit} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors" disabled={!canChat}>Save</button>
                                                <button onClick={handleCancelEdit} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors" disabled={!canChat}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className={`${isMyMessage ? 'bg-blue-500 text-white rounded-bl-xl rounded-tr-xl rounded-tl-xl' : 'bg-gray-200 text-gray-800 rounded-br-xl rounded-tr-xl rounded-tl-xl'} p-3 shadow-sm`}>
                                                {msg.type === "file" ? (
                                                    <a
                                                        href={msg.content}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-200 hover:underline flex items-center font-medium"
                                                    >
                                                        <span className="mr-2 text-lg">📎</span> {msg.content.split('/').pop() || 'File'}
                                                    </a>
                                                ) : (
                                                    <p className="text-base h-auto max-w-[20rem] break-words ">
                                                        {msg.content}
                                                        {msg.isEdited && <span className="text-xs opacity-75 ml-1">(edited)</span>}
                                                    </p>
                                                )}
                                            </div>

                                            <span className={`block text-xs opacity-80 mt-1 ${isMyMessage ? "text-right" : "text-left"}`}>
                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                            </span>


                                            <div className="flex justify-end absolute right-0">
                                                {isLastMessage && isMyMessage && readersForLastMessage.length > 0 && readersForLastMessage.map((reader, idx) => (
                                                    reader.profilePic && (
                                                        <>
                                                            {usersInChat.length === 2 ? <span className="font-light text-xs text-gray-200 italic">
                                                                <BiCheckDouble size={20} className="text-gray-500" />
                                                            </span> :
                                                                <>
                                                                    <Image
                                                                        key={idx}
                                                                        width={18}
                                                                        height={18}
                                                                        src={reader.profilePic}
                                                                        alt={`${reader.name}'s read receipt`}
                                                                        className="w-[18px] h-[18px] rounded-full border border-white -ml-1 first:ml-0" // Overlapping effect
                                                                        title={`Read by ${reader.name}`}
                                                                    />
                                                                </>
                                                            }
                                                        </>
                                                    )
                                                ))}
                                            </div>

                                            {/* Edit button */}
                                            {isMyMessage && canEdit && msg.id !== editingMessageId && (
                                                <button
                                                    onClick={() => handleEditClick(msg)}
                                                    className="absolute -top-2 -right-2 bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-xs text-gray-700 hover:bg-gray-400 transition-colors shadow-sm"
                                                    title="Edit message"
                                                >
                                                    <AiFillEdit />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>


                                {isMyMessage && senderProfilePic &&
                                    <>
                                        <Image
                                            width={36}
                                            height={36}
                                            src={senderProfilePic}
                                            alt={`${senderName}'s profile`}
                                            className="w-9 h-9 rounded-full ml-3 object-cover border border-blue-200"
                                        />
                                    </>
                                }
                            </div>
                        );
                    })}

                    <div ref={messagesEndRef} /> {/* Element to scroll into view */}

                </div>
                {typingUsers.length > 0 && (
                    <div className=" text-sm text-gray-600 px-4 py-2 animate-pulse text-right">
                        {typingUsers.map((uid) => userDetails[uid]?.name || `User ${uid.substring(0, 4)}`).join(", ")}{" "}
                        {typingUsers.length === 1 ? "is" : "are"} typing...
                    </div>
                )}
                {/* Input and Send Button Area */}
                <div className="relative flex p-4 border-t border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-b-lg">
                    <input
                        value={input}
                        onChange={handleTyping}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSend();
                        }}
                        placeholder={canChat ? "Type a message..." : "You do not have permission to send messages."}
                        className="flex-grow border border-gray-300  rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-black"
                        disabled={!canChat} // Disable input if canChat is false
                    />
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        disabled={!canChat} // Disable file upload if canChat is false
                    />
                    <label htmlFor="file-upload" className={`cursor-pointer bg-gray-200 text-gray-700 px-4 py-2 rounded-none hover:bg-gray-300 flex items-center justify-center text-xl ${!canChat ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        📎
                    </label>

                    <button
                        onClick={handleSend}
                        className="bg-blue-600 text-white rounded-r-lg px-5 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold transition-colors shadow-md"
                        disabled={!canChat || !input.trim()} // Disable send button if no permission or empty input
                    >
                        Send
                    </button>
                </div>


                {/* Typing Indicator */}


            </div>

        </div>
    );
}

interface UserListProps {
    usersInChat: string[];
    userDetails: Record<string, UserDetail>;
    onlineUsers: Record<string, boolean>;
    user: any;
    children: React.ReactNode;
}

const UserList: React.FC<UserListProps> = ({ usersInChat, userDetails, onlineUsers, user, children }: UserListProps) => {
    const [open, setOpen] = useState(false);
    return (<div onClick={() => setOpen(!open)} className="relative cursor-pointer w-full z-50 select-none">
        {children}
        {(open && usersInChat.length !== 2) && (
            <div className="cursor-default w-full mt-2 absolute p-4 border border-gray-200 bg-black/5  dark:border-gray-600 backdrop-blur-[3px] dark:bg-slate-800/5 overflow-y-auto rounded shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">Users in Chat</h3>
                <ul>
                    {usersInChat.map((uid: any) => { // Changed from participants
                        const userDetail = userDetails[uid];
                        const userName = userDetail?.name || `User ${uid.substring(0, 4)}`;
                        const userProfilePic = userDetail?.profilePic;
                        const isOnline = onlineUsers[uid]; // Get online status

                        return (
                            <li key={uid} className="flex items-center mb-3 ">
                                {userProfilePic && (
                                    <div className="relative">
                                        <Image
                                            width={36}
                                            height={36}
                                            src={userProfilePic}
                                            alt={`${userName}'s profile`}
                                            className="w-9 h-9 rounded-full mr-3 object-cover border-2 border-blue-200"
                                        />
                                        <span className={`absolute bottom-0 right-2 w-3 h-3 ${isOnline ? "bg-green-500" : "bg-gray-500"} rounded-full border-2 border-white`}></span>
                                    </div>
                                )}
                                <span className="text-sm font-medium text-gray-700 dark:text-white">
                                    {userName}
                                    {uid === user.uid && " (You)"}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        )}
    </div>)
}