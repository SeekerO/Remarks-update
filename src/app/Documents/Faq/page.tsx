"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";
import BreadCrumb from "@/app/component/not_using_breadcrumb";
import TimerSettingsModal from "./component/TimeSetter";
import { Search, Clock, Copy, Check, RotateCcw, ChevronDown, Plus, Trash2, Save, X, Timer } from "lucide-react";
import { FaRegFileImage, FaFileAlt } from "react-icons/fa";
import Logo from "@/../public/Avexi.png"
import Image from "next/image";
import {
  type FaqItem,
  subscribeToFaqs,
  addFaq,
  updateFaq,
  deleteFaq,
  setFaqTimer,
} from "@/lib/firebase/firebase.actions.firestore/faqFirestore";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (totalSeconds: number): string => {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}



// ── Timer Ring ────────────────────────────────────────────────────────────────
function TimerRing({ remaining, total, size = 36 }: { remaining: number; total: number; size?: number }) {
  const pct = Math.max(0, Math.min(1, remaining / total));
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const isLow = pct < 0.2;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={isLow ? "#ef4444" : "#6366f1"} strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
      />
    </svg>
  );
}

// ── FAQ Card ──────────────────────────────────────────────────────────────────
function FaqCard({
  faq,
  isExpanded,
  isEditing,
  editFormData,
  currentTime,
  globalTimerDuration,
  onToggleExpand,
  onCopy,
  onResetTimer,
  onEditClick,
  onSaveClick,
  onEditFormChange,
  onDeleteRequest,
}: {
  faq: FaqItem;
  isExpanded: boolean;
  isEditing: boolean;
  editFormData: Pick<FaqItem, "topic" | "details">;
  currentTime: number;
  globalTimerDuration: number;
  onToggleExpand: () => void;
  onCopy: (faq: FaqItem) => void;
  onResetTimer: (faq: FaqItem) => void;
  onEditClick: (faq: FaqItem) => void;
  onSaveClick: (id: string) => void;
  onEditFormChange: (field: "topic" | "details", value: string) => void;
  onDeleteRequest: (id: string) => void;
}) {
  const elapsed = faq.timerStartTime ? (currentTime - faq.timerStartTime) / 1000 : 0;
  const remaining = globalTimerDuration - elapsed;
  const canCopy = !faq.timerStartTime || remaining <= 0;
  const isLow = !canCopy && remaining < globalTimerDuration * 0.2;
  const id = faq.id!;

  return (
    <div className={`
      group relative rounded-2xl border transition-all duration-300 overflow-hidden
      ${canCopy
        ? "bg-[#0d0d1a] border-white/[0.08] hover:border-indigo-500/40"
        : isLow
          ? "bg-[#0d0d1a] border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.08)]"
          : "bg-[#0d0d1a] border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.08)]"
      }
    `}>
      {/* Active timer accent bar */}
      {!canCopy && (
        <div
          className={`absolute top-0 left-0 h-0.5 transition-all duration-1000 ${isLow ? "bg-red-500" : "bg-indigo-500"}`}
          style={{ width: `${Math.max(0, (remaining / globalTimerDuration)) * 100}%` }}
        />
      )}

      {/* Card header */}
      <div className="flex items-center gap-3 p-4">

        {/* Timer ring or copy indicator */}
        <div className="shrink-0">
          {!canCopy ? (
            <div className="relative flex items-center justify-center">
              <TimerRing remaining={remaining} total={globalTimerDuration} size={36} />
              <span className={`absolute text-[8px] font-bold font-mono ${isLow ? "text-red-400" : "text-indigo-300"}`}>
                {Math.ceil(remaining)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => onCopy(faq)}
              className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center
                hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all group/copy"
              title="Copy & start timer"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400 group-hover/copy:text-indigo-300" />
            </button>
          )}
        </div>

        {/* Topic */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editFormData.topic}
              onChange={(e) => onEditFormChange("topic", e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5
                text-sm font-semibold text-white focus:outline-none focus:border-indigo-500/50"
            />
          ) : (
            <button
              onClick={() => onCopy(faq)}
              disabled={!canCopy}
              className="text-left w-full group/title"
              title={canCopy ? "Click to copy & start timer" : `Timer active — ${Math.ceil(remaining)}s left`}
            >
              <p className={`text-sm font-semibold truncate transition-colors
                ${canCopy
                  ? "text-white group-hover/title:text-indigo-300"
                  : isLow ? "text-red-400" : "text-indigo-300"
                }`}>
                {faq.topic}
              </p>
              {!canCopy && (
                <p className={`text-[10px] font-mono mt-0.5 ${isLow ? "text-red-500" : "text-indigo-500"}`}>
                  {formatTime(Math.max(0, remaining))}
                </p>
              )}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={() => onSaveClick(id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20
                  text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-all"
              >
                <Save className="w-3 h-3" /> Save
              </button>
              <button
                onClick={() => onEditClick(faq)} // toggles off
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              {!canCopy && (
                <button
                  onClick={() => onResetTimer(faq)}
                  className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400
                    hover:bg-amber-500/20 transition-all"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => onEditClick(faq)}
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40
                  hover:text-white/70 hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-all"
                title="Edit"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDeleteRequest(id)}
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40
                  hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggleExpand}
                className={`p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40
                  hover:text-white/70 transition-all ${isExpanded ? "bg-white/[0.08] text-white/70" : ""}`}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <div className={`transition-all duration-400 ease-in-out overflow-hidden ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4 pt-0">
          <div className="h-px bg-white/[0.06] mb-3" />
          {isEditing ? (
            <textarea
              value={editFormData.details}
              onChange={(e) => onEditFormChange("details", e.target.value)}
              rows={8}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5
                text-xs text-white/70 font-mono leading-relaxed resize-y
                focus:outline-none focus:border-indigo-500/50"
            />
          ) : (
            <pre className="text-xs text-white/60 font-mono leading-relaxed whitespace-pre-wrap select-none">
              {faq.details}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add FAQ Modal ─────────────────────────────────────────────────────────────
function AddFaqModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (data: Pick<FaqItem, "topic" | "details">) => void;
}) {
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");

  const handleAdd = () => {
    if (!topic.trim() || !details.trim()) return;
    onAdd({ topic, details });
    setTopic("");
    setDetails("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-[#0d0d1a] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-base font-bold text-white">New FAQ Entry</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. KUNG WALANG VALID ID"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5
                text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5">Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={6}
              placeholder="Paste the full response here..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5
                text-sm text-white/70 font-mono placeholder-white/20 resize-y
                focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!topic.trim() || !details.trim()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold
                disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Add Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({
  open, topic, onConfirm, onCancel,
}: { open: boolean; topic: string; onConfirm: () => void; onCancel: () => void; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-[#0d0d1a] border border-red-500/20 rounded-2xl shadow-2xl p-6 z-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">Delete Entry</h3>
        <p className="text-sm text-white/40 mb-5">
          Delete <span className="text-white/70 font-medium">"{topic}"</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:bg-white/[0.04] transition-all">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  if (!message) return null;
  const isSuccess = message.toLowerCase().includes("copied") || message.toLowerCase().includes("saved") || message.toLowerCase().includes("added") || message.toLowerCase().includes("reset") || message.toLowerCase().includes("deleted");
  return (
    <div className={`fixed top-5 right-5 z-[999] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium
      ${isSuccess
        ? "bg-[#0d0d1a] border-indigo-500/30 text-indigo-300"
        : "bg-[#0d0d1a] border-red-500/30 text-red-400"
      } animate-in slide-in-from-top-2 duration-300`}>
      {isSuccess ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const FAQ = () => {
  const { user } = useAuth();

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Pick<FaqItem, "topic" | "details">>({ topic: "", details: "" });
  const [globalTimerDuration, setGlobalTimerDuration] = useState(300);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);

  const showMessage = (msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  };

  useEffect(() => {
    const unsub = subscribeToFaqs((liveFaqs) => { setFaqs(liveFaqs); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("globalTimerDuration");
    if (saved) setGlobalTimerDuration(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    localStorage.setItem("globalTimerDuration", globalTimerDuration.toString());
  }, [globalTimerDuration]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      faqs.forEach((faq) => {
        if (faq.timerStartTime !== null && faq.timerStartTime !== undefined && faq.id) {
          const elapsed = (Date.now() - faq.timerStartTime) / 1000;
          if (globalTimerDuration - elapsed <= 0) {
            setFaqTimer(faq.id, null).catch(console.error);
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [faqs, globalTimerDuration]);

  const copyToClipboard = useCallback(async (faq: FaqItem) => {
    if (!faq.id) return;
    const elapsed = faq.timerStartTime ? (currentTime - faq.timerStartTime) / 1000 : 0;
    const remaining = globalTimerDuration - elapsed;
    if (faq.timerStartTime !== null && remaining > 0) {
      showMessage(`Timer active — ${Math.ceil(remaining)}s remaining`);
      return;
    }
    try {
      await navigator.clipboard.writeText(faq.details);
      showMessage("Copied to clipboard!");
    } catch { showMessage("Failed to copy."); return; }
    if (!faq.timerStartTime) {
      await setFaqTimer(faq.id, Date.now());
    }
  }, [currentTime, globalTimerDuration]);

  const handleEditClick = useCallback((faq: FaqItem) => {
    if (!faq.id) return;
    if (editingCard === faq.id) { setEditingCard(null); return; }
    setEditingCard(faq.id);
    setEditFormData({ topic: faq.topic, details: faq.details });
    setExpandedCard(faq.id);
  }, [editingCard]);

  const handleSaveClick = useCallback(async (id: string) => {
    try {
      await updateFaq(id, { topic: editFormData.topic.trim(), details: editFormData.details.trim() });
      setEditingCard(null);
      showMessage("Changes saved!");
    } catch { showMessage("Failed to save changes."); }
  }, [editFormData]);

  const handleResetTimer = useCallback(async (faq: FaqItem) => {
    if (!faq.id) return;
    await setFaqTimer(faq.id, null);
    showMessage("Timer reset");
  }, []);

  const handleAddFaq = useCallback(async (data: Pick<FaqItem, "topic" | "details">) => {
    try {
      await addFaq({ ...data, timerStartTime: null });
      setIsAddModalOpen(false);
      showMessage("Entry added!");
    } catch { showMessage("Failed to add entry."); }
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!faqToDelete) return;
    try {
      await deleteFaq(faqToDelete);
      showMessage("Entry deleted");
      setIsDeleteModalOpen(false);
      setFaqToDelete(null);
    } catch { showMessage("Failed to delete."); }
  }, [faqToDelete]);

  const handleApplyTimer = useCallback(() => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    setGlobalTimerDuration(h * 3600 + m * 60 + s);
    setIsTimerModalOpen(false);
    showMessage(`Timer set to ${h}h ${m}m ${s}s`);
  }, [hours, minutes, seconds]);

  const filteredFaqs = useMemo(() => {
    if (!debouncedSearchQuery) return faqs;
    return faqs.filter((f) =>
      f.topic.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [faqs, debouncedSearchQuery]);

  const activeTimers = faqs.filter(f => f.timerStartTime !== null && f.timerStartTime !== undefined).length;

  if (!user || (user as any)?.canChat === false) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#070710]">
        <div className="text-center">
          <Image src={Logo} alt="Dosmos" width={32} />
          <p className="mt-4 text-sm text-white/40">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in to access FAQ
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#070710] overflow-hidden">

      {/* Radial background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.5) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle at 0% 100%, rgba(99,102,241,0.4) 0%, transparent 60%)" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-w-4xl w-full mx-auto px-6 py-6">

        {/* Breadcrumb */}
        <div className="mb-4"><BreadCrumb /></div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <FaFileAlt className="w-4 h-4 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">FAQ</h1>
              {activeTimers > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                  bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                  <Timer className="w-2.5 h-2.5" />
                  {activeTimers} active
                </span>
              )}
            </div>
            <p className="text-xs text-white/30">Click any entry to copy · timer prevents repeat answers</p>
          </div>

          {/* Live clock */}
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-white tabular-nums">
              {new Date(currentTime).toLocaleTimeString()}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">
              Timer: {formatTime(globalTimerDuration)}
            </p>
          </div>
        </div>

        {/* Search & actions */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl
                pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20
                focus:outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500
              text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>

          <button
            onClick={() => setIsTimerModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]
              text-white/50 hover:text-white/80 hover:bg-white/[0.08] text-sm transition-all"
            title="Set timer duration"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-5 text-[11px] text-white/30">
          <span>
            <span className="text-white/60 font-semibold">{filteredFaqs.length}</span>
            {" "}entries{searchQuery && ` matching "${searchQuery}"`}
          </span>
          {activeTimers > 0 && (
            <>
              <span className="w-px h-3 bg-white/10" />
              <span className="text-indigo-400">
                <span className="font-semibold">{activeTimers}</span> timer{activeTimers !== 1 ? "s" : ""} running
              </span>
            </>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Image src={Logo} alt="Dosmos" width={28} />
              <p className="text-sm text-white/30 animate-pulse">Loading from Firestore…</p>
            </div>
          </div>
        )}

        {/* FAQ list */}
        {!loading && (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1
            [&::-webkit-scrollbar]:w-1
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-white/10
            [&::-webkit-scrollbar-thumb]:rounded-full">

            {filteredFaqs.length > 0 ? filteredFaqs.map((faq) => {
              const id = faq.id!;
              return (
                <FaqCard
                  key={id}
                  faq={faq}
                  isExpanded={expandedCard === id}
                  isEditing={editingCard === id}
                  editFormData={editFormData}
                  currentTime={currentTime}
                  globalTimerDuration={globalTimerDuration}
                  onToggleExpand={() => setExpandedCard(expandedCard === id ? null : id)}
                  onCopy={copyToClipboard}
                  onResetTimer={handleResetTimer}
                  onEditClick={handleEditClick}
                  onSaveClick={handleSaveClick}
                  onEditFormChange={(field, value) => setEditFormData(p => ({ ...p, [field]: value }))}
                  onDeleteRequest={(id) => { setFaqToDelete(id); setIsDeleteModalOpen(true); }}
                />
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-sm font-semibold text-white/40">No results</p>
                <p className="text-xs text-white/20 mt-1">Try a different search term</p>
              </div>
            )}

            {/* Bottom padding */}
            <div className="h-6" />
          </div>
        )}
      </div>

      {/* Modals & overlays */}
      <Toast message={message} />

      <TimerSettingsModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        hours={hours} setHours={setHours}
        minutes={minutes} setMinutes={setMinutes}
        seconds={seconds} setSeconds={setSeconds}
        onApply={handleApplyTimer}
      />

      <AddFaqModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddFaq}
      />

      <DeleteModal
        open={isDeleteModalOpen}
        topic={faqs.find(f => f.id === faqToDelete)?.topic || ""}
        onConfirm={confirmDelete}
        onCancel={() => { setIsDeleteModalOpen(false); setFaqToDelete(null); }}
      />
    </div>
  );
};

export default FAQ;