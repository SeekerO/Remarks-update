'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Download, RotateCcw, Sparkles, AlertCircle, Loader2, X, Coins, Wifi, WifiOff } from 'lucide-react';
import { IoIosColorWand } from 'react-icons/io';
import { logActivity } from '@/lib/firebase/firebase.actions.firestore/offlineLogger';
import { useAuth } from '@/lib/auth/AuthContext';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Stage = 'idle' | 'preview' | 'processing' | 'done' | 'error';
type Engine = 'api' | 'local';

interface Credits {
    totalCredits: number;
    subscriptionCredits: number;
    paygCredits: number;
    freeCalls: number;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function BackgroundRemover() {
    /* ── Core state ── */
    const [stage, setStage] = useState<Stage>('idle');
    const [engine, setEngine] = useState<Engine>('api');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const { user } = useAuth();

    /* ── Credits (API engine only) ── */
    const [credits, setCredits] = useState<Credits | null>(null);
    const [creditsLoading, setCreditsLoading] = useState(true);

    const refreshCredits = useCallback(() => {
        fetch('/api/remove-bg/credits')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setCredits(data); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const res = await fetch('/api/remove-bg/credits');
                if (res.ok) setCredits(await res.json());
            } catch (err) {
                console.error('Failed to fetch credits:', err);
            } finally {
                setCreditsLoading(false);
            }
        };
        fetchCredits();
    }, []);

    /* ── MediaPipe (local engine) ── */
    const segmentationRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [modelLoading, setModelLoading] = useState(false);

    // Lazy-load MediaPipe only when user switches to local engine
    useEffect(() => {
        if (engine !== 'local' || segmentationRef.current || modelLoading) return;

        const init = async () => {
            setModelLoading(true);
            try {
                const mp = await import('@mediapipe/selfie_segmentation');
                const SelfieClass = mp.SelfieSegmentation || (mp as any).default;
                if (!SelfieClass) throw new Error('SelfieSegmentation not found');

                const seg = new SelfieClass({
                    locateFile: (file: string) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
                });
                seg.setOptions({ modelSelection: 1 });
                seg.onResults(handleMediaPipeResults);
                segmentationRef.current = seg;
                setModelLoaded(true);
            } catch (err) {
                console.error('MediaPipe failed to load:', err);
            } finally {
                setModelLoading(false);
            }
        };
        init();
    }, [engine]);

    const handleMediaPipeResults = (results: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';

        setProcessedImage(canvas.toDataURL('image/png'));
        setStage('done');
    };

    /* ── Engine toggle ── */
    const switchEngine = (next: Engine) => {
        if (next === engine) return;
        // Clear stale result when switching engines
        if (processedImage?.startsWith('blob:')) URL.revokeObjectURL(processedImage);
        setProcessedImage(null);
        setErrorMsg(null);
        if (stage === 'done' || stage === 'error') setStage('preview');
        setEngine(next);
    };

    /* ── File ingestion ── */
    const ingestFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const dataURL = await fileToDataURL(file);
        setOriginalImage(dataURL);
        setOriginalFile(file);
        setProcessedImage(null);
        setErrorMsg(null);
        setStage('preview');
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) ingestFile(file);
    }, [ingestFile]);

    /* ── Remove background — dispatches to correct engine ── */
    const removeBackground = async () => {
        if (!originalImage) return;
        setStage('processing');
        setErrorMsg(null);
        engine === 'api' ? await removeViaAPI() : await removeViaLocal();
    };

    const removeViaAPI = async () => {
        try {
            const imageFile = originalFile ?? new File(
                [await (await fetch(originalImage!)).blob()],
                'upload.png',
                { type: 'image/png' }
            );
            const form = new FormData();
            form.append('image_file', imageFile);

            const res = await fetch('/api/remove-bg', { method: 'POST', body: form });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error ?? `Request failed (${res.status})`);
            }

            const blob = await res.blob();
            setProcessedImage(URL.createObjectURL(blob));
            setStage('done');
            refreshCredits();
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message ?? 'Something went wrong.');
            setStage('error');
        }
    };

    const removeViaLocal = async () => {
        if (!segmentationRef.current) {
            setErrorMsg('AI model not loaded yet. Please wait a moment and try again.');
            setStage('error');
            return;
        }
        try {
            const img = new Image();
            img.src = originalImage!;
            await img.decode();
            if (canvasRef.current) {
                canvasRef.current.width = img.width;
                canvasRef.current.height = img.height;
            }
            // Result handled asynchronously in handleMediaPipeResults
            await segmentationRef.current.send({ image: img });
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message ?? 'Local processing failed.');
            setStage('error');
        }
    };

    /* ── Download ── */
    const downloadImage = async () => {
        if (!processedImage) return;
        const a = document.createElement('a');
        a.href = processedImage;
        a.download = 'no-bg.png';
        a.click();

        if (!user) return;
        await logActivity({
            userName: user.displayName ?? 'Unknown',
            userEmail: user.email ?? 'unknown@email.com',
            function: 'downloadImageBackgroundRemoved',
            urlPath: '/Edit/BackgroundRemover',
        });
    };

    /* ── Reset / Retry ── */
    const reset = () => {
        if (processedImage?.startsWith('blob:')) URL.revokeObjectURL(processedImage);
        setOriginalImage(null);
        setOriginalFile(null);
        setProcessedImage(null);
        setErrorMsg(null);
        setStage('idle');
    };

    const retry = () => { setStage('preview'); setErrorMsg(null); };

    /* ── Info strip ── */
    const infoStrip = engine === 'api'
        ? [
            { label: 'Engine', value: 'remove.bg API' },
            { label: 'Subjects', value: 'People · Products · Animals · Anything' },
            { label: 'Privacy', value: 'Image sent to remove.bg servers' },
            { label: 'Output', value: 'Transparent PNG' },
        ]
        : [
            { label: 'Engine', value: 'MediaPipe Selfie Segmentation' },
            { label: 'Subjects', value: 'People / selfies only' },
            { label: 'Privacy', value: 'Runs entirely in your browser · no upload' },
            { label: 'Output', value: 'Transparent PNG' },
        ];

    /* ════════════════════════════════════════════
       RENDER
    ════════════════════════════════════════════ */
    return (
        <div className="min-h-full w-full bg-gray-50 dark:bg-[#0f0e17] overflow-y-auto">

            {/* ── Page header ── */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0f0e17]/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06] px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between relative overflow-hidden">

                    <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 rounded-full opacity-30"
                        style={{ background: 'radial-gradient(circle at 100% 0%, rgba(99,102,241,0.4) 0%, transparent 60%)' }} />
                    <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle at 0% 100%, rgba(99,102,241,0.3) 0%, transparent 60%)' }} />

                    {/* Title */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                            <IoIosColorWand className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="font-syne text-lg font-extrabold text-slate-800 dark:text-slate-100">
                                Background Remover
                            </h1>
                            <p className="text-[10px] text-gray-400 dark:text-white/30 tracking-wider uppercase">
                                {engine === 'api'
                                    ? 'remove.bg API · any subject'
                                    : 'MediaPipe · local · selfies only'}
                            </p>
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">

                        {/* ── Engine toggle pill ── */}
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06]">
                            <button
                                onClick={() => switchEngine('api')}
                                title="remove.bg API — works on any subject, costs a credit"
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150
                                    ${engine === 'api'
                                        ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50'
                                    }`}
                            >
                                <Wifi className="w-3 h-3" />
                                API
                            </button>
                            <button
                                onClick={() => switchEngine('local')}
                                title="MediaPipe — free, runs in browser, selfies/portraits only"
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150
                                    ${engine === 'local'
                                        ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                        : 'text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50'
                                    }`}
                            >
                                <WifiOff className="w-3 h-3" />
                                Local
                            </button>
                        </div>

                        {/* API credit badges */}
                        {engine === 'api' && (
                            <>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors
                                    ${creditsLoading
                                        ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        : credits !== null && credits.freeCalls <= 5
                                            ? 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20'
                                            : credits !== null && credits.freeCalls <= 15
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    }`}
                                >
                                    <Sparkles className="w-3 h-3" />
                                    {creditsLoading ? 'Loading…' : credits !== null ? `${credits.freeCalls} free` : '—'}
                                </div>

                                {!creditsLoading && credits !== null && credits.totalCredits > 0 && (
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors
                                        ${credits.totalCredits <= 5
                                            ? 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20'
                                            : credits.totalCredits <= 20
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                                        }`}
                                    >
                                        <Coins className="w-3 h-3" />
                                        {`${credits.totalCredits} paid`}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Local model status badge */}
                        {engine === 'local' && (
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border
                                ${modelLoading
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : modelLoaded
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full
                                    ${modelLoading ? 'bg-amber-400 animate-pulse' : modelLoaded ? 'bg-emerald-400' : 'bg-gray-400'}`}
                                />
                                {modelLoading ? 'Loading AI…' : modelLoaded ? 'AI ready' : 'Not loaded'}
                            </div>
                        )}

                        {/* Reset */}
                        {stage !== 'idle' && (
                            <button
                                onClick={reset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                    text-gray-500 dark:text-white/40
                                    hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

                {/* ══ UPLOAD ZONE ══ */}
                {stage === 'idle' && (
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
                            transition-all duration-200 cursor-pointer min-h-[360px]
                            ${dragActive
                                ? 'border-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 scale-[1.01]'
                                : 'border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-500/[0.02]'
                            }`}
                    >
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept="image/*"
                            onChange={(e) => { if (e.target.files?.[0]) ingestFile(e.target.files[0]); }}
                        />
                        <div className="flex flex-col items-center gap-4 pointer-events-none select-none">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                                ${dragActive ? 'bg-indigo-500/15' : 'bg-gray-100 dark:bg-white/[0.05]'}`}
                            >
                                <Upload className={`w-7 h-7 transition-colors
                                    ${dragActive ? 'text-indigo-400' : 'text-gray-400 dark:text-white/25'}`}
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600 dark:text-white/50">
                                    {dragActive ? 'Drop to upload' : 'Drag & drop your image'}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-white/25 mt-1">
                                    or click anywhere to browse · PNG, JPG, WebP
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ EDITOR VIEW ══ */}
                {stage !== 'idle' && originalImage && (
                    <div className="grid md:grid-cols-2 gap-6">

                        {/* Original */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-gray-400 dark:text-white/25">
                                    Original
                                </p>
                                <button
                                    onClick={reset}
                                    className="w-6 h-6 flex items-center justify-center rounded-md
                                        text-gray-300 dark:text-white/20
                                        hover:text-red-400 dark:hover:text-red-400
                                        hover:bg-red-500/10 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07]">
                                <img src={originalImage} className="w-full h-full object-contain" alt="Original" />
                            </div>
                        </div>

                        {/* Result */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-gray-400 dark:text-white/25">
                                    Result
                                </p>
                                {stage === 'done' && processedImage && (
                                    <button
                                        onClick={downloadImage}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                                            bg-indigo-500/10 text-indigo-500 dark:text-indigo-400
                                            hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                                    >
                                        <Download className="w-3 h-3" />
                                        Save PNG
                                    </button>
                                )}
                            </div>

                            {/* Checkerboard */}
                            <div
                                className="relative aspect-square rounded-xl overflow-hidden border border-black/[0.07] dark:border-white/[0.07]"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(45deg,#e5e5e5 25%,transparent 25%,transparent 75%,#e5e5e5 75%),' +
                                        'linear-gradient(45deg,#e5e5e5 25%,transparent 25%,transparent 75%,#e5e5e5 75%)',
                                    backgroundSize: '16px 16px',
                                    backgroundPosition: '0 0, 8px 8px',
                                }}
                            >
                                {stage === 'done' && processedImage && (
                                    <img src={processedImage} className="w-full h-full object-contain" alt="Result" />
                                )}

                                {stage === 'processing' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/60 dark:bg-black/30">
                                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                        <p className="text-xs font-medium text-gray-500 dark:text-white/40 animate-pulse">
                                            {engine === 'api' ? 'Sending to remove.bg…' : 'Running AI locally…'}
                                        </p>
                                    </div>
                                )}

                                {stage === 'preview' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/60 dark:bg-black/30">
                                        <button
                                            onClick={removeBackground}
                                            disabled={engine === 'local' && !modelLoaded}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                                                bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                text-white transition-colors shadow-sm"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            {engine === 'local' && !modelLoaded ? 'Loading AI…' : 'Remove Background'}
                                        </button>
                                        {engine === 'local' && (
                                            <p className="text-[10px] text-amber-500 dark:text-amber-400">
                                                ⚠ Best results with selfies or portraits
                                            </p>
                                        )}
                                    </div>
                                )}

                                {stage === 'error' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 bg-white/60 dark:bg-black/30">
                                        <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <p className="text-xs font-medium text-center">{errorMsg}</p>
                                        </div>
                                        <button
                                            onClick={retry}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium
                                                bg-red-500/10 text-red-500 dark:text-red-400
                                                hover:bg-red-500/20 border border-red-500/20 transition-colors"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            Try again
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Info strip (updates per engine) ── */}
                <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
                    {infoStrip.map(({ label, value }) => (
                        <div key={label} className="flex items-center gap-2">
                            <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-gray-300 dark:text-white/20">
                                {label}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-white/40">{value}</span>
                        </div>
                    ))}
                </div>

            </div>

            {/* Hidden canvas for MediaPipe output */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}