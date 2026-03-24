// ChatList.tsx
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import { useUserChats } from './hooks/useUserChats';
import { useAuth } from '../../lib/auth/AuthContext';
import { createChat } from '../../lib/firebase/firebase.actions/createChat';
import { ref, onValue } from 'firebase/database';
import { db } from '../../lib/firebase/firebase';
import Image from 'next/image';

import { IoMdNotifications, IoIosArrowBack } from "react-icons/io";
import { CiSearch } from "react-icons/ci";
import { MdGroupAdd } from "react-icons/md";

import { YourChatsListProps, CreateGroupChatProps, ChatWithUnread, ChatMessage, UserProfile, ChatListProps } from './types/interfaceChatList';

export default function ChatList({ onSelectChat, currentUserId, canChat }: ChatListProps) {
    const { user } = useAuth();
    const rawUserChats = useUserChats(currentUserId);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [newChatName, setNewChatName] = useState<string>('');
    const [chatsWithUnread, setChatsWithUnread] = useState<ChatWithUnread[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
    const [createGroupChat, setCreateGroupChat] = useState<boolean>(false);


    useEffect(() => {
        const usersRef = ref(db, "users");
        const presenceRef = ref(db, "presence");

        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            if (usersData) {
                const usersList = Object.keys(usersData)
                    .filter((uid) => {
                        // Keep this filter, as allUsers is primarily for displaying *other* users
                        const shouldInclude = uid !== currentUserId && (usersData[uid].canChat ?? true);
                        return shouldInclude;
                    })
                    .map((uid) => ({
                        uid,
                        name: usersData[uid].name || usersData[uid].email,
                        profilePic: usersData[uid].profilePic || null,
                        email: usersData[uid].email,
                        canChat: usersData[uid].canChat ?? true,
                    }));
                setAllUsers(usersList);
            } else {
                setAllUsers([]);
            }
        });

        const unsubscribePresence = onValue(presenceRef, (snapshot) => {
            const presenceData = snapshot.val();
            if (presenceData) {
                const onlineStatus: Record<string, boolean> = {};
                for (const uid in presenceData) {
                    onlineStatus[uid] = presenceData[uid] === true;
                }
                setOnlineUsers(onlineStatus);
            } else {
                setOnlineUsers({});
            }
        });

        return () => {
            unsubscribeUsers();
            unsubscribePresence();
        };
    }, [currentUserId]);


    // Effect to handle chat messages and unread counts for existing chats
    useEffect(() => {
        if (!user || rawUserChats.length === 0 || !canChat || allUsers.length === 0) {
            if (chatsWithUnread.length > 0) {
                setChatsWithUnread([]);
            }

            return;
        }

        const unsubs: (() => void)[] = [];
        const tempChats: Record<string, ChatWithUnread> = {};

        rawUserChats.forEach((chat) => {


            const userChatMetaRef = ref(db, `userChats/${user.uid}/${chat.id}`);
            const unsubscribeUserRead = onValue(userChatMetaRef, (userChatMetaSnapshot) => {
                const lastReadMessageId = userChatMetaSnapshot.val()?.lastReadMessageId || null;

                const messagesRef = ref(db, `chats/${chat.id}/messages`);
                const unsubscribeMessages = onValue(messagesRef, (messagesSnapshot) => {
                    const messagesData = messagesSnapshot.val();

                    let unreadCount = 0;
                    let latestMessageTimestamp: number = chat.createdAt;
                    let lastMessageSenderId: string | undefined;
                    let lastMessageContent: string | undefined;

                    if (messagesData) {
                        const messageList: ChatMessage[] = Object.keys(messagesData).map(key => ({ id: key, ...messagesData[key] }));
                        if (messageList.length > 0) {
                            messageList.sort((a, b) => a.timestamp - b.timestamp);
                            const lastMessage = messageList[messageList.length - 1];
                            latestMessageTimestamp = lastMessage.timestamp;
                            lastMessageSenderId = lastMessage.senderId;
                            lastMessageContent = lastMessage.content;
                        }

                        unreadCount = messageList.filter((msg: ChatMessage) =>
                            msg.senderId !== user.uid &&
                            (!lastReadMessageId || msg.id > lastReadMessageId)
                        ).length;
                    }

                    // --- CRITICAL CHANGE HERE for sender name resolution ---
                    let senderName: string | undefined;
                    if (lastMessageSenderId) {
                        if (lastMessageSenderId === user.uid) {
                            senderName = "You"; // If current user sent the last message
                        } else {
                            // Find other user's name from allUsers list
                            senderName = allUsers.find(u => u.uid === lastMessageSenderId)?.name || 'Unknown User';
                        }
                    }
                    // --- END CRITICAL CHANGE ---

                    const updatedChat: ChatWithUnread = {
                        ...chat,
                        unreadCount,
                        lastMessageTimestamp: latestMessageTimestamp,
                        lastMessageSenderName: senderName,
                        lastMessageContent: lastMessageContent
                    };

                    tempChats[chat.id] = updatedChat;
                    setChatsWithUnread(Object.values(tempChats));
                });
                unsubs.push(unsubscribeMessages);
            });
            unsubs.push(unsubscribeUserRead);
        });

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, [user, rawUserChats, currentUserId, canChat, allUsers, chatsWithUnread.length]);

    const handleCreateChat = async () => {
        if (!user || !canChat) return;
        if (selectedUsers.length === 0 && newChatName.trim() === '') {
            alert('Please select at least one other user or provide a group chat name.');
            return;
        }

        try {
            const chatId = await createChat(
                newChatName.trim() === '' ? null : newChatName.trim(),
                user.uid,
                selectedUsers
            );
            onSelectChat(chatId);
            setSelectedUsers([]);
            setNewChatName('');
        } catch (error: any) {
            alert(`Failed to create chat: ${error.message}`);
        }
    };

    const handleUserSelect = (uid: string) => {
        setSelectedUsers(prev =>
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    const handleOneToOneChat = async (targetUserId: string) => {
        if (!user || !canChat) return;
        try {
            const chatId = await createChat(null, user.uid, [targetUserId]);
            onSelectChat(chatId);
            setNewChatName('');
            setSelectedUsers([]);
        } catch (error: any) {
            alert(`Failed to create direct chat: ${error.message}`);
        }
    };

    const getChatDisplayName = useCallback((chat: ChatWithUnread) => {
        if (chat.name) {
            return chat.name;
        }

        const chatUserIds = Object.keys(chat.participants || {});

        if (chatUserIds.length === 2) {
            const otherUserId = chatUserIds.find(uId => uId !== user?.uid);

            if (otherUserId) {
                const otherUser = allUsers.find(u => u.uid === otherUserId);

                if (otherUser) {
                    return otherUser.name;
                } else {
                    return `Loading Name... (${otherUserId.slice(0, 4)}...)`;
                }
            }
            return "Direct Message (Invalid Users)";
        }

        if (chatUserIds.length > 2) {
            const otherParticipants = chatUserIds.filter(uId => uId !== user?.uid);
            if (otherParticipants.length > 0 && allUsers.length > 0) {
                const participantNames = otherParticipants
                    .map(uId => allUsers.find(u => u.uid === uId)?.name || 'Unknown User')
                    .join(', ');
                return `Group: ${participantNames}`;
            }
            return "Unnamed Group Chat";
        }

        return "Unknown Chat";
    }, [allUsers, user?.uid]);



    const getChatProfilePic = useCallback((chat: ChatWithUnread): string | string[] | null | undefined => {
        if (chat.isGroupChat || (chat.participants && Object.keys(chat.participants).length > 2)) {
            const participantIds = Object.keys(chat.participants || {});
            // Filter out the current user's own profile pic if desired for group display
            const otherParticipantIds = participantIds.filter(id => id !== user?.uid);
            // Filter out null/undefined to ensure only string[]
            const pics = otherParticipantIds
                .map(pId => allUsers.find(u => u.uid === pId)?.profilePic)
                .filter((pic): pic is string => typeof pic === "string");
            return pics;
        }
        // For direct chats, return the other user's profilePic
        const chatUserIds = Object.keys(chat.participants || {});
        if (chatUserIds.length === 2) {
            const otherUserId = chatUserIds.find(uId => uId !== user?.uid);
            if (otherUserId) {
                const otherUser = allUsers.find(u => u.uid === otherUserId);
                return otherUser?.profilePic || null;
            }
        }
        return null;
    }, [allUsers, user?.uid]);




    if (!user) {
        return <div className="p-4 text-center text-gray-600">Please log in to view chats.</div>;
    }

    if (!canChat) {
        return (
            <div className="p-4 text-center text-red-600 font-semibold bg-red-50 rounded-lg shadow-sm">
                You do not have permission to view or create chats. Please contact an administrator.
            </div>
        );
    }
    return (
        <div className="flex h-full font-sans ">
            {!createGroupChat ?
                <YourChatsList
                    setCreateGroupChat={setCreateGroupChat}
                    allUsers={allUsers}
                    handleOneToOneChat={handleOneToOneChat}
                    chatsWithUnread={chatsWithUnread}
                    onSelectChat={onSelectChat}
                    getChatDisplayName={getChatDisplayName}
                    currentUserId={currentUserId}
                    getChatProfilePic={getChatProfilePic}
                />
                :
                <CreateGroupChat
                    setCreateGroupChat={setCreateGroupChat}
                    newChatName={newChatName}
                    setNewChatName={setNewChatName}
                    allUsers={allUsers}
                    onlineUsers={onlineUsers}
                    selectedUsers={selectedUsers}
                    handleUserSelect={handleUserSelect}
                    handleCreateChat={handleCreateChat}
                />
            }
        </div>
    );
}



const CreateGroupChat = ({ setCreateGroupChat, newChatName, setNewChatName, allUsers, onlineUsers, selectedUsers, handleUserSelect, handleCreateChat }: CreateGroupChatProps) => {

    const [searchUser, setSearchUser] = useState<string>('');
    const filteredUsers = allUsers.filter(user => user.name.toLowerCase().includes(searchUser.toLowerCase()));

    return (<div className="w-full p-4 overflow-y-auto bg-white dark:bg-slate-800 rounded-r-lg shadow-inner">
        <div className="flex items-center mb-4">
            <button
                onClick={() => setCreateGroupChat(false)}>
                <IoIosArrowBack size={24} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Create New Chat</h3>
        </div>

        <div className="mb-2">
            <input
                type="text"
                id="newChatName"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder="e.g., Team Project, Family Chat"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
        </div>

        <div className='mb-2 relative flex items-center gap-2 p-1 border border-gray-200 rounded-md bg-gray-50 dark:bg-gray-700'>
            <CiSearch size={24} />
            <input
                onChange={(e) => setSearchUser(e.target.value)}
                type='search'
                className='bg-slate-100 w-full border-l border-slate-300 p-1 outline-none' placeholder='Search User Here..'
            />
        </div>
        <ul className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 p-3 rounded-md mb-5 bg-gray-50 dark:bg-gray-800 ">
            {allUsers.length === 0 && (
                <li className="text-gray-500 text-sm py-2 text-center">No other users available to chat with.</li>
            )}
            {filteredUsers.map((u: any) => {
                const isOnline = onlineUsers[u.uid];
                return (
                    <li key={u.uid} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
                        <label htmlFor={`user-${u.uid}`} className="flex items-center text-sm cursor-pointer flex-grow text-gray-700 dark:text-gray-300">
                            {u.profilePic && (
                                <div className="relative">
                                    <Image
                                        width={32}
                                        height={32}
                                        src={u.profilePic}
                                        alt={u.name}
                                        className="w-8 h-8 rounded-full mr-3 object-cover border border-gray-200"
                                    />
                                    <span className={`absolute bottom-0 right-2 w-3 h-3 ${isOnline ? "bg-green-500" : "bg-gray-400"} rounded-full border-2 border-white`}></span>
                                </div>
                            )}
                            <span className="font-medium">{u.name}</span>
                        </label>
                        <input
                            type="checkbox"
                            id={`user-${u.uid}`}
                            checked={selectedUsers.includes(u.uid)}
                            onChange={() => handleUserSelect(u.uid)}
                            className="ml-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                    </li>
                );
            })}
            {filteredUsers.length === 0 && <p className="text-gray-500 text-sm py-2 text-center">No users found.</p>}
        </ul>
        <button
            onClick={handleCreateChat}
            disabled={selectedUsers.length === 0}
            className="w-full bg-green-600 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-green-700 disabled:opacity-50"
        >
            Create Chat
        </button>
    </div>)
}


const YourChatsList = ({ setCreateGroupChat, allUsers, handleOneToOneChat, chatsWithUnread, onSelectChat, getChatDisplayName, getChatProfilePic }: YourChatsListProps) => {

    const [searchUser, setSearchUser] = useState<string>('');
    const filteredUsers = allUsers.filter(user => user.name.toLowerCase().includes(searchUser.toLowerCase()));

    return (
        <div className="w-full  p-4 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-inner">
            <div className='flex flex-col mb-4 gap-1 '  >
                <div className='flex items-center justify-between mb-1'>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Your Chats</h3>
                    <button
                        onClick={() => setCreateGroupChat(true)}
                        className="mt-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 shadow-md flex items-center gap-1" >
                        <MdGroupAdd size={20} />
                    </button>
                </div>
                <div className='relative flex items-center gap-2 p-1 border border-gray-200 rounded-md bg-gray-50 dark:bg-gray-700'>
                    <CiSearch size={24} />
                    <input
                        onChange={(e) => setSearchUser(e.target.value)}
                        type='search'
                        className='bg-transparent w-full border-l border-slate-300 p-1 outline-none' placeholder='Search User Here..'
                    />
                    {searchUser !== "" && (
                        <div className='absolute top-12 left-0 w-full bg-black/50 dark:bg-gray-800/90  backdrop-blur-[2px] shadow-lg rounded-lg p-4 z-50'>
                            {filteredUsers.map((u: any) => {
                                return (
                                    <li
                                        onClick={() => handleOneToOneChat && handleOneToOneChat(u.uid)}
                                        key={u.uid}
                                        className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
                                        <label
                                            className="flex items-center text-sm cursor-pointer flex-grow text-gray-700 dark:text-gray-300">
                                            {u.profilePic && (
                                                <div className="relative">
                                                    <Image
                                                        width={32}
                                                        height={32}
                                                        src={u.profilePic}
                                                        alt={u.name}
                                                        className="w-8 h-8 rounded-full mr-3 object-cover border border-gray-200 overflow-hidden"
                                                    />

                                                </div>
                                            )}
                                            <span className="font-medium">{u.name}</span>
                                        </label>
                                    </li>
                                );
                            })}

                            {filteredUsers.length === 0 && <p className="text-gray-100 text-sm py-2 text-center">No users found.</p>}
                        </div>
                    )}
                </div>

            </div>
            <ul className="space-y-3">

                {(chatsWithUnread || []).length === 0 && (
                    <li className="text-gray-500 dark:text-white text-sm py-4 text-center">No chats found. Create a new one!</li>
                )}
                {(chatsWithUnread || [])
                    .sort((a: ChatWithUnread, b: ChatWithUnread) => (b.lastMessageTimestamp || b.createdAt) - (a.lastMessageTimestamp || a.createdAt))
                    .map((chat: any) => (
                        <li
                            key={chat.id}
                            onClick={() => onSelectChat && onSelectChat(chat.id)}
                            className="cursor-pointer p-3 rounded-lg hover:dark:bg-blue-500 hover:bg-gray-200 transition-colors duration-200 flex flex-col justify-between items-start border border-gray-100"
                        >
                            <div className="flex justify-between w-full items-center">
                                <span className="font-medium text-gray-800 dark:text-white text-base flex gap-1 items-center">
                                    {chat.isGroupChat ? (
                                        <div className="relative w-14 h-9 flex items-center">
                                            {Array.isArray(getChatProfilePic(chat)) &&
                                                (getChatProfilePic(chat) as string[]).slice(0, 2).map((profilePic: string, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="absolute"
                                                        style={{
                                                            left: `${idx * 18}px`,
                                                            zIndex: 2 - idx,
                                                            transform: `rotate(${idx === 0 ? '-8deg' : '8deg'})`,
                                                        }}
                                                    >

                                                        <Image
                                                            width={35}
                                                            height={35}
                                                            className="rounded-full border-2 border-white shadow overflow-hidden"
                                                            src={profilePic}
                                                            alt={getChatDisplayName ? getChatDisplayName(chat) : "Chat profile"}
                                                        />
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div>
                                            <Image
                                                width={35}
                                                height={35}
                                                className="rounded-full border-1 border-slate-400"
                                                src={
                                                    Array.isArray(getChatProfilePic(chat))
                                                        ? (((getChatProfilePic(chat) ?? [])[0] as string) || "/default-profile.png")
                                                        : ((getChatProfilePic(chat) as string | null) || "/default-profile.png")
                                                }
                                                alt={getChatDisplayName ? getChatDisplayName(chat) : "Chat profile"}
                                            />
                                        </div>
                                    )}
                                    <div className='flex flex-col ml-1'>
                                        <label> {getChatDisplayName ? getChatDisplayName(chat) : ""}</label>
                                        {chat.lastMessageContent && (
                                            <p className="text-sm text-gray-500 dark:text-gray-200 truncate w-full gap-1 flex items-center">
                                                {/* Simplified logic here as senderName is already resolved */}
                                                {chat.lastMessageSenderName && (
                                                    <span className="italic font-light ">
                                                        {chat.lastMessageSenderName}:
                                                    </span>
                                                )}
                                                {chat.lastMessageContent}
                                            </p>
                                        )}
                                    </div>

                                </span>

                                {chat.unreadCount !== 0 && (
                                    <div className=' text-white  text-md bg-red-600 rounded-full w-fit px-2 h-7 flex items-center justify-center'>
                                        <IoMdNotifications size={19} />
                                        <span className="">
                                            {chat.unreadCount}
                                        </span>
                                    </div>
                                )}
                            </div>

                        </li>
                    ))}
            </ul>
        </div>
    )
}

