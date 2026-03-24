'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, X, Loader2, Image as ImageIcon, RotateCcw, Sparkles } from 'lucide-react';
import { IoLogoBuffer, IoIosColorWand, IoIosPin } from "react-icons/io";

export default function BackgroundRemover() {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const segmentationRef = useRef<any>(null);

    /* ── Init MediaPipe on mount ── */
    useEffect(() => {
        const init = async () => {
            try {
                const mp = await import('@mediapipe/selfie_segmentation');
                const SelfieClass = mp.SelfieSegmentation || (mp as any).default;
                if (!SelfieClass) return;

                const seg = new SelfieClass({
                    locateFile: (file: string) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
                });
                seg.setOptions({ modelSelection: 1 });
                seg.onResults(handleResults);
                segmentationRef.current = seg;
                setModelLoaded(true);
            } catch (err) {
                console.error('MediaPipe failed to load:', err);
            }
        };
        init();
    }, []);

    /* ── Core canvas logic ── */
    const handleResults = (results: any) => {
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
        setLoading(false);
    };

    /* ── File handling ── */
    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            setOriginalImage(e.target?.result as string);
            setProcessedImage(null);
            setLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
    }, []);

    /* ── Run segmentation ── */
    const runSegmentation = async () => {
        if (!originalImage || !segmentationRef.current) return;
        setLoading(true);
        const img = new Image();
        img.src = originalImage;
        await img.decode();
        if (canvasRef.current) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
        }
        await segmentationRef.current.send({ image: img });
    };

    const downloadImage = () => {
        if (!processedImage) return;
        const a = document.createElement('a');
        a.href = processedImage;
        a.download = 'no-bg.png';
        a.click();
    };

    const reset = () => {
        setOriginalImage(null);
        setProcessedImage(null);
    };

    /* ════════════════════════════════════════════
       RENDER
       ════════════════════════════════════════════ */
    return (
        <div className="min-h-full w-full bg-gray-50 dark:bg-[#0f0e17] overflow-y-auto">


            {/* ── Page header ── */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0f0e17]/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06] px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 rounded-full opacity-30"
                        style={{ background: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.4) 0%, transparent 60%)" }} />
                    <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20"
                        style={{ background: "radial-gradient(circle at 0% 100%, rgba(99,102,241,0.3) 0%, transparent 60%)" }} />

                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                            <IoIosColorWand className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="font-syne text-lg font-extrabold tracking-tight text-slate-800 dark:text-transparent dark:bg-clip-text"
                                style={{ backgroundImage: 'linear-gradient(90deg,#f9fafb,#9ca3af)' }}>Background Remover</h1>
                            <p className="text-[10px] text-white/30 tracking-wider uppercase">100% client-side · your images never leave this device</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Model status pill */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border
              ${modelLoaded
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${modelLoaded ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                            {modelLoaded ? 'AI ready' : 'Loading AI…'}
                        </div>

                        {originalImage && (
                            <button
                                onClick={reset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  text-gray-500 dark:text-white/40
                  hover:bg-gray-100 dark:hover:bg-white/[0.05]
                  transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">

                {/* ══ UPLOAD ZONE ══ */}
                {!originalImage && (
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
              transition-all duration-200 cursor-pointer
              min-h-[360px]
              ${dragActive
                                ? 'border-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 scale-[1.01]'
                                : 'border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-500/[0.02]'
                            }`}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                        />

                        <div className="flex flex-col items-center gap-4 pointer-events-none select-none">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                ${dragActive ? 'bg-indigo-500/15' : 'bg-gray-100 dark:bg-white/[0.05]'}`}
                            >
                                <Upload className={`w-7 h-7 transition-colors ${dragActive ? 'text-indigo-400' : 'text-gray-400 dark:text-white/25'}`} />
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
                {originalImage && (
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
                    hover:bg-red-500/10
                    transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="relative aspect-square rounded-xl overflow-hidden
                bg-white dark:bg-white/[0.03]
                border border-black/[0.07] dark:border-white/[0.07]">
                                <img src={originalImage} className="w-full h-full object-contain" alt="Original" />
                            </div>
                        </div>

                        {/* Result */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-gray-400 dark:text-white/25">
                                    Result
                                </p>
                                {processedImage && (
                                    <button
                                        onClick={downloadImage}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                      bg-indigo-500/10 text-indigo-500 dark:text-indigo-400
                      hover:bg-indigo-500/20
                      border border-indigo-500/20
                      transition-colors"
                                    >
                                        <Download className="w-3 h-3" />
                                        Save PNG
                                    </button>
                                )}
                            </div>

                            {/* Checkerboard bg for transparency */}
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
                                {processedImage ? (
                                    <img src={processedImage} className="w-full h-full object-contain" alt="Result" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/60 dark:bg-black/30">
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                                <p className="text-xs font-medium text-gray-500 dark:text-white/40 animate-pulse">
                                                    Removing background…
                                                </p>
                                            </>
                                        ) : (
                                            <button
                                                onClick={runSegmentation}
                                                disabled={!modelLoaded}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                          bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
                          disabled:opacity-50 disabled:cursor-not-allowed
                          text-white transition-colors shadow-sm"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                {modelLoaded ? 'Remove background' : 'Loading AI engine…'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {/* ── Info strip ── */}
                <div className="mt-8 flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl
          bg-white dark:bg-white/[0.02]
          border border-black/[0.06] dark:border-white/[0.06]">
                    {[
                        { label: 'Engine', value: 'MediaPipe Selfie Segmentation' },
                        { label: 'Privacy', value: 'No server upload — runs in browser' },
                        { label: 'Output', value: 'Transparent PNG' },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center gap-2">
                            <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-gray-300 dark:text-white/20">
                                {label}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-white/40">{value}</span>
                        </div>
                    ))}
                </div>

            </div>

            {/* Hidden processing canvas */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}