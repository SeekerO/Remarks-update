"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  User,
  Zap,
  MessageSquare,
  ChevronDown,
  ShieldAlert,
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
  pageContext?: string;
  placeholder?: string;
}

interface ModelOption {
  id: string;
  label: string;
  tag: string;
}

interface ProviderOption {
  id: string;
  label: string;
  color: string;
  models: ModelOption[];
}

// ── Provider + Model Config ───────────────────────────────────────────────────

const PROVIDERS: ProviderOption[] = [
  {
    id: "groq",
    label: "Groq",
    color: "#f97316",
    models: [
      {
        id: "llama-3.3-70b-versatile",
        label: "Llama 3.3 70B",
        tag: "Free · Recommended",
      },
      {
        id: "llama-3.1-8b-instant",
        label: "Llama 3.1 8B",
        tag: "Free · Fastest",
      },
      {
        id: "meta-llama/llama-4-scout-17b-16e-instruct",
        label: "Llama 4 Scout 17B",
        tag: "Free · New",
      },
      {
        id: "openai/gpt-oss-120b",
        label: "GPT-OSS 120B",
        tag: "Paid · Largest",
      },
    ],
  },
  {
    id: "google",
    label: "Google",
    color: "#4285f4",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", tag: "Free · Fast" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", tag: "Free · Best" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", tag: "Free · Powerful" },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    color: "#7c3aed",
    models: [
      {
        id: "meta-llama/llama-4-scout:free",
        label: "Llama 4 Scout",
        tag: "Free",
      },
      {
        id: "deepseek/deepseek-r1:free",
        label: "DeepSeek R1",
        tag: "Free · Reasoning",
      },
      { id: "google/gemma-3-27b-it:free", label: "Gemma 3 27B", tag: "Free" },
      {
        id: "qwen/qwen3-235b-a22b:free",
        label: "Qwen3 235B",
        tag: "Free · Large",
      },
    ],
  },
  {
    id: "cerebras",
    label: "Cerebras",
    color: "#10b981",
    models: [
      { id: "llama-3.3-70b", label: "Llama 3.3 70B", tag: "Free · Ultra-fast" },
      { id: "qwen-3-32b", label: "Qwen3 32B", tag: "Free" },
      { id: "qwen-3-235b", label: "Qwen3 235B", tag: "Free · Large" },
    ],
  },
];

const DEFAULT_PROVIDER = PROVIDERS[0];
const DEFAULT_MODEL = DEFAULT_PROVIDER.models[0];

// ── Quick Prompts ─────────────────────────────────────────────────────────────

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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`(.*?)`/g,
      "<code style=\"background:rgba(99,102,241,0.15);padding:1px 6px;border-radius:4px;font-family:'DM Mono',monospace;font-size:0.88em;\">$1</code>",
    )
    .replace(
      /^### (.+)$/gm,
      '<p style="font-weight:700;margin:10px 0 4px;font-size:0.78em;text-transform:uppercase;letter-spacing:0.06em;color:rgba(165,180,252,0.85);">$1</p>',
    )
    .replace(
      /^## (.+)$/gm,
      '<p style="font-weight:600;font-size:0.9em;margin:12px 0 5px;">$1</p>',
    )
    .replace(
      /^- (.+)$/gm,
      '<div style="display:flex;gap:6px;margin:3px 0;"><span style="color:rgba(129,140,248,0.7);flex-shrink:0;">•</span><span>$1</span></div>',
    )
    .replace(
      /^\d+\. (.+)$/gm,
      '<div style="display:flex;gap:6px;margin:3px 0;"><span style="color:rgba(129,140,248,0.7);flex-shrink:0;">›</span><span>$1</span></div>',
    )
    .replace(/\n\n+/g, '</p><p style="margin:8px 0 0;">')
    .replace(/\n/g, "<br/>");
}

// ── Provider/Model Selector ───────────────────────────────────────────────────

interface SelectorProps {
  selectedProvider: ProviderOption;
  selectedModel: ModelOption;
  isLoading: boolean;
  onSelect: (provider: ProviderOption, model: ModelOption) => void;
}

const ProviderModelSelector = ({
  selectedProvider,
  selectedModel,
  isLoading,
  onSelect,
}: SelectorProps) => {
  const [open, setOpen] = useState(false);
  const [hoveredProvider, setHoveredProvider] =
    useState<ProviderOption>(selectedProvider);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Keep hovered provider in sync when selected provider changes externally
  useEffect(() => {
    setHoveredProvider(selectedProvider);
  }, [selectedProvider]);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      {/* Trigger */}
      <button
        onClick={() => !isLoading && setOpen((v) => !v)}
        disabled={isLoading}
        className="flex items-center gap-1.5 mt-0.5 group/sel disabled:opacity-50"
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300"
          style={{ background: isLoading ? "#f59e0b" : selectedProvider.color }}
        />
        <span className="text-[10px] text-white/40 group-hover/sel:text-white/65 transition-colors flex items-center gap-0.5">
          {isLoading
            ? "Thinking…"
            : `${selectedProvider.label} · ${selectedModel.label}`}
          {!isLoading && <ChevronDown className="w-2.5 h-2.5" />}
        </span>
      </button>

      {/* Two-column dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1.5 z-20 flex rounded-xl overflow-hidden"
            style={{
              background: "rgba(13,12,26,0.98)",
              border: "0.5px solid rgba(99,102,241,0.22)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
              minWidth: 300,
            }}
          >
            {/* Provider column */}
            <div
              className="flex flex-col py-1.5 flex-shrink-0"
              style={{
                borderRight: "0.5px solid rgba(255,255,255,0.06)",
                minWidth: 112,
              }}
            >
              <p className="text-[9px] uppercase tracking-[0.08em] text-white/18 px-3 pb-1.5 pt-0.5">
                Provider
              </p>
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onMouseEnter={() => setHoveredProvider(p)}
                  onClick={() => {
                    onSelect(p, p.models[0]);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/[0.05]"
                  style={
                    hoveredProvider.id === p.id
                      ? { background: "rgba(255,255,255,0.05)" }
                      : undefined
                  }
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: p.color }}
                  />
                  <span
                    className="text-[11.5px]"
                    style={{
                      color:
                        selectedProvider.id === p.id
                          ? "rgba(255,255,255,0.85)"
                          : "rgba(255,255,255,0.45)",
                    }}
                  >
                    {p.label}
                  </span>
                  {selectedProvider.id === p.id && (
                    <span className="ml-auto w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Model column */}
            <div className="flex flex-col py-1.5 flex-1">
              <p className="text-[9px] uppercase tracking-[0.08em] text-white/18 px-3 pb-1.5 pt-0.5">
                Model
              </p>
              {hoveredProvider.models.map((m) => {
                const isActive =
                  selectedProvider.id === hoveredProvider.id &&
                  selectedModel.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelect(hoveredProvider, m);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between px-3 py-1.5 text-left hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{
                          background: isActive
                            ? hoveredProvider.color
                            : "rgba(255,255,255,0.2)",
                        }}
                      />
                      <span
                        className="text-[11.5px]"
                        style={{
                          color: isActive
                            ? "rgba(255,255,255,0.88)"
                            : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {m.label}
                      </span>
                    </div>
                    <span className="text-[9px] text-white/22 ml-2 flex-shrink-0">
                      {m.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Message Bubble ────────────────────────────────────────────────────────────

const MessageBubble = React.memo(({ message }: { message: Message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-violet-600"
            : "border border-indigo-500/30"
        }`}
        style={!isUser ? { background: "rgba(99,102,241,0.12)" } : undefined}
      >
        {isUser ? (
          <User className="w-3 h-3 text-white" />
        ) : (
          <Sparkles className="w-3 h-3 text-indigo-400" />
        )}
      </div>

      <div
        className={`group max-w-[80%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`px-3 py-2.5 rounded-2xl text-[12.5px] leading-relaxed break-words ${
            isUser ? "bg-indigo-600 text-white rounded-br-sm" : "rounded-bl-sm"
          }`}
          style={
            !isUser
              ? {
                  background: message.isError
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(255,255,255,0.05)",
                  border: `0.5px solid ${message.isError ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
                  color: message.isError
                    ? "rgba(252,165,165,0.9)"
                    : "rgba(255,255,255,0.85)",
                }
              : undefined
          }
          dangerouslySetInnerHTML={
            isUser
              ? undefined
              : {
                  __html: `<p style="margin:0;">${parseMarkdown(message.content)}</p>`,
                }
          }
        >
          {isUser ? message.content : undefined}
        </div>
        <div
          className={`flex items-center gap-1.5 px-0.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          <span className="text-[10px] text-white/20">
            {formatTime(message.timestamp)}
          </span>
          {!isUser && !message.isError && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-white/25 hover:text-white/60"
              title="Copy"
            >
              {copied ? (
                <Check className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <Copy className="w-2.5 h-2.5" />
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
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="flex items-end gap-2"
  >
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border border-indigo-500/30"
      style={{ background: "rgba(99,102,241,0.12)" }}
    >
      <Sparkles className="w-3 h-3 text-indigo-400" />
    </div>
    <div
      className="px-3 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce"
          style={{ animationDelay: `${i * 0.14}s`, animationDuration: "0.85s" }}
        />
      ))}
    </div>
  </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function AiAssistant({
  pageContext,
  placeholder = "Ask anything about Avexi…",
}: AiAssistantProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const [selectedProvider, setSelectedProvider] =
    useState<ProviderOption>(DEFAULT_PROVIDER);
  const [selectedModel, setSelectedModel] =
    useState<ModelOption>(DEFAULT_MODEL);
  const [privacyDismissed, setPrivacyDismissed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleProviderModelSelect = (
    provider: ProviderOption,
    model: ModelOption,
  ) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const firstName = user?.displayName?.split(" ")[0];
      setMessages([
        {
          id: uid(),
          role: "assistant",
          content: `Hello${firstName ? `, ${firstName}` : ""}! I'm your Avexi Assistant. Ask me about any Avexi tool, voter registration procedures, or document workflows.`,
          timestamp: Date.now(),
        },
      ]);
    }
    if (!isOpen) setPrivacyDismissed(false);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (content: string) => {
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
        const history = messages
          .filter((m) => !m.isError)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            messages: [...history, { role: "user", content: content.trim() }],
            pageContext: pageContext ?? null,
            userName: user?.displayName ?? null,
            provider: selectedProvider.id,
            model: selectedModel.id,
          }),
        });

        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to get a response.");

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: data.content || "Sorry, I couldn't generate a response.",
            timestamp: Date.now(),
          },
        ]);
        if (!isOpen) setHasUnread(true);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        const is429 =
          err.message?.includes("rate-limit") || err.message?.includes("429");
        const errorText = is429
          ? "The AI provider is rate-limited right now. Try switching to a different model or wait a moment."
          : "Sorry, I ran into an error. Please check your connection and try again.";
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: errorText,
            timestamp: Date.now(),
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [
      isLoading,
      messages,
      pageContext,
      user?.displayName,
      isOpen,
      selectedProvider,
      selectedModel,
    ],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setInput("");
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: "Conversation cleared. How can I help you?",
        timestamp: Date.now(),
      },
    ]);
  };

  const panelW = isExpanded ? 420 : 355;
  const panelH = isExpanded ? 600 : 488;
  const showQuickPrompts = messages.length <= 1 && !isLoading;

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(true)}
            title="Open Avexi Assistant"
            className="fixed bottom-6 right-6 z-[900] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow:
                "0 8px 28px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.25)",
            }}
          >
            <Sparkles className="w-5 h-5 text-white" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0f0e17] animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.93, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 14 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-[901] flex flex-col overflow-hidden"
            style={{
              width: panelW,
              height: panelH,
              background: "linear-gradient(155deg, #0d0d1a 0%, #0f0f1e 100%)",
              border: "0.5px solid rgba(99,102,241,0.18)",
              borderRadius: 18,
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(255,255,255,0.04)",
              transition: "width 0.22s ease, height 0.22s ease",
            }}
          >
            {/* Accent line — provider color */}
            <div
              className="h-[2px] flex-shrink-0 transition-all duration-500"
              style={{
                background: `linear-gradient(90deg, ${selectedProvider.color}, #8b5cf6, #a78bfa)`,
              }}
            />

            {/* Header */}
            <div
              className="flex items-center gap-2.5 px-3.5 py-3 flex-shrink-0"
              style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(99,102,241,0.14)",
                  border: "0.5px solid rgba(99,102,241,0.28)",
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-white/88 leading-tight">
                  Avexi Assistant
                </p>
                <ProviderModelSelector
                  selectedProvider={selectedProvider}
                  selectedModel={selectedModel}
                  isLoading={isLoading}
                  onSelect={handleProviderModelSelect}
                />
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleClear}
                  title="Clear"
                  className="p-1.5 rounded-lg text-white/25 hover:text-white/65 hover:bg-white/[0.05] transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsExpanded((v) => !v)}
                  title={isExpanded ? "Compact" : "Expand"}
                  className="p-1.5 rounded-lg text-white/25 hover:text-white/65 hover:bg-white/[0.05] transition-all"
                >
                  {isExpanded ? (
                    <Minimize2 className="w-3 h-3" />
                  ) : (
                    <Maximize2 className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.05] transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Privacy Banner */}
            <AnimatePresence>
              {!privacyDismissed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 mx-3 mt-2.5 rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(245,158,11,0.07)",
                    border: "0.5px solid rgba(245,158,11,0.28)",
                  }}
                >
                  <div className="flex items-start gap-2.5 px-3 py-2.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10.5px] font-semibold text-amber-300/90 leading-tight mb-0.5">
                        Privacy Notice
                      </p>
                      <p className="text-[10px] text-amber-200/55 leading-relaxed">
                        Do not share personal information such as passwords, ID
                        numbers, birthdates, or sensitive voter data in this
                        chat. Conversations may be processed by third-party AI
                        providers.
                      </p>
                    </div>
                    <button
                      onClick={() => setPrivacyDismissed(true)}
                      className="p-0.5 text-amber-400/40 hover:text-amber-300/80 transition-colors flex-shrink-0"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      border: "0.5px solid rgba(99,102,241,0.18)",
                    }}
                  >
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-[11px] text-white/28 text-center leading-relaxed">
                    Ask me about tools, voter registration,
                    <br />
                    or document workflows.
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <AnimatePresence>
                {isLoading && <TypingIndicator />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            <AnimatePresence>
              {showQuickPrompts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-shrink-0 px-3.5 pb-2"
                  style={{ borderTop: "0.5px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="text-[9.5px] uppercase tracking-[0.08em] text-white/18 py-2">
                    <span>Quick questions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        title={q}
                        className="text-left px-2.5 py-1.5 rounded-lg text-[10.5px] text-white/45 hover:text-white/75 transition-all truncate"
                        style={{
                          background: "rgba(255,255,255,0.025)",
                          border: "0.5px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input bar */}
            <div
              className="flex-shrink-0 px-3 py-2.5"
              style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "0.5px solid rgba(99,102,241,0.22)",
                }}
              >
                <Zap className="w-3 h-3 text-indigo-400/40 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-[12.5px] text-white/78 placeholder-white/20 focus:outline-none disabled:opacity-40"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{
                    background:
                      input.trim() && !isLoading
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : "rgba(255,255,255,0.05)",
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 text-white" />
                  )}
                </button>
              </div>
              <p className="text-[9.5px] text-white/13 text-center mt-1.5">
                {selectedProvider.label} · {selectedModel.label} · Avexi v5.0.0
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
