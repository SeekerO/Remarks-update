"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, X, Minimize2, Maximize2,
  RotateCcw, Copy, Check, ChevronDown, Loader2,
  Bot, User, Zap, MessageSquare
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isError?: boolean;
}

interface AiAssistantProps {
  /** Context about the current page/tool the user is on */
  pageContext?: string;
  /** Placeholder text for the input */
  placeholder?: string;
  /** System prompt addendum */
  systemAddendum?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Avexi Assistant, an intelligent AI integrated into the Avexi platform — a professional workspace suite for image editing, document management, voter registration tools, and team collaboration built for the Election Information Division.

You are helpful, concise, and knowledgeable about:
- Avexi's tools: Watermark Editor, Background Remover, Logo Editor, Resolution Adjuster, PDF Converter, DTR Extractor, Data Matcher, FAQ management, and more
- Voter registration procedures and COMELEC guidelines
- Philippine election laws and processes
- Document management workflows
- General productivity and workspace questions

Be direct and practical. When answering questions about Avexi tools, give step-by-step guidance. For voter registration queries, cite relevant COMELEC procedures. Keep responses focused and avoid unnecessary verbosity. Use markdown formatting when helpful (bold for emphasis, bullet lists for steps).`;

const QUICK_PROMPTS = [
  "How do I watermark images in batch?",
  "What are the voter registration requirements?",
  "How to export a PDF from Word?",
  "Explain the DTR Extractor tool",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code style="background:rgba(99,102,241,0.15);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.9em;">$1</code>')
    .replace(/^#{3}\s(.+)$/gm, '<p style="font-weight:700;margin-top:10px;margin-bottom:4px;font-size:0.85em;text-transform:uppercase;letter-spacing:0.05em;color:rgba(165,180,252,0.9);">$1</p>')
    .replace(/^#{2}\s(.+)$/gm, '<p style="font-weight:600;font-size:0.95em;margin-top:12px;margin-bottom:6px;">$1</p>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:1rem;list-style:disc;margin-bottom:3px;">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left:1rem;margin-bottom:3px;">$2</li>')
    .replace(/\n\n/g, '</p><p style="margin-top:8px;">')
    .replace(/\n/g, "<br/>");
}

// ── Message Bubble ────────────────────────────────────────────────────────────

const MessageBubble = React.memo(({
  message,
  isLast,
}: {
  message: Message;
  isLast: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-violet-600"
            : "bg-gradient-to-br from-violet-600/30 to-indigo-500/30 border border-indigo-500/30"
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        )}
      </div>

      {/* Bubble */}
      <div className={`group max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
            isUser
              ? "bg-indigo-600 text-white rounded-br-sm"
              : message.isError
              ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm"
              : "bg-white/[0.06] border border-white/[0.07] text-white/85 rounded-bl-sm"
          }`}
          dangerouslySetInnerHTML={
            isUser
              ? undefined
              : { __html: `<p style="margin:0;">${parseMarkdown(message.content)}</p>` }
          }
        >
          {isUser ? message.content : undefined}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-white/25">{formatTime(message.timestamp)}</span>
          {!isUser && !message.isError && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-white/25 hover:text-white/60"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = "MessageBubble";

// ── Typing Indicator ──────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    className="flex items-end gap-2.5"
  >
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600/30 to-indigo-500/30 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
    </div>
    <div className="bg-white/[0.06] border border-white/[0.07] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function AiAssistant({
  pageContext,
  placeholder = "Ask Avexi Assistant anything…",
  systemAddendum,
}: AiAssistantProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: uid(),
          role: "assistant",
          content: `Hello${user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}! I'm your Avexi Assistant. I can help you with any of the workspace tools, voter registration questions, or document workflows. What can I help you with today?`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [isOpen, user?.displayName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const buildSystemPrompt = useCallback(() => {
    let sys = SYSTEM_PROMPT;
    if (pageContext) sys += `\n\nCurrent page context: ${pageContext}`;
    if (systemAddendum) sys += `\n\n${systemAddendum}`;
    if (user?.displayName) sys += `\n\nThe user's name is ${user.displayName}.`;
    return sys;
  }, [pageContext, systemAddendum, user?.displayName]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: [
            ...history,
            { role: "user", content: content.trim() },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Failed to get a response");
      }

      const text =
        data.content
          ?.filter((b: any) => b.type === "text")
          .map((b: any) => b.text)
          .join("") || "I couldn't generate a response. Please try again.";

      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        content: text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (!isOpen) setHasUnread(true);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "Sorry, I ran into an error. Please check your connection and try again.",
          timestamp: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [isLoading, messages, buildSystemPrompt, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClear = () => {
    if (isLoading) {
      abortRef.current?.abort();
      setIsLoading(false);
    }
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: "Conversation cleared. How can I help you?",
        timestamp: Date.now(),
      },
    ]);
  };

  const panelWidth = isExpanded ? 440 : 360;
  const panelHeight = isExpanded ? 620 : 500;

  return (
    <>
      {/* ── FAB ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[900] w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 8px 32px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.3)",
            }}
            title="Open Avexi Assistant"
          >
            <Sparkles className="w-6 h-6 text-white" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0f0e17] animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-[901] flex flex-col overflow-hidden"
            style={{
              width: panelWidth,
              height: panelHeight,
              background: "linear-gradient(145deg, #0d0d1a 0%, #0f0f1e 100%)",
              border: "0.5px solid rgba(99,102,241,0.2)",
              borderRadius: 20,
              boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.1)",
              transition: "width 0.25s ease, height 0.25s ease",
            }}
          >
            {/* Accent bar */}
            <div
              className="h-[2px] flex-shrink-0"
              style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)" }}
            />

            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
              style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(99,102,241,0.15)",
                  border: "0.5px solid rgba(99,102,241,0.3)",
                }}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white/90 leading-tight">
                  Avexi Assistant
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] text-white/30">
                    {isLoading ? "Thinking…" : "Ready to help"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsExpanded((v) => !v)}
                  title={isExpanded ? "Compact" : "Expand"}
                  className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                >
                  {isExpanded ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.05] transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "0.5px solid rgba(99,102,241,0.2)",
                    }}
                  >
                    <MessageSquare className="w-6 h-6 text-indigo-400" />
                  </div>
                  <p className="text-xs text-white/30 text-center leading-relaxed">
                    Ask me anything about Avexi tools,<br />voter registration, or document workflows.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isLast={i === messages.length - 1}
                />
              ))}

              <AnimatePresence>
                {isLoading && <TypingIndicator />}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts (shown only when conversation just started) */}
            {messages.length <= 1 && !isLoading && (
              <div
                className="px-4 py-2.5 flex-shrink-0 space-y-1.5"
                style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-[10px] text-white/20 uppercase tracking-wider mb-2">
                  Quick questions
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-left px-2.5 py-1.5 rounded-lg text-[11px] text-white/50 hover:text-white/80 transition-all text-ellipsis overflow-hidden whitespace-nowrap"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "0.5px solid rgba(255,255,255,0.07)",
                      }}
                      title={q}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div
              className="flex-shrink-0 px-3 py-3"
              style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(99,102,241,0.2)",
                }}
              >
                <Zap className="w-3.5 h-3.5 text-indigo-400/50 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/20 focus:outline-none disabled:opacity-40"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{
                    background: input.trim() && !isLoading
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "rgba(255,255,255,0.05)",
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              </div>

              <p className="text-[10px] text-white/15 text-center mt-2">
                Powered by Claude · Avexi v5.0.0
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}