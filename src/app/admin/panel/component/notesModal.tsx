"use client";

import { useState, useEffect } from "react";
import { X, StickyNote, Save, Trash2, Loader2 } from "lucide-react";
import { UserProfile } from "@/lib/types/adminTypes";

interface NotesModalProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (uid: string, notes: string) => Promise<void>;
}

export default function NotesModal({ user, onClose, onSave }: NotesModalProps) {
  const [notes, setNotes] = useState(user.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const MAX_CHARS = 500;

  useEffect(() => {
    setCharCount(notes.length);
  }, [notes]);

  const handleSave = async () => {
    if (notes.length > MAX_CHARS) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSave(user.uid, notes.trim());
      onClose();
    } catch {
      setSaveError("Failed to save notes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#0d0d1a] border border-black/[0.08]
        dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
      >
        {/* Accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-amber-400 to-orange-500" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <StickyNote className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/85">
              Admin Notes
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/30 truncate mt-0.5">
              {user.displayName} · {user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 dark:text-white/30
              hover:text-gray-600 dark:hover:text-white/70 hover:bg-gray-100
              dark:hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-[11px] text-gray-400 dark:text-white/30">
            Private notes visible only to administrators. Useful for tracking
            context, requests, or reminders about this user.
          </p>

          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this user…"
              rows={6}
              maxLength={MAX_CHARS}
              className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                bg-gray-50 dark:bg-white/[0.03] text-sm text-gray-700 dark:text-white/70
                placeholder-gray-400 dark:placeholder-white/20
                focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/50
                resize-none transition-colors leading-relaxed"
            />
            <div
              className={`absolute bottom-2 right-2.5 text-[10px] font-mono ${
                charCount > MAX_CHARS * 0.9
                  ? charCount >= MAX_CHARS
                    ? "text-red-400"
                    : "text-amber-400"
                  : "text-gray-300 dark:text-white/20"
              }`}
            >
              {charCount}/{MAX_CHARS}
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-[11px] text-red-400">{saveError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.06]">
          {notes.trim().length > 0 && (
            <button
              onClick={handleClear}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                text-gray-400 dark:text-white/30 text-xs hover:bg-red-50 hover:text-red-500
                dark:hover:bg-red-500/10 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/20
                disabled:opacity-40 transition-all"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
              text-gray-600 dark:text-white/50 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04]
              disabled:opacity-40 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || charCount > MAX_CHARS}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold
              disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Notes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}