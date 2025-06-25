"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */


import React, { useState, useEffect, useRef } from "react";
import { IoClose, IoChatbubblesSharp } from "react-icons/io5";
import { BiSolidSend } from "react-icons/bi";
import { RiRobot2Fill } from "react-icons/ri";
import Image from "next/image";
import kkk from "@/lib/image/KKK.png";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub Flavored Markdown (tables, task lists, etc.)

// Define the type for a single chat message
interface ChatMessage {
    id: string;
    text: string;
    sender: "user" | "ai";
    timestamp: Date;
}

// Define the type for the response data from your API route
interface GenerateContentResponse {
    generatedContent?: string;
    message?: string;
    error?: string;
}

const ChatHead = () => {
    const [chatOpen, setChatOpen] = useState<boolean>(false);

    const closeChatHead = () => {
        setChatOpen(false);
    };

    return (
        // Position the chat bubble/popup fixed at the bottom right
        <div className="fixed bottom-6 right-6 z-50 select-none">
            {chatOpen ? (
                <ChatLayout handle={closeChatHead} />
            ) : (
                <div
                    onClick={() => setChatOpen(!chatOpen)}
                    className="relative flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-xl"
                >
                    <IoChatbubblesSharp className="text-4xl relative z-0" />
                    <RiRobot2Fill className="absolute z-10 text-blue-600 left-[21px] bottom-[21px] text-xl" />
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white bg-green-500 animate-ping-slow"></span>
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white bg-green-500"></span>
                </div>
            )}
        </div>
    );
};

export default ChatHead;

const ChatLayout = ({ handle }: { handle: () => void }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null); // Changed to HTMLTextAreaElement

    // Function to scroll to the latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Focus input on initial load and after sending a message
    useEffect(() => {
        inputRef.current?.focus();
    }, []); // Only on initial mount

    // Scroll to bottom whenever messages update
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (userPrompt: string): Promise<void> => {
        if (!userPrompt.trim()) return;

        setError(null);
        setIsLoading(true);

        const newUserMessage: ChatMessage = {
            id: Date.now().toString() + "-user",
            text: userPrompt,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        setInput("");

        try {
            // Clean, validated history to avoid SDK errors
            const validHistory = messages
                .filter((msg) => msg.text && msg.text.trim().length > 0)
                .map((msg) => ({
                    role: msg.sender === "user" ? "user" : "model",
                    parts: [{ text: msg.text }],
                }));

            const response = await fetch("/api/generate-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userPrompt.trim(), history: validHistory }),
            });

            const data: GenerateContentResponse = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `API call failed with status: ${response.status}`);
            }

            if (data.generatedContent) {
                const newAiMessage: ChatMessage = {
                    id: Date.now().toString() + "-ai",
                    text: data.generatedContent,
                    sender: "ai",
                    timestamp: new Date(),
                };
                setMessages((prevMessages) => [...prevMessages, newAiMessage]);
            } else {
                throw new Error("No generated content received.");
            }
        } catch (err: any) {
            console.error("Client Error:", err);
            setError(err.message);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString() + "-error",
                    text: `Error: ${err.message}. Please try again.`,
                    sender: "ai",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    // Handle Enter key for sending messages (for textarea, use shift+enter for new line)
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isLoading) {
            e.preventDefault(); // Prevent new line on Enter
            sendMessage(input);
        }
    };

    return (
        <div hidden={true} className="w-80 md:w-96 h-[60vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 dark:from-slate-600 to-blue-500 dark:to-slate-800 text-white shadow-md">
                <div className="flex items-center gap-2">
                    <div className="relative gap-1 mt-2 mr-1">
                        <RiRobot2Fill className=" z-10 text-slate-100 text-2xl" />
                        <div className="absolute bottom-5 -right-1 h-2 w-2 rounded-full bg-green-400 border border-white animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-semibold text-lg">KKK Bot</h3>
                        <div className="text-[9px] font-thin italic text-gray-50">
                            Powered By Gemini 2.0 Flash
                        </div>
                    </div>
                </div>
                <IoClose
                    onClick={handle}
                    className="text-2xl cursor-pointer hover:text-red-300 transition-colors duration-200"
                />
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 p-4 bg-slate-200 dark:bg-slate-700 overflow-y-auto custom-scrollbar relative flex flex-col">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 p-5 text-lg">
                        <span>
                            👋 Hi! I’m KKK Bot.<br />
                            <span className="text-xs text-gray-400">
                                (Note: My data is limited from 2023 and early 2024.)
                            </span>
                            <br />
                            How can I help you today?
                        </span>
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex mb-3 ${msg.sender === "user" ? "justify-end" : "justify-start"} select-text`}
                    >
                        <div
                            className={`p-3 rounded-lg max-w-[70%] text-sm shadow-md break-words leading-tight
                                ${msg.sender === "user" ? "bg-blue-200 dark:bg-blue-300 text-blue-800" : "bg-gray-400 text-white dark:bg-gray-800"}`}
                        >
                            {msg.sender === "ai" ? (
                                <div className="markdown-content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                msg.text
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start mb-3">
                        <div className="bg-gray-200 dark:bg-gray-800 dark:text-gray-300 text-gray-600 p-3 rounded-lg max-w-[70%] shadow-md italic">
                            AI is typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} /> {/* For auto-scrolling */}


            </div>
            <div className="absolute left-24 bottom-[200px] flex items-center justify-center z-0 opacity-10">
                <Image src={kkk} alt="KKK LOGO" width={200} height={200} />
            </div>

            {error && (
                <p className="text-red-600 text-center text-sm p-2">
                    Error: {error}
                </p>
            )}

            {/* Chat Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white dark:bg-gray-700 relative">
                <div className="flex items-center gap-3">
                    <textarea
                        ref={inputRef}
                        className="dark:bg-slate-800  dark:text-white flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none custom-scrollbar"
                        rows={2}
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:-rotate-12 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <BiSolidSend className="text-xl" />
                    </button>
                </div>
            </div>
        </div>
    );
};