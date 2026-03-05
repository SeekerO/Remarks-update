"use client"

import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DtrRow {
    day: number;
    morningIn: string;
    lunch: string;
    afternoonOut: string;
}

interface TimeLogSource {
    id: string;
    label: string;
    sheetId: string;
    sheetName: string;
}

interface TimeLogEntry {
    [key: string]: string;
}

type PunchField = 'morningIn' | 'lunch' | 'afternoonOut';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const nowTime = () => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
};

const nowDay = () => new Date().getDate();

const todayKey = () => new Date().toISOString().slice(0, 10);

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

const FIELD_LABELS: Record<PunchField, string> = {
    morningIn: 'Clock In',
    lunch: 'Lunch',
    afternoonOut: 'Clock Out',
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
    return <div className={`font-dm-mono rounded-xl px-4 py-2.5 text-xs border ${cls}`}>{msg}</div>;
};

// ─── Live Clock ───────────────────────────────────────────────────────────────
const LiveClock: React.FC = () => {
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    useEffect(() => {
        const tick = () => {
            const n = new Date();
            setTime(n.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
            setDate(n.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <div className="text-center select-none">
            <div className="font-dm-mono text-3xl sm:text-5xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-slate-100">{time}</div>
            <div className="font-dm-mono text-[10px] sm:text-xs mt-1 text-slate-400 dark:text-slate-500">{date}</div>
        </div>
    );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{
    field: PunchField;
    time: string;
    onTimeChange: (t: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ field, time, onTimeChange, onConfirm, onCancel }) => {
    const icons: Record<PunchField, string> = { morningIn: '🌅', lunch: '🍽️', afternoonOut: '🌇' };
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 w-full" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-[#111118] rounded-t-2xl mx-5 sm:rounded-2xl border border-slate-200 dark:border-white/[0.1] shadow-2xl w-full sm:max-w-sm py-4 px-4 pb-10 flex flex-col gap-5"
                onClick={e => e.stopPropagation()}>
                <div className="text-center">
                    <div className="text-3xl mb-2">{icons[field]}</div>
                    <h2 className="font-syne text-lg font-bold text-slate-800 dark:text-slate-100">Confirm {FIELD_LABELS[field]}</h2>
                    <p className="font-dm-mono text-xs text-slate-400 dark:text-slate-500 mt-1">Adjust time if needed, then confirm</p>
                </div>
                <div className='w-full flex flex-col'>
                    <label className="font-dm-mono block text-[10px] uppercase tracking-widest mb-1.5 text-slate-400 dark:text-slate-500">Time (24h)</label>
                    <input type="time" value={time} onChange={e => onTimeChange(e.target.value)}
                        className="font-dm-mono w-full border rounded-xl px-4 py-3 text-center text-2xl tabular-nums transition-colors bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-400 focus:outline-none dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-slate-100 dark:focus:border-indigo-500/50 " />
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl font-dm-mono text-sm border text-slate-600 border-slate-200 hover:bg-slate-50 dark:border-white/[0.1] dark:text-slate-400 dark:hover:bg-white/[0.04] transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl font-dm-mono text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#14b8a6)' }}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Storage keys & helpers ───────────────────────────────────────────────────
const LS_PROFILE = 'dtr-profile';
const lsSession = () => `dtr-session-${todayKey()}`;

const loadProfile = () => {
    try { const s = localStorage.getItem(LS_PROFILE); return s ? JSON.parse(s) : {}; } catch { return {}; }
};
const saveProfile = (data: Record<string, string>) => {
    localStorage.setItem(LS_PROFILE, JSON.stringify({ ...loadProfile(), ...data }));
};
const loadSession = () => {
    try { const s = localStorage.getItem(lsSession()); return s ? JSON.parse(s) : {}; } catch { return {}; }
};
const saveSession = (data: object) => {
    localStorage.setItem(lsSession(), JSON.stringify({ ...loadSession(), ...data }));
};

// ─── Time Logger Panel ────────────────────────────────────────────────────────
const TimeLoggerPanel: React.FC = () => {
    const [employeeName, setEmployeeName] = useState('');
    const [punches, setPunches] = useState<Partial<Record<PunchField, string>>>({});

    const [sheetId, setSheetId] = useState('');
    const [sheetName, setSheetName] = useState('Sheet1');
    const [date, setDate] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`; });
    const [supervisorName, setSupervisorName] = useState('');

    const [transferMsg, setTransferMsg] = useState('');
    const [saveFlash, setSaveFlash] = useState(false);

    const [pendingPunch, setPendingPunch] = useState<PunchField | null>(null);
    const [confirmTime, setConfirmTime] = useState('');

    // ── Hydrate from localStorage on mount ────────────────────────────────────
    useEffect(() => {
        const p = loadProfile();
        if (p.name) setEmployeeName(p.name);
        if (p.sheetId) setSheetId(p.sheetId);
        if (p.sheetName) setSheetName(p.sheetName);
        if (p.supervisor) setSupervisorName(p.supervisor);
        if (p.date) setDate(p.date);

        // Auto new-day: if last active date ≠ today, yesterday's session is naturally
        // empty (different key) — just prune the old key and update lastActiveDate.
        const today = todayKey();
        if (p.lastActiveDate && p.lastActiveDate !== today) {
            // Remove yesterday's session to free storage
            localStorage.removeItem(`dtr-session-${p.lastActiveDate}`);
        }
        // Always stamp today so we can detect the next day-rollover
        saveProfile({ lastActiveDate: today });

        // Load today's session (empty if new day — different key)
        const s = loadSession();
        if (s.punches) setPunches(s.punches);
    }, []);

    // ── Unified save: writes profile + session ─────────────────────────────────
    const persistAll = (
        overridePunches?: Partial<Record<PunchField, string>>,
        overrideName?: string,
    ) => {
        const name = overrideName ?? employeeName;
        saveProfile({ name, sheetId, sheetName, supervisor: supervisorName, date });
        saveSession({ punches: overridePunches ?? punches });
    };

    // ── Manual "Save Profile" button ───────────────────────────────────────────
    const handleSaveProfile = () => {
        persistAll();
        setSaveFlash(true);
        setTimeout(() => setSaveFlash(false), 1800);
    };

    const [syncStatus, setSyncStatus] = useState<Partial<Record<PunchField, 'syncing' | 'ok' | 'error'>>>({});
    const [syncMsg, setSyncMsg] = useState('');

    // ── Which punch is next ────────────────────────────────────────────────────
    const nextPunch = (): PunchField | null => {
        if (!punches.morningIn) return 'morningIn';
        if (!punches.lunch) return 'lunch';
        if (!punches.afternoonOut) return 'afternoonOut';
        return null;
    };

    const isDone = !!punches.morningIn && !!punches.lunch && !!punches.afternoonOut;
    const next = nextPunch();

    const initPunch = (field: PunchField) => { setPendingPunch(field); setConfirmTime(nowTime()); };

    // ── Auto-sync to Sheets after each punch ──────────────────────────────────
    const syncToSheets = async (newPunches: Partial<Record<PunchField, string>>, field: PunchField) => {
        if (!sheetId || !sheetName || !employeeName.trim()) {
            setSyncStatus(prev => ({ ...prev, [field]: 'error' }));
            setSyncMsg('⚠ Fill in Sheet ID, Sheet Name, and your Name first.');
            return;
        }
        setSyncStatus(prev => ({ ...prev, [field]: 'syncing' }));
        try {
            const res = await fetch('/api/dtr/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rows: [{
                        day: nowDay(),
                        morningIn: ensure24Hour(newPunches.morningIn ?? ''),
                        lunchOut: ensure24Hour(newPunches.lunch ?? ''),
                        lunchIn: '',
                        afternoonOut: ensure24Hour(newPunches.afternoonOut ?? ''),
                    }],
                    sheetId, sheetName, date,
                    name: employeeName,
                    supervisor: supervisorName,
                }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error ?? 'Unknown error');
            setSyncStatus(prev => ({ ...prev, [field]: 'ok' }));
            setSyncMsg('');
        } catch (err: any) {
            setSyncStatus(prev => ({ ...prev, [field]: 'error' }));
            setSyncMsg(`❌ Sync failed: ${err.message}`);
        }
    };

    // ── Confirm punch — saves locally + syncs to Sheets ───────────────────────
    const confirmPunch = () => {
        if (!pendingPunch) return;
        const t = confirmTime || nowTime();
        const newPunches = { ...punches, [pendingPunch]: t };
        setPunches(newPunches);
        setPendingPunch(null);
        saveProfile({ name: employeeName, sheetId, sheetName, supervisor: supervisorName, date });
        saveSession({ punches: newPunches });
        // Auto-sync immediately after recording
        syncToSheets(newPunches, pendingPunch);
    };

    // ── Reset only today's punches (keeps profile / name) ─────────────────────
    const resetSession = () => {
        if (!confirm("Clear today's punches? Your name and sheet settings will be kept.")) return;
        const empty: Partial<Record<PunchField, string>> = {};
        setPunches(empty);
        setSyncStatus({});
        setSyncMsg('');
        setTransferMsg('');
        saveSession({ punches: empty });
    };

    // ── Reset everything ──────────────────────────────────────────────────────
    const resetAll = () => {
        if (!confirm("Reset ALL saved data including your name and sheet settings?")) return;
        setPunches({}); setSyncStatus({}); setSyncMsg('');
        setEmployeeName(''); setSheetId(''); setSheetName('Sheet1'); setSupervisorName('');
        setTransferMsg('');
        localStorage.removeItem(LS_PROFILE);
        localStorage.removeItem(lsSession());
    };

    // Local DtrRow for CSV
    const buildRow = (): DtrRow => ({
        day: nowDay(),
        morningIn: ensure24Hour(punches.morningIn ?? ''),
        lunch: ensure24Hour(punches.lunch ?? ''),
        afternoonOut: ensure24Hour(punches.afternoonOut ?? ''),
    });

    const exportCSV = () => {
        const row = buildRow();
        const csv = ['Day,Morning In,Lunch,Afternoon Out', [row.day, row.morningIn, row.lunch, row.afternoonOut].join(',')].join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `DTR_${employeeName || 'log'}_${todayKey()}.csv`; a.click();
    };

    type CardCfg = { field: PunchField; label: string; sublabel: string; icon: string; gradient: string; glow: string; doneRing: string; timeColor: string; };

    const cards: CardCfg[] = [
        { field: 'morningIn', label: 'Clock In', sublabel: 'Start of workday', icon: '🌅', gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/25', doneRing: 'ring-blue-200 dark:ring-blue-500/25', timeColor: 'text-blue-600 dark:text-blue-300' },
        { field: 'lunch', label: 'Lunch', sublabel: 'Lunch break', icon: '🍽️', gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/25', doneRing: 'ring-violet-200 dark:ring-violet-500/25', timeColor: 'text-violet-600 dark:text-violet-300' },
        { field: 'afternoonOut', label: 'Clock Out', sublabel: 'End of workday', icon: '🌇', gradient: 'from-orange-500 to-rose-600', glow: 'shadow-orange-500/25', doneRing: 'ring-orange-200 dark:ring-orange-500/25', timeColor: 'text-orange-600 dark:text-orange-300' },
    ];

    const isCardDone = (card: CardCfg): boolean => !!punches[card.field];
    const cardTime = (card: CardCfg): string => punches[card.field] ?? '';

    return (
        <>
            <div className="flex flex-col gap-6">

                {/* ── Hero clock card ── */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center gap-4 sm:gap-5">
                    <LiveClock />

                    {/* Name input + save profile row */}
                    <div className="w-full max-w-sm flex gap-2">
                        <input
                            type="text"
                            value={employeeName}
                            onChange={e => setEmployeeName(e.target.value)}
                            placeholder="Your name…"
                            className="font-dm-mono flex-1 text-center border rounded-xl px-4 py-2.5 text-sm transition-colors bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-slate-200 dark:placeholder-slate-600 dark:focus:border-indigo-500/50"
                        />
                        <button
                            onClick={handleSaveProfile}
                            title="Save name & sheet settings"
                            className={`shrink-0 px-3.5 py-2.5 rounded-xl font-dm-mono text-xs font-bold border transition-all ${saveFlash
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/25 dark:text-indigo-300 dark:hover:bg-indigo-500/20'
                                }`}
                        >
                            {saveFlash ? '✓ Saved' : '💾 Save'}
                        </button>
                    </div>

                    {/* Progress tracker */}
                    <div className="flex items-center gap-2">
                        {(['morningIn', 'lunch', 'afternoonOut'] as PunchField[]).map((f, i) => {
                            const done = !!punches[f];
                            const isNextField = f === next;
                            return (
                                <React.Fragment key={f}>
                                    <div title={FIELD_LABELS[f]} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${done ? 'bg-indigo-500 dark:bg-indigo-400' : isNextField ? 'bg-indigo-200 dark:bg-indigo-500/40 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    {i < 2 && <div className={`w-8 h-px transition-all duration-500 ${done ? 'bg-indigo-300 dark:bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {isDone
                        ? <div className="font-dm-mono text-xs px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-300">✓ All punches recorded for today</div>
                        : next
                            ? <div className="font-dm-mono text-xs px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-500 dark:text-indigo-300 animate-pulse">Next → {FIELD_LABELS[next]}</div>
                            : null
                    }
                </div>

                {/* ── 3 punch cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {cards.map(card => {
                        const done = isCardDone(card);
                        const isNext = card.field === next;
                        const t = cardTime(card);
                        const sync = syncStatus[card.field];

                        return (
                            <div key={card.field} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${done ? `ring-1 ${card.doneRing} border-transparent bg-white dark:bg-white/[0.03]`
                                : isNext ? 'border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.03]'
                                    : 'border-slate-100 dark:border-white/[0.04] bg-slate-50/60 dark:bg-white/[0.01] opacity-60'
                                }`}>
                                {/* Mobile: horizontal row layout. Desktop: vertical card */}
                                <div className="p-4 sm:p-5 flex sm:flex-col gap-3 sm:gap-4">
                                    {/* Left/top: icon + label + time */}
                                    <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 sm:block">
                                            <span className="text-xl sm:text-2xl">{card.icon}</span>
                                            <div className="sm:mt-1.5">
                                                <div className="font-syne text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{card.label}</div>
                                                <div className="font-dm-mono text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block mt-0.5">{card.sublabel}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right/bottom: punched time or button */}
                                    <div className="flex flex-col justify-center items-end sm:items-stretch gap-2 shrink-0 sm:shrink">
                                        {done && (
                                            <div className={`font-dm-mono text-right sm:text-left ${card.timeColor}`}>
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">Punched</div>
                                                <div className="text-lg sm:text-xl font-bold tabular-nums">{t}</div>
                                            </div>
                                        )}
                                        {!done && isNext && (
                                            <button onClick={() => initPunch(card.field)}
                                                className={`px-4 sm:w-full py-2.5 sm:py-3 rounded-xl font-dm-mono text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 bg-gradient-to-r ${card.gradient} shadow-lg ${card.glow} transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] whitespace-nowrap`}>
                                                Punch
                                            </button>
                                        )}
                                        {!done && !isNext && (
                                            <div className="font-dm-mono text-[10px] text-slate-300 dark:text-slate-700 text-right sm:text-left">
                                                {!punches.morningIn ? 'Clock in first' : 'Next'}
                                            </div>
                                        )}
                                        {/* Sync status */}
                                        {done && (
                                            <div className="flex items-center gap-1.5 justify-end sm:justify-start">
                                                {sync === 'syncing' && (
                                                    <div className="flex items-center gap-1 font-dm-mono text-[10px] text-indigo-500 dark:text-indigo-400">
                                                        <span className="w-2.5 h-2.5 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                                        <span className="hidden sm:inline">Syncing…</span>
                                                    </div>
                                                )}
                                                {sync === 'ok' && (
                                                    <div className={`font-dm-mono text-[10px] flex items-center gap-1 ${card.timeColor}`}>
                                                        ✓ <span className="hidden sm:inline">Synced</span>
                                                    </div>
                                                )}
                                                {sync === 'error' && (
                                                    <div className="font-dm-mono text-[10px] flex items-center gap-1 text-red-500 dark:text-red-400">
                                                        <span>⚠</span>
                                                        <button onClick={() => syncToSheets(punches, card.field)}
                                                            className="underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300">
                                                            Retry
                                                        </button>
                                                    </div>
                                                )}
                                                {!sync && (
                                                    <div className={`font-dm-mono text-[10px] ${card.timeColor}`}>✓</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Today's record table ── */}
                {Object.keys(punches).length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <span className="font-dm-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">Today's Record</span>
                            <div className="flex gap-2">
                                <button onClick={exportCSV}
                                    className="font-dm-mono flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/25">
                                    ↓ CSV
                                </button>
                                <button onClick={resetSession}
                                    className="font-dm-mono flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/25">
                                    ↺ Reset
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="font-dm-mono w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0d0d14]">
                                        {[
                                            ['Day', 'text-slate-400 dark:text-slate-500'],
                                            ['AM In', 'text-blue-500 dark:text-blue-400'],
                                            ['Lunch', 'text-violet-500 dark:text-violet-400'],
                                            ['PM Out', 'text-orange-500 dark:text-orange-400'],
                                        ].map(([h, cls]) => (
                                            <th key={h} className={`px-3 sm:px-4 py-2.5 text-left font-normal text-[10px] uppercase tracking-widest ${cls}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t border-slate-100 dark:border-white/[0.04]">
                                        <td className="px-3 sm:px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{String(nowDay()).padStart(2, '0')}</td>
                                        {(['morningIn', 'lunch', 'afternoonOut'] as PunchField[]).map((f, fi) => (
                                            <td key={f} className={`px-3 sm:px-4 py-3 tabular-nums font-semibold ${punches[f] ? ['text-blue-600 dark:text-blue-300', 'text-violet-600 dark:text-violet-300', 'text-orange-600 dark:text-orange-300'][fi] : 'text-slate-300 dark:text-slate-700'}`}>
                                                {punches[f] || '—'}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Google Sheets config ── */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <span className="font-dm-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">Google Sheets Config</span>
                            <span className="font-dm-mono text-[10px] text-slate-400 dark:text-slate-600 hidden sm:inline"> — auto-syncs on each punch</span>
                        </div>
                        <button onClick={resetAll}
                            className="font-dm-mono shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors text-red-600 bg-red-50 border-red-200 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/25">
                            🗑 Reset All
                        </button>
                    </div>
                    <div className="p-4 sm:p-5 grid sm:grid-cols-2 grid-cols-1 gap-3 sm:gap-4">
                        {[
                            { label: 'Spreadsheet ID', value: sheetId, setter: setSheetId, placeholder: '1BxiMVs0XRA5nFMd…', hint: 'From URL: /spreadsheets/d/ID/edit' },
                            { label: 'Sheet Name (tab)', value: sheetName, setter: setSheetName, placeholder: 'Sheet1' },
                            { label: 'Month / Date', value: date, setter: setDate, placeholder: '2026-03' },
                            { label: 'Director / Supervisor', value: supervisorName, setter: setSupervisorName, placeholder: 'Maria Santos' },
                        ].map(({ label, value, setter, placeholder, hint }) => (
                            <div key={label}>
                                <label className="font-dm-mono block text-[10px] uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-500">{label}</label>
                                <input type="text" value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                                    className="font-dm-mono w-full border rounded-xl px-3 py-2 text-xs transition-colors bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-slate-200 dark:placeholder-slate-700 dark:focus:border-indigo-500/50" />
                                {hint && <p className="font-dm-mono mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">{hint}</p>}
                            </div>
                        ))}
                    </div>
                    {syncMsg && (
                        <div className="px-5 pb-5">
                            <StatusBadge msg={syncMsg} />
                        </div>
                    )}
                </div>

            </div>

            {/* ── Confirm modal ── */}
            {pendingPunch && (
                <ConfirmModal
                    field={pendingPunch}
                    time={confirmTime}
                    onTimeChange={setConfirmTime}
                    onConfirm={confirmPunch}
                    onCancel={() => setPendingPunch(null)}
                />
            )}
        </>
    );
};

// ─── How To Use Guide ─────────────────────────────────────────────────────────
const HowToUseGuide: React.FC = () => {
    const [open, setOpen] = useState(false);

    const steps = [
        {
            icon: '⏱',
            title: 'Punch your times daily',
            desc: 'Use the Time Logger tab to punch Clock In, Lunch, and Clock Out each day. Every punch is saved automatically.',
        },
        {
            icon: '↑',
            title: 'Send to Google Sheets',
            desc: 'After punching, fill in your Spreadsheet ID and Sheet name, then hit "Send to Google Sheets." Each day appends a new row.',
        },
        {
            icon: '📋',
            title: 'Get your Spreadsheet ID',
            desc: 'Open your Google Sheet. Copy the long ID from the URL between /d/ and /edit — e.g. docs.google.com/spreadsheets/d/[ID]/edit',
        },
        {
            icon: '🔑',
            title: 'Share the sheet with the service account',
            desc: 'Your admin must share the Google Sheet with the service account email (from GOOGLE_SERVICE_ACCOUNT_JSON) as Editor so the app can read and write.',
        },
        {
            icon: '📊',
            title: 'Connect it here to view',
            desc: 'Click "+ Add Source", give it a label (e.g. "March 2026"), paste the same Spreadsheet ID and the tab name. The app reads the first row as column headers.',
        },
        {
            icon: '🔍',
            title: 'Search, sort & export',
            desc: 'Once connected, you can search across all columns, click any header to sort, and export the filtered view as CSV.',
        },
    ];

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
            <button
                onClick={() => setOpen(p => !p)}
                className="w-full px-5 py-3 flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm">💡</span>
                    <span className="font-dm-mono text-xs font-medium text-slate-600 dark:text-slate-300">How to use View Log</span>
                </div>
                <span className={`font-dm-mono text-xs text-slate-400 dark:text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    ▾
                </span>
            </button>

            {open && (
                <div className="border-t border-slate-100 dark:border-white/[0.06] p-5 flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {steps.map((step, i) => (
                            <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                                <div className="shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-base">
                                    {step.icon}
                                </div>
                                <div>
                                    <div className="font-syne text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">
                                        <span className="font-dm-mono text-[10px] text-indigo-400 dark:text-indigo-500 mr-1.5">{String(i + 1).padStart(2, '0')}</span>
                                        {step.title}
                                    </div>
                                    <p className="font-dm-mono text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick reference */}
                    <div className="rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/[0.05] p-4">
                        <p className="font-dm-mono text-[10px] uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">Quick Reference</p>
                        <div className="flex flex-col gap-1.5">
                            {[
                                ['Spreadsheet ID', 'The long string in your Sheet URL between /d/ and /edit'],
                                ['Sheet Name', 'The tab name at the bottom of your spreadsheet (default: Sheet1)'],
                                ['First row', 'Must be column headers — the app reads them automatically'],
                                ['Permissions', 'Sheet must be shared with the service account as Editor'],
                            ].map(([term, def]) => (
                                <div key={term} className="flex gap-2 text-[11px]">
                                    <span className="font-dm-mono font-bold text-indigo-600 dark:text-indigo-300 shrink-0 w-28">{term}</span>
                                    <span className="font-dm-mono text-slate-500 dark:text-slate-500">{def}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Time Log Viewer Panel ────────────────────────────────────────────────────
const TimeLogPanel: React.FC = () => {
    const [sources, setSources] = useState<TimeLogSource[]>(() => {
        try { const s = localStorage.getItem('dtr-timelog-sources'); return s ? JSON.parse(s) : []; } catch { return []; }
    });
    const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
    const [newLabel, setNewLabel] = useState('');
    const [newSheetId, setNewSheetId] = useState('');
    const [newSheetName, setNewSheetName] = useState('Sheet1');
    const [entries, setEntries] = useState<TimeLogEntry[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchMsg, setFetchMsg] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const activeSource = sources.find(s => s.id === activeSourceId) ?? null;

    const saveSources = (updated: TimeLogSource[]) => { setSources(updated); localStorage.setItem('dtr-timelog-sources', JSON.stringify(updated)); };

    const addSource = () => {
        if (!newLabel.trim() || !newSheetId.trim()) return;
        const source: TimeLogSource = { id: uid(), label: newLabel.trim(), sheetId: newSheetId.trim(), sheetName: newSheetName.trim() || 'Sheet1' };
        const updated = [...sources, source];
        saveSources(updated); setNewLabel(''); setNewSheetId(''); setNewSheetName('Sheet1'); setShowAddForm(false); setActiveSourceId(source.id);
    };

    const removeSource = (id: string) => { const updated = sources.filter(s => s.id !== id); saveSources(updated); if (activeSourceId === id) setActiveSourceId(updated[0]?.id ?? null); };

    const fetchLog = async (source: TimeLogSource) => {
        setLoading(true); setFetchMsg('📡 Fetching from Google Sheets…'); setEntries([]); setColumns([]);
        try {
            const res = await fetch(`/api/dtr/timelog?sheetId=${encodeURIComponent(source.sheetId)}&sheetName=${encodeURIComponent(source.sheetName)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Unknown error');
            const rows: TimeLogEntry[] = data.rows ?? [];
            const cols: string[] = data.columns ?? (rows.length > 0 ? Object.keys(rows[0]) : []);
            setEntries(rows); setColumns(cols);
            setFetchMsg(rows.length > 0 ? `✓ Loaded ${rows.length} entries` : '⚠ Sheet is empty');
        } catch (err: any) { setFetchMsg('❌ ' + err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (activeSource) fetchLog(activeSource); }, [activeSourceId]);

    const exportLogCSV = () => {
        if (!entries.length) return;
        const header = columns.join(',');
        const lines = entries.map(row => columns.map(c => `"${String(row[c] ?? '').replace(/"/g, '""')}"`).join(','));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })); a.download = `DTR_${activeSource?.label ?? 'export'}.csv`; a.click();
    };

    // API now returns pre-typed rows from A12:L42 directly
    const getDtrRows = () => entries.map(row => ({
        date: row['date'] || '',
        day: row['day'] || '',
        amIn: row['amIn'] || '',
        amOut: row['amOut'] || '',
        pmIn: row['pmIn'] || '',
        pmOut: row['pmOut'] || '',
        otIn: row['otIn'] || '',
        otOut: row['otOut'] || '',
        hrsReg: row['hrsReg'] || '',
        minsReg: row['minsReg'] || '',
        hrsSat: row['hrsSat'] || '',
        minsSat: row['minsSat'] || '',
    }));

    const isWeekend = (day: string) => {
        const d = day.toUpperCase();
        return d.includes('SUNDAY') || d.includes('SATURDAY');
    };

    const hasAnyEntry = (r: ReturnType<typeof getDtrRows>[0]) =>
        r.amIn || r.amOut || r.pmIn || r.pmOut || r.otIn || r.otOut;

    return (
        <div className="flex flex-col gap-4">

            {/* ── How it works callout ── */}
            <HowToUseGuide />

            <div className="flex items-center gap-2 flex-wrap">
                {sources.map(src => (
                    <button key={src.id} onClick={() => setActiveSourceId(src.id)}
                        className={`font-dm-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs shrink-0 transition-all border ${activeSourceId === src.id ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.05]'}`}>
                        <span className="max-w-[120px] truncate">{src.label}</span>
                        <span role="button" onClick={e => { e.stopPropagation(); removeSource(src.id); }} className="ml-1 opacity-40 hover:opacity-100 cursor-pointer">×</span>
                    </button>
                ))}
                <button onClick={() => setShowAddForm(p => !p)}
                    className="font-dm-mono px-3 py-1.5 rounded-lg text-xs border transition-all text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/10 dark:border-indigo-500/25">
                    + Add Source
                </button>
                {activeSource && (
                    <button onClick={() => fetchLog(activeSource)} disabled={loading}
                        className="font-dm-mono ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-40 text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:bg-white/[0.04] dark:border-white/[0.08]">
                        {loading ? <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : '↻'} Refresh
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/25 bg-indigo-50/60 dark:bg-indigo-500/[0.06] p-4 flex flex-col gap-3">
                    <p className="font-dm-mono text-[10px] uppercase tracking-widest text-indigo-500">New Log Source</p>
                    <div className="grid sm:grid-cols-3 grid-cols-1 gap-3">
                        {[
                            { label: 'Display Label', value: newLabel, setter: setNewLabel, placeholder: 'March 2026 DTR' },
                            { label: 'Spreadsheet ID', value: newSheetId, setter: setNewSheetId, placeholder: '1BxiMVs0XRA5nFMd…' },
                            { label: 'Sheet Name (tab)', value: newSheetName, setter: setNewSheetName, placeholder: 'Sheet1' },
                        ].map(({ label, value, setter, placeholder }) => (
                            <div key={label}>
                                <label className="font-dm-mono block text-[10px] uppercase tracking-widest mb-1 text-slate-400 dark:text-slate-500">{label}</label>
                                <input type="text" value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                                    className="font-dm-mono w-full border rounded-xl px-3 py-2 text-xs bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-slate-200 dark:placeholder-slate-700" />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={addSource} disabled={!newLabel.trim() || !newSheetId.trim()}
                            className="font-dm-mono px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#14b8a6)' }}>Add Source</button>
                        <button onClick={() => setShowAddForm(false)}
                            className="font-dm-mono px-4 py-2 rounded-xl text-xs border text-slate-500 border-slate-200 dark:border-white/[0.08] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">Cancel</button>
                    </div>
                </div>
            )}

            {sources.length === 0 && !showAddForm && (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.07] flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
                    <span className="text-5xl opacity-20 select-none">📊</span>
                    <div>
                        <p className="font-syne text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">No sheets connected yet</p>
                        <p className="font-dm-mono text-xs text-slate-400 dark:text-slate-600">Connect a Google Sheet above to start viewing your time logs.</p>
                    </div>
                    <button onClick={() => setShowAddForm(true)}
                        className="font-dm-mono px-4 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#14b8a6)' }}>+ Connect a Sheet</button>
                </div>
            )}

            {activeSource && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-syne text-sm font-bold text-slate-700 dark:text-slate-200">{activeSource.label}</span>
                            {entries.length > 0 && (
                                <span className="font-dm-mono text-[10px] px-2 py-0.5 rounded-full border text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20">
                                    {entries.length} days
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {entries.length > 0 && (
                                <button onClick={exportLogCSV}
                                    className="font-dm-mono flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/25">
                                    ↓ Export CSV
                                </button>
                            )}
                        </div>
                    </div>

                    {fetchMsg && <div className="px-5 py-2 border-b border-slate-100 dark:border-white/[0.06]"><StatusBadge msg={fetchMsg} /></div>}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 rounded-full border-2 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
                            <p className="font-dm-mono text-sm text-slate-400 dark:text-slate-500">Loading DTR data…</p>
                        </div>
                    ) : entries.length > 0 ? (
                        <div>
                            {/* Scroll hint on mobile */}
                            <div className="sm:hidden px-4 py-1.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-1.5">
                                <span className="font-dm-mono text-[10px] text-slate-400 dark:text-slate-500">← Scroll to see all columns →</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="font-dm-mono w-full text-[11px] min-w-[640px]">
                                    <thead className="sticky top-0 z-10">
                                        {/* Group headers */}
                                        <tr className="bg-slate-50 dark:bg-[#0d0d14] border-b border-slate-100 dark:border-white/[0.06]">
                                            <th rowSpan={2} className="px-2 sm:px-3 py-2 text-left font-normal text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-white/[0.06]">Date</th>
                                            <th rowSpan={2} className="px-2 sm:px-3 py-2 text-left font-normal text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-white/[0.06]">Day</th>
                                            <th colSpan={2} className="px-2 sm:px-3 py-1.5 text-center font-normal text-[10px] uppercase tracking-widest text-blue-500 dark:text-blue-400 border-r border-slate-100 dark:border-white/[0.06]">A M</th>
                                            <th colSpan={2} className="px-2 sm:px-3 py-1.5 text-center font-normal text-[10px] uppercase tracking-widest text-violet-500 dark:text-violet-400 border-r border-slate-100 dark:border-white/[0.06]">P M</th>
                                            <th colSpan={2} className="px-2 sm:px-3 py-1.5 text-center font-normal text-[10px] uppercase tracking-widest text-orange-500 dark:text-orange-400 border-r border-slate-100 dark:border-white/[0.06]">O T</th>
                                            <th colSpan={2} className="px-2 sm:px-3 py-1.5 text-center font-normal text-[10px] uppercase tracking-widest text-emerald-500 dark:text-emerald-400 border-r border-slate-100 dark:border-white/[0.06]">Reg.</th>
                                            <th colSpan={2} className="px-2 sm:px-3 py-1.5 text-center font-normal text-[10px] uppercase tracking-widest text-rose-500 dark:text-rose-400">Sat/Sun</th>
                                        </tr>
                                        <tr className="bg-slate-50 dark:bg-[#0d0d14] border-b border-slate-200 dark:border-white/[0.08]">
                                            {['IN', 'OUT', 'IN', 'OUT', 'IN', 'OUT', 'HRS', 'MIN', 'HRS', 'MIN'].map((h, i) => (
                                                <th key={i} className={`px-2 sm:px-3 py-1.5 text-center font-normal text-[10px] uppercase tracking-widest ${i < 2 ? 'text-blue-400 dark:text-blue-500' :
                                                    i < 4 ? 'text-violet-400 dark:text-violet-500' :
                                                        i < 6 ? 'text-orange-400 dark:text-orange-500' :
                                                            i < 8 ? 'text-emerald-400 dark:text-emerald-500' :
                                                                'text-rose-400 dark:text-rose-500'
                                                    } ${i === 1 || i === 3 || i === 5 || i === 7 ? 'border-r border-slate-100 dark:border-white/[0.06]' : ''}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getDtrRows().map((row, ri) => {
                                            const weekend = isWeekend(row.day);
                                            const hasEntry = hasAnyEntry(row);
                                            return (
                                                <tr key={ri} className={`border-t border-slate-100 dark:border-white/[0.04] transition-colors ${weekend ? 'bg-slate-50/80 dark:bg-white/[0.01]' :
                                                    hasEntry ? 'hover:bg-indigo-50/40 dark:hover:bg-indigo-500/[0.04]' :
                                                        'hover:bg-slate-50/60 dark:hover:bg-white/[0.01]'
                                                    }`}>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 font-bold tabular-nums border-r border-slate-100 dark:border-white/[0.04] ${hasEntry ? 'text-indigo-600 dark:text-indigo-300' : weekend ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-500'}`}>
                                                        {String(row.date).padStart(2, '0')}
                                                    </td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 border-r border-slate-100 dark:border-white/[0.04] whitespace-nowrap ${weekend ? 'text-rose-400 dark:text-rose-500 italic' : 'text-slate-500 dark:text-slate-500'}`}>
                                                        {row.day || '—'}
                                                    </td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center tabular-nums ${row.amIn ? 'text-blue-600 dark:text-blue-300 font-semibold' : 'text-slate-300 dark:text-slate-700'}`}>{row.amIn || '—'}</td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center tabular-nums border-r border-slate-100 dark:border-white/[0.04] ${row.amOut ? 'text-blue-500 dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}>{row.amOut || '—'}</td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center tabular-nums ${row.pmIn ? 'text-violet-600 dark:text-violet-300 font-semibold' : 'text-slate-300 dark:text-slate-700'}`}>{row.pmIn || '—'}</td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center tabular-nums border-r border-slate-100 dark:border-white/[0.04] ${row.pmOut ? 'text-violet-500 dark:text-violet-400' : 'text-slate-300 dark:text-slate-700'}`}>{row.pmOut || '—'}</td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center tabular-nums ${row.otIn ? 'text-orange-600 dark:text-orange-300 font-semibold' : 'text-slate-300 dark:text-slate-700'}`}>{row.otIn || '—'}</td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center tabular-nums border-r border-slate-100 dark:border-white/[0.04] ${row.otOut ? 'text-orange-500 dark:text-orange-400' : 'text-slate-300 dark:text-slate-700'}`}>{row.otOut || '—'}</td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center tabular-nums ${row.hrsReg ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-300 dark:text-slate-700'}`}>{row.hrsReg || '—'}</td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center tabular-nums border-r border-slate-100 dark:border-white/[0.04] ${row.minsReg ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700'}`}>{row.minsReg || '—'}</td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center tabular-nums ${row.hrsSat ? 'text-rose-600 dark:text-rose-300' : 'text-slate-300 dark:text-slate-700'}`}>{row.hrsSat || '—'}</td>
                                                    <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center tabular-nums ${row.minsSat ? 'text-rose-500 dark:text-rose-400' : 'text-slate-300 dark:text-slate-700'}`}>{row.minsSat || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : !loading && fetchMsg.startsWith('✓') ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <span className="text-4xl mb-3 opacity-20">📭</span>
                            <p className="font-dm-mono text-sm text-slate-400 dark:text-slate-600">Sheet is empty</p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const DTRPage: React.FC = () => {
    const [tab, setTab] = useState<'logger' | 'timelog'>('logger');
    return (
        <div className="font-syne min-h-screen w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
            <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-16 sm:pb-24">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#14b8a6)' }}>⏱</div>
                        <h1 className="font-syne text-2xl font-extrabold tracking-tight text-slate-800 dark:text-transparent dark:bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(90deg,#f9fafb,#9ca3af)' }}>DTR Logger</h1>
                    </div>
                    <p className="font-dm-mono text-xs text-slate-400 dark:text-slate-500 pl-12">Manual punch · live clock · Google Sheets sync</p>
                </div>

                {/* Tab nav */}
                <div className="flex items-center gap-1 mb-6 border-b border-slate-200 dark:border-white/[0.08]">
                    {([{ key: 'logger', label: '⏱ Time Logger' }, { key: 'timelog', label: '📊 View Log' }] as const).map(({ key, label }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`font-dm-mono px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px ${tab === key ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 dark:border-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'logger' && <TimeLoggerPanel />}
                {tab === 'timelog' && <TimeLogPanel />}
            </div>
        </div>
    );
};

export default DTRPage;