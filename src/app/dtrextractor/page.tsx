"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileCog } from "lucide-react"
// ─── Types ────────────────────────────────────────────────────────────────────
interface DtrRow { day: number; morningIn: string; lunchOut: string; afternoonOut: string; }
interface Employee {
    id: string;
    file: File;
    previewUrl: string;
    name: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    statusMsg: string;
    data: DtrRow[];
    rawText: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toBase64 = (file: File): Promise<{ base64: string; mediaType: string }> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const [header, base64] = result.split(',');
            const mediaType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
            resolve({ base64, mediaType });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const ensure24Hour = (t: string): string => {
    if (!t || !t.includes(':')) return t;
    const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return t;
    let [, hours, minutes, modifier] = match;
    let h = parseInt(hours, 10);
    if (modifier) {
        if (modifier.toUpperCase() === 'PM' && h < 12) h += 12;
        if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;
    }
    return `${h.toString().padStart(2, '0')}:${minutes}`;
};

const uid = () => Math.random().toString(36).slice(2, 9);

const parseRows = (text: string): DtrRow[] | null => {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    let parsed: any[] | null = null;
    try { const p = JSON.parse(cleaned); if (Array.isArray(p)) parsed = p; } catch { }
    if (!parsed) { const m = cleaned.match(/\[[\s\S]*\]/); if (m) { try { parsed = JSON.parse(m[0]); } catch { } } }
    if (!parsed) { const objs = cleaned.match(/\{[\s\S]*?\}/g); if (objs) { try { parsed = JSON.parse('[' + objs.join(',') + ']'); } catch { } } }
    return parsed;
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ msg }: { msg: string }) => {
    const type = msg.startsWith('✓') || msg.startsWith('✅') ? 'success'
        : msg.startsWith('⚠') ? 'warn'
            : msg.startsWith('❌') ? 'error'
                : 'info';

    const cls = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-700/50 dark:text-emerald-300',
        warn: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/60 dark:border-yellow-700/50 dark:text-yellow-300',
        error: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/60 dark:border-red-700/50 dark:text-red-300',
        info: 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse dark:bg-indigo-950/60 dark:border-indigo-700/50 dark:text-indigo-300',
    }[type];

    return (
        <div className={`font-dm-mono rounded-xl px-4 py-2.5 text-xs border animate-fade-up ${cls}`}>
            {msg}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TimeCardExtractor: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [sheetId, setSheetId] = useState('');
    const [sheetName, setSheetName] = useState('Sheet1');
    const [transferring, setTransferring] = useState(false);
    const [transferMsg, setTransferMsg] = useState('');
    const [date, setDate] = useState(() => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
    });
    const [supervisorName, setSupervisorName] = useState('');
    const dropRef = useRef<HTMLDivElement>(null);

    const active = employees.find(e => e.id === activeId) ?? null;

    useEffect(() => {
        try {
            const s = localStorage.getItem('dtr-preset');
            if (s) {
                const p = JSON.parse(s);
                setSheetId(p.sheetId ?? '');
                setSheetName(p.sheetName ?? 'Sheet1');
                setSupervisorName(p.supervisor ?? '');
            }
        } catch { }
    }, []);

    const savePreset = () => {
        localStorage.setItem('dtr-preset', JSON.stringify({ sheetId, sheetName, supervisor: supervisorName }));
        alert('✅ Preset saved!');
    };

    // ── Process one file ────────────────────────────────────────────────────────
    const processFile = useCallback(async (file: File) => {
        const id = uid();
        const emp: Employee = {
            id, file,
            previewUrl: URL.createObjectURL(file),
            name: file.name.replace(/\.[^.]+$/, ''),
            status: 'pending',
            statusMsg: 'Queued…',
            data: [],
            rawText: '',
        };
        setEmployees(prev => [...prev, emp]);
        setActiveId(id);

        const update = (patch: Partial<Employee>) =>
            setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

        update({ status: 'processing', statusMsg: 'Scanning DTR…' });

        try {
            const { base64, mediaType } = await toBase64(file);
            const response = await fetch('/api/dtr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        content: [
                            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
                            {
                                type: 'text',
                                text: `This is a Daily Time Record (DTR) form.
Extract only 3 time values per row: Morning In, Lunch/Noon break, and Afternoon Out.
Return ONLY a valid JSON array. No explanation, no markdown, no backticks.
Convert all times to 24-hour format.
Format: [{"day": 1, "morningIn": "08:00", "lunchOut": "12:00", "afternoonOut": "17:00"}, ...]
Rules:
- "morningIn" = first column (arrival time)
- "lunchOut" = middle break time
- "afternoonOut" = last column (departure time)
- Include ALL 31 DAYS; use "" for empty fields
- day must be a number (1–31)`,
                            }
                        ]
                    }]
                })
            });

            const data = await response.json();
            const text: string = data.content?.[0]?.text ?? '';
            if (!text) { update({ status: 'error', statusMsg: '⚠ Empty response from API.', rawText: '' }); return; }
            const parsed = parseRows(text);
            if (!parsed) { update({ status: 'error', statusMsg: '⚠ Could not parse JSON. See raw output.', rawText: text }); return; }
            update({ status: 'done', statusMsg: `✓ Extracted ${parsed.length} entries`, data: parsed, rawText: text });
        } catch (err: any) {
            update({ status: 'error', statusMsg: '❌ ' + err.message });
        }
    }, []);

    // ── File handlers ───────────────────────────────────────────────────────────
    const handleFiles = (files: FileList | File[]) => {
        Array.from(files).forEach(f => { if (f.type.startsWith('image/')) processFile(f); });
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    // ── Edit cell ───────────────────────────────────────────────────────────────
    const editCell = (empId: string, day: number, field: keyof DtrRow, value: string) => {
        setEmployees(prev => prev.map(e => {
            if (e.id !== empId) return e;
            const existing = e.data.find(r => r.day === day);
            const newRow: DtrRow = existing
                ? { ...existing, [field]: value }
                : { day, morningIn: '', lunchOut: '', afternoonOut: '', [field]: value };
            return { ...e, data: [...e.data.filter(r => r.day !== day), newRow].sort((a, b) => a.day - b.day) };
        }));
    };

    // ── Exports ─────────────────────────────────────────────────────────────────
    const exportCSV = (emp: Employee) => {
        const rows = Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const row = emp.data.find(r => Number(r.day) === day);
            return [String(day).padStart(2, '0'), ensure24Hour(row?.morningIn ?? ''), ensure24Hour(row?.lunchOut ?? ''), ensure24Hour(row?.afternoonOut ?? '')];
        });
        const csv = ['Day,Morning In,Lunch,Afternoon Out', ...rows.map(r => r.join(','))].join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `DTR_${emp.name}.csv`;
        a.click();
    };

    const exportAllCSV = () => {
        const header = 'Employee,Day,Morning In,Lunch,Afternoon Out';
        const lines = employees.flatMap(emp =>
            Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const row = emp.data.find(r => Number(r.day) === day);
                return [emp.name, String(day).padStart(2, '0'), ensure24Hour(row?.morningIn ?? ''), ensure24Hour(row?.lunchOut ?? ''), ensure24Hour(row?.afternoonOut ?? '')].join(',');
            })
        );
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([[header, ...lines].join('\n')], { type: 'text/csv' }));
        a.download = `DTR_All_${date}.csv`;
        a.click();
    };

    const exportXLSX = async (emp: Employee) => {
        const XLSX = await import('xlsx');
        const rows = Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const row = emp.data.find(r => Number(r.day) === day);
            return { Day: String(day).padStart(2, '0'), 'Morning In': ensure24Hour(row?.morningIn ?? ''), 'Lunch': ensure24Hour(row?.lunchOut ?? ''), 'Afternoon Out': ensure24Hour(row?.afternoonOut ?? '') };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'DTR');
        XLSX.writeFile(wb, `DTR_${emp.name}.xlsx`);
    };

    // ── Google Sheets ────────────────────────────────────────────────────────────
    const sendToSheets = async () => {
        if (!active) return;
        if (!sheetId) { setTransferMsg('❌ Please enter a Spreadsheet ID.'); return; }
        if (!sheetName) { setTransferMsg('❌ Please enter a Sheet name.'); return; }
        setTransferring(true); setTransferMsg('📤 Sending…');
        try {
            const res = await fetch('/api/dtr/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: active.data, sheetId, sheetName, date, name: active.name, supervisor: supervisorName }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error ?? 'Unknown error');
            setTransferMsg(`✅ Transferred ${result.rowsWritten} rows to "${sheetName}"!`);
        } catch (err: any) {
            setTransferMsg('❌ ' + err.message);
        } finally {
            setTransferring(false);
        }
    };

    const statusIcon = (s: Employee['status']) =>
        s === 'done' ? '✓' : s === 'error' ? '✗' : s === 'processing' ? '⟳' : '○';

    const statusIconClass = (s: Employee['status']) =>
        s === 'done' ? 'text-emerald-500 dark:text-emerald-400'
            : s === 'error' ? 'text-red-500 dark:text-red-400'
                : s === 'processing' ? 'text-indigo-500 dark:text-indigo-400 animate-spin inline-block'
                    : 'text-slate-400 dark:text-slate-600';

    const configFields = [
        { label: 'Spreadsheet ID', value: sheetId, setter: setSheetId, placeholder: '1BxiMVs0XRA5nFMd…', hint: 'From URL: /spreadsheets/d/ID/edit' },
        { label: 'Sheet Name (tab)', value: sheetName, setter: setSheetName, placeholder: 'Sheet1' },
        { label: 'Month / Date', value: date, setter: setDate, placeholder: '2026-03' },
        { label: 'Director / Supervisor', value: supervisorName, setter: setSupervisorName, placeholder: 'Maria Santos' },
    ];

    return (
        <>


            <div className="font-syne min-h-screen w-full  text-slate-800 dark:text-slate-100 relative overflow-x-hidden transition-colors duration-300 bg-gray-50 dark:bg-[#0f0e17] ">

                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">

                    {/* ── Header ── */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                                <FileCog className="w-4 h-4 text-indigo-400" />
                            </div>

                            <div>
                                <h1 className="font-syne text-2xl font-extrabold tracking-tight text-slate-800 dark:text-transparent dark:bg-clip-text">
                                    DTR Extractor
                                </h1>
                                <p className="font-dm-mono text-xs text-slate-400 dark:text-slate-500">
                                    AI-powered · batch upload · editable · exportable
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* ── Drag & Drop Zone ── */}
                    <div
                        ref={dropRef}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        className={`rounded-2xl border-2 border-dashed transition-all mb-6 ${dragOver
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.01]'
                            : 'border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20'
                            }`}
                    >
                        <label className="flex flex-col items-center justify-center py-10 cursor-pointer gap-3">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all
                bg-slate-100 dark:bg-white/[0.05]
                ${dragOver ? 'scale-110 bg-indigo-100 dark:bg-indigo-500/20' : ''}`}>
                                {dragOver ? '📂' : '📤'}
                            </div>
                            <div className="text-center">
                                <p className="font-syne font-semibold text-sm text-slate-600 dark:text-slate-300">
                                    {dragOver ? 'Drop to add employees' : 'Drag & drop DTR photos here'}
                                </p>
                                <p className="font-dm-mono text-xs mt-1 text-slate-400 dark:text-slate-500">
                                    or click to browse · supports multiple files
                                </p>
                            </div>
                            <input
                                type="file" accept="image/*" multiple className="hidden"
                                onChange={e => e.target.files && handleFiles(e.target.files)}
                            />
                        </label>
                    </div>

                    {/* ── Employee tabs + panel ── */}
                    {employees.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] dark:bg-gray-900 light:bg-white overflow-hidden mb-6">

                            {/* Tab bar */}
                            <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 dark:border-white/[0.06] overflow-x-auto">
                                {employees.map(emp => (
                                    <button
                                        key={emp.id}
                                        onClick={() => setActiveId(emp.id)}
                                        className={`font-dm-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs shrink-0 transition-all ${activeId === emp.id
                                            ? 'bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                                            : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                                            }`}
                                    >
                                        <span className={`text-[10px] ${statusIconClass(emp.status)}`}>{statusIcon(emp.status)}</span>
                                        <span className="max-w-[100px] truncate">{emp.name}</span>
                                        <span
                                            role="button"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setEmployees(p => p.filter(x => x.id !== emp.id));
                                                if (activeId === emp.id) setActiveId(employees.find(x => x.id !== emp.id)?.id ?? null);
                                            }}
                                            className="ml-1 opacity-40 hover:opacity-100 transition-opacity text-slate-500 dark:text-slate-400 cursor-pointer"
                                        >×</span>
                                    </button>
                                ))}

                                {employees.length > 1 && (
                                    <button
                                        onClick={exportAllCSV}
                                        className="font-dm-mono ml-auto shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] border transition-colors
                      text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100
                      dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:hover:bg-emerald-500/20"
                                    >
                                        ↓ Export All CSV
                                    </button>
                                )}
                            </div>

                            {/* Active employee panel */}
                            {active && (
                                <div className="grid lg:grid-cols-2 grid-cols-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-white/[0.06]">

                                    {/* LEFT: config */}
                                    <div className="p-5 flex flex-col gap-4">

                                        {/* Name */}
                                        <div>
                                            <label className="font-dm-mono block text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                                                Employee Name
                                            </label>
                                            <input
                                                type="text"
                                                value={active.name}
                                                onChange={e => setEmployees(p => p.map(x => x.id === active.id ? { ...x, name: e.target.value } : x))}
                                                className="dtr-input font-dm-mono w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors
                          bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400
                          dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-slate-200 dark:placeholder-slate-700 dark:focus:border-indigo-500/50"
                                            />
                                        </div>

                                        {/* Preview */}
                                        {active.previewUrl && (
                                            <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-white/[0.07]">
                                                <img src={active.previewUrl} className="w-full max-h-48 object-contain" alt="DTR Preview" />
                                            </div>
                                        )}

                                        {/* Status */}
                                        {active.statusMsg && <StatusBadge msg={active.statusMsg} />}

                                        {/* Raw output fallback */}
                                        {active.rawText && active.data.length === 0 && (
                                            <div className="rounded-xl border overflow-hidden border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-950/20">
                                                <div className="px-4 py-2 border-b border-yellow-200 dark:border-yellow-800/30">
                                                    <span className="font-dm-mono text-[10px] uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
                                                        Raw Output
                                                    </span>
                                                </div>
                                                <pre className="font-dm-mono p-4 text-xs overflow-x-auto max-h-40 whitespace-pre-wrap text-yellow-700 dark:text-yellow-300/80">
                                                    {active.rawText}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Google Sheets config */}
                                        {active.data.length > 0 && (
                                            <div className="rounded-xl border overflow-hidden border-slate-200 dark:border-white/[0.08]">
                                                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                                                    <span className="font-dm-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                        Google Sheets
                                                    </span>
                                                    <button
                                                        onClick={savePreset}
                                                        className="font-dm-mono flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors
                              text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100
                              dark:text-indigo-300 dark:bg-indigo-500/10 dark:border-indigo-500/25 dark:hover:bg-indigo-500/20"
                                                    >
                                                        💾 Save Preset
                                                    </button>
                                                </div>

                                                <div className="p-4 flex flex-col gap-3">
                                                    {configFields.map(({ label, value, setter, placeholder, hint }) => (
                                                        <div key={label}>
                                                            <label className="font-dm-mono block text-[10px] uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-500">
                                                                {label}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={value}
                                                                onChange={e => setter(e.target.value)}
                                                                placeholder={placeholder}
                                                                className="dtr-input font-dm-mono w-full border rounded-xl px-3 py-2 text-xs transition-colors
                                  bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400
                                  dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-slate-200 dark:placeholder-slate-700 dark:focus:border-indigo-500/50"
                                                            />
                                                            {hint && (
                                                                <p className="font-dm-mono mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">{hint}</p>
                                                            )}
                                                        </div>
                                                    ))}

                                                    <button
                                                        onClick={sendToSheets}
                                                        disabled={transferring}
                                                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                                        style={{
                                                            background: 'linear-gradient(135deg,#6366f1,#14b8a6)',
                                                            boxShadow: transferring ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
                                                        }}
                                                    >
                                                        {transferring ? (
                                                            <>
                                                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" className="opacity-25" />
                                                                    <path fill="white" className="opacity-75" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                                                                </svg>
                                                                Sending…
                                                            </>
                                                        ) : '↑ Send to Google Sheets'}
                                                    </button>

                                                    {transferMsg && <StatusBadge msg={transferMsg} />}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT: Editable table */}
                                    <div className="flex flex-col">
                                        {active.data.length > 0 ? (
                                            <>
                                                {/* Table toolbar */}
                                                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-dm-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                            Extracted DTR
                                                        </span>
                                                        <span className="font-dm-mono text-[10px] px-2 py-0.5 rounded-full border
                              text-indigo-600 bg-indigo-50 border-indigo-200
                              dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20">
                                                            {active.data.length} entries
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => exportCSV(active)}
                                                            className="font-dm-mono flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors
                                text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100
                                dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:hover:bg-emerald-500/20"
                                                        >
                                                            ↓ CSV
                                                        </button>
                                                        <button
                                                            onClick={() => exportXLSX(active)}
                                                            className="font-dm-mono flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors
                                text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100
                                dark:text-sky-300 dark:bg-sky-500/10 dark:border-sky-500/25 dark:hover:bg-sky-500/20"
                                                        >
                                                            ↓ XLSX
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Edit hint */}
                                                <p className="font-dm-mono text-[10px] px-5 py-2 border-b border-slate-100 dark:border-white/[0.06] text-slate-400 dark:text-slate-600">
                                                    ✏ Click any cell to edit
                                                </p>

                                                {/* Table */}
                                                <div className="overflow-auto max-h-[720px]">
                                                    <table className="font-dm-mono w-full text-xs">
                                                        <thead className="sticky top-0 z-10">
                                                            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0d0d14]">
                                                                {['Day', 'Morning In', 'Lunch', 'Afternoon Out'].map((h, i) => (
                                                                    <th
                                                                        key={h}
                                                                        className={`px-4 py-2.5 text-left font-normal text-[10px] uppercase tracking-widest ${i === 0 ? 'text-slate-400 dark:text-slate-500'
                                                                            : i === 1 ? 'text-blue-500 dark:text-blue-400'
                                                                                : i === 2 ? 'text-violet-500 dark:text-violet-400'
                                                                                    : 'text-orange-500 dark:text-orange-400'
                                                                            }`}
                                                                    >{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {Array.from({ length: 31 }, (_, i) => {
                                                                const day = i + 1;
                                                                const row = active.data.find(r => Number(r.day) === day);
                                                                const hasData = row && (row.morningIn || row.lunchOut || row.afternoonOut);
                                                                return (
                                                                    <tr
                                                                        key={day}
                                                                        className="border-t border-slate-100 dark:border-white/[0.04] hover:bg-indigo-50/60 dark:hover:bg-indigo-500/[0.04] transition-colors"
                                                                    >
                                                                        <td className={`px-4 py-1.5 tabular-nums font-semibold ${hasData
                                                                            ? 'text-slate-700 dark:text-slate-200'
                                                                            : 'text-slate-300 dark:text-slate-700'
                                                                            }`}>
                                                                            {String(day).padStart(2, '0')}
                                                                        </td>

                                                                        {(['morningIn', 'lunchOut', 'afternoonOut'] as const).map((field, fi) => (
                                                                            <td key={field} className="px-4 py-1 tabular-nums">
                                                                                <input
                                                                                    type="text"
                                                                                    value={row?.[field] ?? ''}
                                                                                    onChange={e => editCell(active.id, day, field, e.target.value)}
                                                                                    placeholder="—"
                                                                                    className={`editable-cell font-dm-mono w-20 bg-transparent border-0 text-xs tabular-nums transition-colors ${row?.[field]
                                                                                        ? fi === 0 ? 'text-blue-600 dark:text-blue-300'
                                                                                            : fi === 1 ? 'text-violet-600 dark:text-violet-300'
                                                                                                : 'text-orange-600 dark:text-orange-300'
                                                                                        : 'text-slate-300 dark:text-slate-700 placeholder-slate-300 dark:placeholder-slate-700'
                                                                                        }`}
                                                                                />
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                                                {active.status === 'processing' ? (
                                                    <>
                                                        <div className="w-10 h-10 rounded-full border-2 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-500 dark:border-t-indigo-400 animate-spin mb-4" />
                                                        <p className="font-dm-mono text-sm text-slate-400 dark:text-slate-500">Extracting time records…</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-4xl mb-3 opacity-20 select-none">📋</span>
                                                        <p className="font-dm-mono text-sm text-slate-400 dark:text-slate-600">
                                                            {active.status === 'error' ? 'Extraction failed — check raw output' : 'Waiting for extraction…'}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Empty state ── */}
                    {employees.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.07] flex flex-col items-center justify-center py-20">
                            <span className="text-5xl mb-4 opacity-20 select-none">🗂</span>
                            <p className="font-dm-mono text-sm text-slate-400 dark:text-slate-600">
                                Drop DTR images above to get started
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
};

export default TimeCardExtractor;