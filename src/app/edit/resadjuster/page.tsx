"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, RefreshCcw, ImageIcon, Maximize2 } from 'lucide-react';
import { MdOpacity } from "react-icons/md";
import { useAuth } from '@/lib/auth/AuthContext';
import { logActivity } from "@/lib/firebase/firebase.actions.firestore/offlineLogger";

interface ImageMeta {
    name: string;
    originalSize: string;
    newSize: string;
    dimensions: { w: number; h: number };
}

/* ── Format bytes helper ── */
const fmt = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${['B', 'KB', 'MB'][i]}`;
};

export default function ResolutionAdjuster() {
    const [previews, setPreviews] = useState<{ original: string; processed: string } | null>(null);
    const [quality, setQuality] = useState(0.5);
    const [meta, setMeta] = useState<ImageMeta | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const { user } = useAuth()

    const canvasRef = useRef<HTMLCanvasElement>(null);

    /* ── Process image ── */
    const processImage = useCallback((src: string, fileName: string, originalSize: number) => {
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const w = Math.round(img.width * quality);
            const h = Math.round(img.height * quality);
            canvas.width = w;
            canvas.height = h;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);

            const result = canvas.toDataURL('image/jpeg', 0.85);
            const head = result.indexOf(',') + 1;
            const newBytes = Math.round((result.length - head) * 0.75);


            setPreviews({ original: src, processed: result });
            setMeta({ name: fileName, originalSize: fmt(originalSize), newSize: fmt(newBytes), dimensions: { w, h } });
        };
        img.src = src;
    }, [quality]);

    /* ── File handler ── */
    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => processImage(e.target?.result as string, file.name, file.size);
        if (!user) return

        await logActivity({
            userName: user.displayName ?? "Unknown",
            userEmail: user.email ?? "unknown@email.com",
            function: "downloadImageBackgroundRemoved",
            urlPath: "/Edit/Backgroundremoverr",
        });

        reader.readAsDataURL(file);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    /* ── Reprocess on quality change ── */
    const handleQualityChange = (val: number) => {
        setQuality(val);
        if (previews) processImage(previews.original, meta!.name, 0);
    };

    const pct = Math.round(quality * 100);

    /* ════════════════════════════════════════════
       RENDER
       ════════════════════════════════════════════ */

    return (
        <div className="min-h-full w-full bg-gray-50 dark:bg-[#0f0e17] overflow-y-auto">

            {/* ── Page header ── */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0f0e17]/80 backdrop-blur-md
        border-b border-black/[0.06] dark:border-white/[0.06] px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                            <MdOpacity className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="font-syne text-lg font-extrabold text-slate-800 dark:text-slate-100 dark:bg-clip-text">Resolution Adjuster</h1>
                            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Client-side image downsampling · no upload required</p>
                        </div>
                    </div>


                    {previews && (
                        <button
                            onClick={() => { setPreviews(null); setMeta(null); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                text-gray-500 dark:text-white/40
                hover:bg-gray-100 dark:hover:bg-white/[0.05]
                transition-colors"
                        >
                            <RefreshCcw className="w-3 h-3" />
                            New image
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-[280px_1fr] gap-6">

                    {/* ── Left: controls ── */}
                    <div className="space-y-4">

                        {/* Quality slider card */}
                        <div className="rounded-xl bg-white dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] p-5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-medium uppercase tracking-[0.07em] text-gray-400 dark:text-white/30">
                                    Resolution scale
                                </p>
                                <span className="text-sm font-semibold font-mono text-indigo-500 dark:text-indigo-400">
                                    {pct}%
                                </span>
                            </div>

                            {/* Custom slider */}
                            <div className="relative">
                                <input
                                    type="range"
                                    min="0.05"
                                    max="1"
                                    step="0.05"
                                    value={quality}
                                    onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                                    className="w-full h-1.5 appearance-none rounded-full cursor-pointer
                    bg-gray-200 dark:bg-white/10
                    accent-indigo-500"
                                    style={{
                                        background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${pct}%, transparent ${pct}%, transparent 100%)`,
                                    }}
                                />
                            </div>

                            <div className="flex justify-between mt-2">
                                <span className="text-[10px] text-gray-300 dark:text-white/20">5%</span>
                                <span className="text-[10px] text-gray-300 dark:text-white/20">100%</span>
                            </div>

                            {/* Scale presets */}
                            <div className="grid grid-cols-4 gap-1.5 mt-4">
                                {[25, 50, 75, 100].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => handleQualityChange(v / 100)}
                                        className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors border
                      ${pct === v
                                                ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border-indigo-500/25'
                                                : 'border-black/[0.07] dark:border-white/[0.07] text-gray-400 dark:text-white/30 hover:border-indigo-300 dark:hover:border-indigo-500/30'
                                            }`}
                                    >
                                        {v}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Export details card — only when image is loaded */}
                        {meta && (
                            <div className="rounded-xl bg-white dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] p-5 space-y-3">
                                <p className="text-xs font-medium uppercase tracking-[0.07em] text-gray-400 dark:text-white/30 mb-1">
                                    Export details
                                </p>

                                {[
                                    { label: 'Dimensions', value: `${meta.dimensions.w} × ${meta.dimensions.h} px` },
                                    { label: 'Original', value: meta.originalSize, muted: true },
                                    { label: 'Optimised', value: meta.newSize },
                                ].map(({ label, value, muted }) => (
                                    <div key={label} className="flex items-center justify-between py-2 border-b border-black/[0.05] dark:border-white/[0.05] last:border-0">
                                        <span className="text-xs text-gray-400 dark:text-white/30">{label}</span>
                                        <span className={`text-xs font-mono font-medium ${muted ? 'line-through text-gray-300 dark:text-white/20' : 'text-gray-700 dark:text-white/70'}`}>
                                            {value}
                                        </span>
                                    </div>
                                ))}

                                <a
                                    href={previews?.processed}
                                    download={`optimised-${meta.name}`}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                    bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
                    text-white text-sm font-medium
                    transition-colors no-underline mt-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download image
                                </a>
                            </div>
                        )}
                    </div>

                    {/* ── Right: preview / upload ── */}
                    <div>
                        {!previews ? (
                            /* Drop zone */
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={onDrop}
                                className={`relative flex flex-col items-center justify-center rounded-2xl
                  border-2 border-dashed min-h-[400px] transition-all duration-200 cursor-pointer
                  ${isDragging
                                        ? 'border-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 scale-[1.01]'
                                        : 'border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-indigo-300 dark:hover:border-indigo-500/40'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onInputChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-4 pointer-events-none select-none">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                    ${isDragging ? 'bg-indigo-500/15' : 'bg-gray-100 dark:bg-white/[0.05]'}`}
                                    >
                                        <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-indigo-400' : 'text-gray-400 dark:text-white/25'}`} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-600 dark:text-white/50">
                                            {isDragging ? 'Drop to upload' : 'Drag & drop your image'}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-white/25 mt-1">
                                            or click to browse · PNG, JPG, WebP up to 20MB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Preview */
                            <div className="rounded-2xl overflow-hidden border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-white/[0.02]">
                                {/* Toolbar */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-gray-300 dark:text-white/20" />
                                        <span className="text-xs font-medium text-gray-500 dark:text-white/40 truncate max-w-[200px]">
                                            {meta?.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => { setPreviews(null); setMeta(null); }}
                                        className="w-6 h-6 flex items-center justify-center rounded-md
                      text-gray-300 dark:text-white/20
                      hover:text-red-400 hover:bg-red-500/10
                      transition-colors"
                                    >
                                        <RefreshCcw className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Image preview on checkerboard */}
                                <div
                                    className="relative flex items-center justify-center p-6 min-h-[340px]"
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(45deg,#f0f0f0 25%,transparent 25%,transparent 75%,#f0f0f0 75%),' +
                                            'linear-gradient(45deg,#f0f0f0 25%,transparent 25%,transparent 75%,#f0f0f0 75%)',
                                        backgroundSize: '20px 20px',
                                        backgroundPosition: '0 0, 10px 10px',
                                    }}
                                >
                                    <div className="relative group">
                                        <img
                                            src={previews.processed}
                                            className="max-h-[400px] rounded-xl shadow-2xl"
                                            alt="Preview"
                                        />
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                                                <Maximize2 className="w-3 h-3" />
                                                {meta?.dimensions.w} × {meta?.dimensions.h}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Info strip ── */}
                <div className="mt-6 flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl
          bg-white dark:bg-white/[0.02]
          border border-black/[0.06] dark:border-white/[0.06]">
                    {[
                        { label: 'Method', value: 'Canvas 2D downsampling' },
                        { label: 'Privacy', value: 'No server upload — runs in browser' },
                        { label: 'Output', value: 'JPEG at 85% quality' },
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

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}