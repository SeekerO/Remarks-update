"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, Trash2, Pencil, RefreshCw,
  FileText, Filter, X, Save, ChevronDown,
  CloudUpload, Settings2, Check, AlertCircle,
  ArrowUpFromLine, ArrowDownToLine,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Direction = "OUTGOING" | "INCOMING";

interface LogEntry {
  rowIndex?: number;
  id: string;
  direction: Direction;
  cn: string;
  type: "R" | "E";
  year: number;
  num: number;
  date: string;
  subject: string;
  sender: string;
  notes: string;
  synced?: boolean;
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; msg: string }
  | { kind: "error"; msg: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n: number, l: number) {
  return String(n).padStart(l, "0");
}

function buildCN(type: "R" | "E", year: number, num: number) {
  return `KKK-${type}-${pad(year, 2)}-${pad(num, 4)}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
}

function currentYY() {
  return new Date().getFullYear() % 100;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Sheet Config Modal ────────────────────────────────────────────────────────

function SheetConfig({
  sheetId,
  onSave,
  onClose,
}: {
  sheetId: string;
  onSave: (id: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(sheetId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#0d0d1a] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/85">
              Google Sheets Configuration
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/30">
              Paste your Spreadsheet ID to enable cloud sync
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 block mb-1.5">
              Spreadsheet ID
            </label>
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMd..."
              className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                bg-gray-50 dark:bg-white/[0.03] text-sm text-gray-700 dark:text-white/70
                placeholder-gray-400 dark:placeholder-white/20 focus:outline-none
                focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors font-mono"
            />
            <p className="text-[10px] text-gray-400 dark:text-white/25 mt-1.5">
              From your Sheet URL: /spreadsheets/d/<span className="text-indigo-400">ID</span>/edit
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              Share the Sheet with the service account email as <strong>Editor</strong>.
              <strong> OUTGOING</strong> and <strong>INCOMING</strong> tabs will be created automatically if they don&apos;t exist.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.06]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
              text-gray-600 dark:text-white/50 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(val.trim()); onClose(); }}
            disabled={!val.trim()}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold
              disabled:opacity-40 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Entry Modal ───────────────────────────────────────────────────────────────

function EntryModal({
  initial,
  existingEntries,
  defaultDirection,
  onSave,
  onClose,
}: {
  initial?: Partial<LogEntry> & { id?: string };
  existingEntries: LogEntry[];
  defaultDirection: Direction;
  onSave: (entry: Omit<LogEntry, "id" | "rowIndex" | "synced">) => void;
  onClose: () => void;
}) {
  const isEdit = !!initial?.id;

  const nextNum = (type: "R" | "E", year: number, direction: Direction) => {
    const same = existingEntries.filter(
      (e) => e.type === type && e.year === year && e.direction === direction && e.id !== initial?.id
    );
    return same.length ? Math.max(...same.map((e) => e.num)) + 1 : 1;
  };

  const [form, setForm] = useState({
    direction: initial?.direction ?? defaultDirection,
    type: initial?.type ?? ("E" as "R" | "E"),
    year: initial?.year ?? currentYY(),
    num: initial?.num ?? 1,
    date: initial?.date ?? todayISO(),
    subject: initial?.subject ?? "",
    sender: initial?.sender ?? "",
    notes: initial?.notes ?? "",
  });

  const cn = buildCN(form.type, form.year, form.num);

  function set(k: string, v: any) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if ((k === "type" || k === "year" || k === "direction") && !isEdit) {
        next.num = nextNum(next.type, next.year, next.direction);
      }
      return next;
    });
  }

  const isOutgoing = form.direction === "OUTGOING";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#0d0d1a] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className={`h-0.5 bg-gradient-to-r ${isOutgoing ? "from-orange-400 to-rose-500" : "from-sky-400 to-indigo-500"}`} />
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isOutgoing
              ? "bg-orange-500/10 border border-orange-500/20"
              : "bg-sky-500/10 border border-sky-500/20"
          }`}>
            {isOutgoing
              ? <ArrowUpFromLine className="w-4 h-4 text-orange-400" />
              : <ArrowDownToLine className="w-4 h-4 text-sky-400" />
            }
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/85">
            {isEdit ? "Edit Entry" : "New Document Entry"}
          </p>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* Direction Picker */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 block mb-1.5">
              Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["OUTGOING", "INCOMING"] as Direction[]).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => set("direction", dir)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    form.direction === dir
                      ? dir === "OUTGOING"
                        ? "bg-orange-50 dark:bg-orange-500/10 border-orange-300 dark:border-orange-500/40 text-orange-600 dark:text-orange-300"
                        : "bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 text-sky-600 dark:text-sky-300"
                      : "border-black/[0.08] dark:border-white/[0.07] text-gray-400 dark:text-white/30 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  {dir === "OUTGOING"
                    ? <ArrowUpFromLine className="w-3.5 h-3.5" />
                    : <ArrowDownToLine className="w-3.5 h-3.5" />
                  }
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* CN Preview */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 block mb-1.5">
              Control Number (auto-generated)
            </label>
            <div className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-300">
              {cn}
            </div>
          </div>

          {/* Type + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 block mb-1.5">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                  bg-gray-50 dark:bg-white/[0.03] text-sm text-gray-700 dark:text-white/70
                  focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
              >
                <option value="E">E — Email</option>
                <option value="R">R — Release/Receiving</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 block mb-1.5">
                Year (YY)
              </label>
              <input
                type="number"
                min={20}
                max={99}
                value={form.year}
                onChange={(e) => set("year", parseInt(e.target.value) || currentYY())}
                className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                  bg-gray-50 dark:bg-white/[0.03] text-sm text-gray-700 dark:text-white/70
                  focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Document Number */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 block mb-1.5">
              Document Number (####)
            </label>
            <input
              type="number"
              min={1}
              max={9999}
              value={form.num}
              onChange={(e) => set("num", parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                bg-gray-50 dark:bg-white/[0.03] text-sm text-gray-700 dark:text-white/70 font-mono
                focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 block mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                bg-gray-50 dark:bg-white/[0.03] text-sm text-gray-700 dark:text-white/70
                focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 block mb-1.5">
              Subject of the Document
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="e.g. Monthly report submission"
              className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                bg-gray-50 dark:bg-white/[0.03] text-sm text-gray-700 dark:text-white/70
                placeholder-gray-400 dark:placeholder-white/20
                focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Sender */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 block mb-1.5">
              Name of Sender and Copy Furnished
            </label>
            <input
              type="text"
              value={form.sender}
              onChange={(e) => set("sender", e.target.value)}
              placeholder="e.g. Juan dela Cruz"
              className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                bg-gray-50 dark:bg-white/[0.03] text-sm text-gray-700 dark:text-white/70
                placeholder-gray-400 dark:placeholder-white/20
                focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 block mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional notes…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
                bg-gray-50 dark:bg-white/[0.03] text-sm text-gray-700 dark:text-white/70
                placeholder-gray-400 dark:placeholder-white/20 resize-none
                focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.06]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]
              text-gray-600 dark:text-white/50 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...form, cn })}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              isOutgoing ? "bg-orange-500 hover:bg-orange-400" : "bg-sky-600 hover:bg-sky-500"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {isEdit ? "Update Entry" : `Save to ${form.direction}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Bar ────────────────────────────────────────────────────────────────

function StatusBar({ status }: { status: Status }) {
  if (status.kind === "idle") return null;
  if (status.kind === "loading") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
        <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
        <span className="text-[11px] text-indigo-600 dark:text-indigo-300">Syncing with Google Sheets…</span>
      </div>
    );
  }
  if (status.kind === "success") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[11px] text-emerald-600 dark:text-emerald-300">{status.msg}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
      <span className="text-[11px] text-red-600 dark:text-red-300">{status.msg}</span>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function DocumentLogbookPage() {
  const [activeTab, setActiveTab] = useState<Direction>("OUTGOING");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<LogEntry | undefined>();
  const [sheetConfigOpen, setSheetConfigOpen] = useState(false);
  const [sheetId, setSheetId] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const statusTimer = useRef<ReturnType<typeof setTimeout>>("" as any);
  const isInitialLoad = useRef(true);
  const persistTimer = useRef<ReturnType<typeof setTimeout>>("" as any);
  const isWriting = useRef(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("doclog_sheet_id");
      if (saved) setSheetId(saved);
      const local = localStorage.getItem("doclog_entries_v3");
      if (local) setEntries(JSON.parse(local));
    } catch {}
    setTimeout(() => { isInitialLoad.current = false; }, 0);
  }, []);

  // Persist entries — debounced + write-guarded
  useEffect(() => {
    if (isInitialLoad.current) return;
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(async () => {
      if (isWriting.current) {
        persistTimer.current = setTimeout(() => { isWriting.current = false; }, 200);
        return;
      }
      isWriting.current = true;
      try {
        localStorage.setItem("doclog_entries_v3", JSON.stringify(entries));
      } catch {}
      isWriting.current = false;
    }, 150);
  }, [entries]);

  function showStatus(s: Status, clearAfter = 3000) {
    setStatus(s);
    clearTimeout(statusTimer.current);
    if (s.kind !== "loading") {
      statusTimer.current = setTimeout(() => setStatus({ kind: "idle" }), clearAfter);
    }
  }

  // ── Sheet sync: fetch both tabs ────────────────────────────────────────────

  const fetchFromSheet = useCallback(async () => {
    if (!sheetId) return;
    showStatus({ kind: "loading" });
    try {
      const [outRes, inRes] = await Promise.all([
        fetch(`/api/logbook?sheetId=${encodeURIComponent(sheetId)}&direction=OUTGOING`),
        fetch(`/api/logbook?sheetId=${encodeURIComponent(sheetId)}&direction=INCOMING`),
      ]);
      const [outData, inData] = await Promise.all([outRes.json(), inRes.json()]);
      if (!outRes.ok) throw new Error(outData.error);
      if (!inRes.ok) throw new Error(inData.error);

      const mapEntries = (raw: any[], dir: Direction): LogEntry[] =>
        raw.map((e: any) => ({
          id: uid(),
          rowIndex: e.rowIndex,
          direction: dir,
          cn: e.cn,
          type: e.type as "R" | "E",
          year: e.year,
          num: e.num,
          date: e.date,
          subject: e.subject,
          sender: e.sender,
          notes: e.notes,
          synced: true,
        }));

      setEntries([
        ...mapEntries(outData.entries, "OUTGOING"),
        ...mapEntries(inData.entries, "INCOMING"),
      ]);
      showStatus({
        kind: "success",
        msg: `Loaded ${outData.entries.length} outgoing + ${inData.entries.length} incoming.`,
      });
    } catch (err: any) {
      showStatus({ kind: "error", msg: `Failed to load: ${err.message}` });
    }
  }, [sheetId]);

  // ── Sheet sync: push ───────────────────────────────────────────────────────

  const pushEntry = useCallback(
    async (entry: LogEntry) => {
      if (!sheetId) return;
      const res = await fetch("/api/logbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId: sheetId, direction: entry.direction, entry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    },
    [sheetId]
  );

  const updateEntry = useCallback(
    async (entry: LogEntry) => {
      if (!sheetId || !entry.rowIndex) return;
      const res = await fetch("/api/logbook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: sheetId,
          direction: entry.direction,
          rowIndex: entry.rowIndex,
          entry,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    },
    [sheetId]
  );

  const deleteEntryFromSheet = useCallback(
    async (rowIndex: number, direction: Direction) => {
      if (!sheetId) return;
      const res = await fetch("/api/logbook", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId: sheetId, direction, rowIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    },
    [sheetId]
  );

  // ── Save handler ───────────────────────────────────────────────────────────

  const handleSave = useCallback(
    async (form: Omit<LogEntry, "id" | "rowIndex" | "synced">) => {
      if (editEntry) {
        const updated: LogEntry = { ...editEntry, ...form };
        setEntries((prev) => prev.map((e) => (e.id === editEntry.id ? updated : e)));
        setModalOpen(false);
        setEditEntry(undefined);

        if (sheetId && updated.rowIndex) {
          showStatus({ kind: "loading" });
          try {
            await updateEntry(updated);
            setEntries((prev) =>
              prev.map((e) => (e.id === updated.id ? { ...e, synced: true } : e))
            );
            showStatus({ kind: "success", msg: "Entry updated in Sheets." });
          } catch (err: any) {
            showStatus({ kind: "error", msg: `Sync failed: ${err.message}` });
          }
        }
      } else {
        const newEntry: LogEntry = { ...form, id: uid(), synced: false };
        setEntries((prev) => [newEntry, ...prev]);
        setModalOpen(false);

        if (sheetId) {
          showStatus({ kind: "loading" });
          try {
            await pushEntry(newEntry);
            await fetchFromSheet();
          } catch (err: any) {
            showStatus({ kind: "error", msg: `Sync failed: ${err.message}` });
          }
        }
      }
    },
    [editEntry, sheetId, pushEntry, updateEntry, fetchFromSheet]
  );

  // ── Delete handler ─────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (entry: LogEntry) => {
      if (!confirm("Delete this entry?")) return;
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));

      if (sheetId && entry.rowIndex) {
        showStatus({ kind: "loading" });
        try {
          await deleteEntryFromSheet(entry.rowIndex, entry.direction);
          await fetchFromSheet();
        } catch (err: any) {
          showStatus({ kind: "error", msg: `Delete sync failed: ${err.message}` });
        }
      }
    },
    [sheetId, deleteEntryFromSheet, fetchFromSheet]
  );

  // ── Derived data ───────────────────────────────────────────────────────────

  const tabEntries = entries.filter((e) => e.direction === activeTab);
  const years = [...new Set(tabEntries.map((e) => e.year))].sort((a, b) => b - a);
  const outCount = entries.filter((e) => e.direction === "OUTGOING").length;
  const inCount = entries.filter((e) => e.direction === "INCOMING").length;

  const filtered = tabEntries
    .filter((e) => {
      if (filterType && e.type !== filterType) return false;
      if (filterYear && String(e.year) !== filterYear) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.cn.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.sender.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.num - a.num;
    });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full w-full bg-gray-50 dark:bg-[#0f0e17] overflow-y-auto">

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0f0e17]/80 backdrop-blur-md
        border-b border-black/[0.06] dark:border-white/[0.06] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-800 dark:text-white/85">
                Document Logbook
              </h1>
              <p className="text-[11px] text-gray-400 dark:text-white/30">
                KKK-R/E-YY-#### control numbers
                {sheetId && (
                  <span className="ml-2 text-emerald-500 dark:text-emerald-400">· Sheets connected</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSheetConfigOpen(true)}
              title="Configure Google Sheets"
              className={`p-2 rounded-xl border transition-all ${
                sheetId
                  ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-white/[0.04] text-gray-400 dark:text-white/30 hover:text-indigo-500"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>

            {sheetId && (
              <button
                onClick={fetchFromSheet}
                disabled={status.kind === "loading"}
                title="Sync from Google Sheets"
                className="p-2 rounded-xl border border-black/[0.08] dark:border-white/[0.06]
                  bg-white dark:bg-white/[0.04] text-gray-400 dark:text-white/30
                  hover:text-indigo-500 dark:hover:text-indigo-400
                  hover:border-indigo-300 dark:hover:border-indigo-500/40
                  disabled:opacity-40 transition-all"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${status.kind === "loading" ? "animate-bounce" : ""}`} />
              </button>
            )}

            <button
              onClick={() => { setEditEntry(undefined); setModalOpen(true); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-all ${
                activeTab === "OUTGOING"
                  ? "bg-orange-500 hover:bg-orange-400"
                  : "bg-sky-600 hover:bg-sky-500"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Entry
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">

        {/* Status bar */}
        <StatusBar status={status} />

        {/* ── Tab Switcher ── */}
        <div className="flex gap-1 p-1 bg-white dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-2xl w-fit">
          {(["OUTGOING", "INCOMING"] as Direction[]).map((dir) => {
            const count = dir === "OUTGOING" ? outCount : inCount;
            const isActive = activeTab === dir;
            return (
              <button
                key={dir}
                onClick={() => {
                  setActiveTab(dir);
                  setFilterType("");
                  setFilterYear("");
                  setSearch("");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? dir === "OUTGOING"
                      ? "bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-300 shadow-sm"
                      : "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-300 shadow-sm"
                    : "text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50"
                }`}
              >
                {dir === "OUTGOING"
                  ? <ArrowUpFromLine className="w-3.5 h-3.5" />
                  : <ArrowDownToLine className="w-3.5 h-3.5" />
                }
                {dir}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive
                    ? dir === "OUTGOING"
                      ? "bg-orange-100 dark:bg-orange-500/20 text-orange-500 dark:text-orange-300"
                      : "bg-sky-100 dark:bg-sky-500/20 text-sky-500 dark:text-sky-300"
                    : "bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/25"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/25" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab.toLowerCase()} entries…`}
              className="w-full bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06]
                rounded-xl pl-9 pr-8 py-2 text-sm text-gray-700 dark:text-white/70
                placeholder-gray-400 dark:placeholder-white/20
                focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-white/20 hover:text-gray-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-white/25" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06]
                rounded-xl pl-7 pr-7 py-2 text-sm text-gray-700 dark:text-white/70
                focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
            >
              <option value="">All types</option>
              <option value="R">R — Release/Receiving</option>
              <option value="E">E — Email</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-white/25 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="appearance-none bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06]
                rounded-xl pl-3 pr-7 py-2 text-sm text-gray-700 dark:text-white/70
                focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>20{pad(y, 2)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-white/25 pointer-events-none" />
          </div>

          <span className="ml-auto text-xs text-gray-400 dark:text-white/30 whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* ── Table ── */}
        {filtered.length > 0 ? (
          <div className="bg-white dark:bg-white/[0.02] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[180px_56px_88px_1fr_1fr_120px_36px] gap-3 px-4 py-2.5
              border-b border-black/[0.06] dark:border-white/[0.06]
              bg-gray-50/80 dark:bg-white/[0.02]">
              {["Control Number", "Type", "Date", "Subject", "Sender / Copy", "Notes", ""].map((h) => (
                <div key={h} className="text-[10px] font-semibold uppercase tracking-[0.07em] text-gray-400 dark:text-white/25">
                  {h}
                </div>
              ))}
            </div>

            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[180px_56px_88px_1fr_1fr_120px_36px] gap-3 px-4 py-3
                  border-b border-black/[0.04] dark:border-white/[0.04] last:border-0
                  hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors group items-center"
              >
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold w-fit ${
                  entry.type === "E"
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                }`}>
                  {entry.cn}
                </span>

                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${
                  entry.type === "E"
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                }`}>
                  {entry.type}
                </span>

                <span className="text-[11px] text-gray-500 dark:text-white/40 font-mono truncate">
                  {entry.date || "—"}
                </span>

                <span className="text-xs text-gray-700 dark:text-white/70 truncate" title={entry.subject}>
                  {entry.subject || "—"}
                </span>

                <span className="text-xs text-gray-500 dark:text-white/50 truncate" title={entry.sender}>
                  {entry.sender || "—"}
                </span>

                <span className="text-[11px] text-gray-400 dark:text-white/30 truncate" title={entry.notes}>
                  {entry.notes || "—"}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditEntry(entry); setModalOpen(true); }}
                    className="p-1 rounded-md text-gray-400 hover:text-indigo-500 hover:bg-indigo-50
                      dark:hover:bg-indigo-500/10 transition-all"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50
                      dark:hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${
              activeTab === "OUTGOING"
                ? "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20"
                : "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20"
            }`}>
              {activeTab === "OUTGOING"
                ? <ArrowUpFromLine className="w-6 h-6 text-orange-300 dark:text-orange-400/50" />
                : <ArrowDownToLine className="w-6 h-6 text-sky-300 dark:text-sky-400/50" />
              }
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-white/40">
              {search || filterType || filterYear
                ? "No entries match your filters"
                : `No ${activeTab.toLowerCase()} entries yet`}
            </p>
            <p className="text-xs text-gray-400 dark:text-white/25 mt-1">
              {search || filterType || filterYear
                ? "Try clearing your filters"
                : sheetId
                  ? "Sync from Sheets or add a new entry"
                  : 'Click "Add Entry" to get started'}
            </p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modalOpen && (
        <EntryModal
          initial={editEntry}
          existingEntries={entries}
          defaultDirection={activeTab}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditEntry(undefined); }}
        />
      )}

      {sheetConfigOpen && (
        <SheetConfig
          sheetId={sheetId}
          onSave={(id) => {
            setSheetId(id);
            try { localStorage.setItem("doclog_sheet_id", id); } catch {}
          }}
          onClose={() => setSheetConfigOpen(false)}
        />
      )}
    </div>
  );
}