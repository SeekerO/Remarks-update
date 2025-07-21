"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */


import { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useChatMessages } from "./useChatMessages";
import { sendMessage } from "./sendMessage";
import { setTyping } from "./setTyping";
import { uploadFile } from "./uploadFile";
import { ref, onValue, get } from "firebase/database";
import { db } from "./firebase";
import Image from "next/image";

interface ChatRoomProps {
    chatId: string;
}

interface UserDetail {
    name: string;
    profilePic: string | null;
}

export default function ChatRoom({ chatId }: ChatRoomProps) {
    const { user } = useAuth();
    const messages = useChatMessages(chatId);
    const [input, setInput] = useState("");
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [typingTimeout, setTypingTimeout] = useState<any>(null);
    const [userDetails, setUserDetails] = useState<Record<string, UserDetail>>({});
    const [participants, setParticipants] = useState<string[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({}); // New state for online users

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchUserDetails = async (uid: string) => {
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
                console.warn(`User data not found for UID: ${uid}`);
                const defaultDetail: UserDetail = { name: "Unknown User", profilePic: null };
                setUserDetails((prev) => ({ ...prev, [uid]: defaultDetail }));
                return defaultDetail;
            }
        } catch (error) {
            console.error(`Error fetching user details for UID: ${uid}`, error);
            const defaultDetail: UserDetail = { name: "Error User", profilePic: null };
            setUserDetails((prev) => ({ ...prev, [uid]: defaultDetail }));
            return defaultDetail;
        }
    };

    useEffect(() => {
        if (!user) {
            return;
        }

        const participantsRef = ref(db, `chats/${chatId}/participants`);
        const unsubscribeParticipants = onValue(participantsRef, async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const participantUids = Object.keys(data);
                setParticipants(participantUids);
                participantUids.forEach((uid) => {
                    fetchUserDetails(uid);
                });

                // Subscribe to presence for each participant
                const unsubscribePresence: (() => void)[] = [];
                participantUids.forEach((uid) => {
                    const presenceRef = ref(db, `presence/${uid}`);
                    const unsub = onValue(presenceRef, (presenceSnapshot) => {
                        console.log(`[ChatRoom] User ${uid} presence:`, presenceSnapshot.val()); // Debugging log
                        setOnlineUsers((prev) => ({
                            ...prev,
                            [uid]: presenceSnapshot.val() === true,
                        }));
                    });
                    unsubscribePresence.push(unsub);
                });
                return () => unsubscribePresence.forEach(unsub => unsub()); // Cleanup presence listeners
            } else {
                setParticipants([]);
                setOnlineUsers({}); // Clear online users if no participants
            }
        });

        return () => unsubscribeParticipants(); // Cleanup participants listener
    }, [chatId, user]);

    useEffect(() => {
        messages.forEach((msg) => {
            if (msg.senderId && !userDetails[msg.senderId]) {
                fetchUserDetails(msg.senderId);
            }
        });
    }, [messages, userDetails]);

    const handleSend = async () => {
        if (!input.trim() || !user) return;
        await sendMessage(chatId, user.uid, input);
        setInput("");
    };

    const handleTyping = (e: any) => {
        setInput(e.target.value);
        if (!user) return;
        setTyping(chatId, user.uid, true);
        clearTimeout(typingTimeout);
        const timeout = setTimeout(() => setTyping(chatId, user.uid, false), 1500);
        setTypingTimeout(timeout);
    };

    useEffect(() => {
        if (!user) return;
        const typingRef = ref(db, `chats/${chatId}/typing`);
        const unsubscribe = onValue(typingRef, (snapshot) => {
            const data = snapshot.val() || {};
            const typingNow = Object.entries(data)
                .filter(([uid, isTyping]) => isTyping && uid !== user.uid)
                .map(([uid]) => {
                    fetchUserDetails(uid);
                    return userDetails[uid]?.name || "Loading...";
                });
            setTypingUsers(typingNow);
        });
        return () => unsubscribe();
    }, [chatId, user?.uid, userDetails]);

    const handleFileChange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file && user) {
            const url = await uploadFile(file, chatId);
            await sendMessage(chatId, user.uid, url, "file");
        }
    };

    if (!user) {
        return <div>Please log in to chat.</div>;
    }

    return (
        <div className="flex h-full">
            {/* Participants Sidebar (Left) */}
            <div className="w-1/4 border-r p-2 flex flex-col bg-slate-50 h-full overflow-y-auto" >
                <h3 className="text-md font-semibold mb-2">Participants</h3>
                <ul className="flex-grow overflow-y-auto">
                    {participants.length === 0 && (
                        <li className="text-gray-500 text-sm">No participants found or loaded.</li>
                    )}
                    {participants.map((uid) => {
                        const participantDetail = userDetails[uid];
                        const participantName = participantDetail?.name || `Loading name for ${uid}...`;
                        const participantProfilePic = participantDetail?.profilePic;
                        const isOnline = onlineUsers[uid]; // Get online status

                        return (
                            <li key={uid} className="mb-1 text-sm text-gray-700 flex items-center">
                                {isOnline}
                                {participantProfilePic && (
                                    <div className="relative"> {/* Use a relative container for the dot */}
                                        <Image
                                            width={32}
                                            height={32}
                                            src={participantProfilePic}
                                            alt={`${participantName}'s profile`}
                                            className="w-6 h-6 rounded-full mr-2 object-cover"
                                        />


                                        <span className={`absolute bottom-0 right-1 w-2 h-2 ${isOnline ? "bg-green-500" : "bg-gray-500"} rounded-full border border-white`}></span>

                                    </div>
                                )}
                                {participantName}
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Chat Content (Right) */}
            <div className="flex flex-col flex-grow pl-1">
                <div className="flex items-center justify-between ">
                    {typingUsers.length > 0 && (
                        <div className="text-sm text-gray-600 mb-2">
                            {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
                        </div>
                    )}
                </div>

                <div className="flex-grow overflow-y-auto h-[20vh] mb-4 p-2 bg-white border border-gray-200 rounded">
                    {messages.map((msg) => {
                        const senderDetail = userDetails[msg.senderId];
                        const senderName = senderDetail?.name || msg.senderId;
                        const senderProfilePic = senderDetail?.profilePic;

                        return (
                            <div key={msg.id} className={`mb-2 flex items-start ${msg.senderId === user.uid ? 'justify-end' : ''}`}>
                                {msg.senderId !== user.uid && senderProfilePic && (
                                    <Image
                                        width={32}
                                        height={32}
                                        src={senderProfilePic}
                                        alt={`${senderName}'s profile`}
                                        className="w-8 h-8 rounded-full mr-2 object-cover"
                                    />
                                )}
                                <div
                                    title={msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Sending...'}
                                    className={`${msg.senderId === user.uid ? 'text-right bg-blue-100 p-2 rounded-lg' : 'text-left bg-gray-100 p-2 rounded-lg'} min-w-[10vh] max-w-[40vh] `}
                                >

                                    {msg.type === "file" ? (
                                        <a
                                            href={msg.content}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            📎 File
                                        </a>
                                    ) : (
                                        <>
                                            {msg.content}
                                        </>

                                    )}
                                    {/* <span className="text-xs text-gray-400 ml-2">
                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Sending...'}
                                    </span> */}
                                </div>
                                {msg.senderId === user.uid && senderProfilePic && (
                                    <img
                                        src={senderProfilePic}
                                        alt={`${senderName}'s profile`}
                                        className="w-8 h-8 rounded-full ml-2 object-cover"
                                    />
                                )}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                <div className="flex">
                    <input
                        value={input}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-grow border rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label className="cursor-not-allowed bg-gray-200 text-gray-700 px-3 py-2 rounded-none hover:bg-gray-300 flex items-center justify-center">
                        📎
                    </label>

                    <button
                        onClick={handleSend}
                        className="bg-blue-500 text-white rounded-r px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}