"use client"

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, ImageIcon, RefreshCcw, Maximize2 } from 'lucide-react';

interface ImageMetadata {
    name: string;
    originalSize: string;
    newSize: string;
    dimensions: { w: number; h: number };
}

const ProfessionalResizer: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [previews, setPreviews] = useState<{ original: string; processed: string } | null>(null);
    const [quality, setQuality] = useState<number>(0.3); // 0.1 to 1.0
    const [meta, setMeta] = useState<ImageMetadata | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${['B', 'KB', 'MB'][i]}`;
    };

    const processImage = useCallback((imgSource: string, fileName: string, originalSize: number) => {
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Logic: Maintain aspect ratio but downscale based on quality slider
            const width = img.width * quality;
            const height = img.height * quality;

            canvas.width = width;
            canvas.height = height;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            const resultData = canvas.toDataURL('image/jpeg', 0.8);
            setPreviews({ original: imgSource, processed: resultData });

            // Estimate result size
            const head = resultData.indexOf(',') + 1;
            const resultSize = Math.round((resultData.length - head) * 0.75);

            setMeta({
                name: fileName,
                originalSize: formatSize(originalSize),
                newSize: formatSize(resultSize),
                dimensions: { w: Math.round(width), h: Math.round(height) }
            });
        };
        img.src = imgSource;
    }, [quality]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
        let selectedFile: File | undefined;

        if ('files' in e.target) {
            selectedFile = e.target.files?.[0];
        } else if ('dataTransfer' in e) {
            e.preventDefault();
            selectedFile = e.dataTransfer.files[0];
            setIsDragging(false);
        }

        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (ev) => processImage(ev.target?.result as string, selectedFile!.name, selectedFile!.size);
            reader.readAsDataURL(selectedFile);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 font-sans antialiased text-slate-900">
            {/* Header */}
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Image Optic</h1>
                <p className="mt-2 text-slate-500">Professional-grade client-side image downsampling.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Controls Side */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <label className="text-sm font-semibold text-slate-700 block mb-4 uppercase tracking-wider">
                            Resolution Scale
                        </label>
                        <input
                            type="range" min="0.05" max="1" step="0.05"
                            value={quality}
                            onChange={(e) => {
                                setQuality(parseFloat(e.target.value));
                                if (previews) processImage(previews.original, meta!.name, 0); // Re-process
                            }}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between mt-2 text-xs font-medium text-slate-400">
                            <span>Low Res</span>
                            <span className="text-indigo-600 font-bold">{Math.round(quality * 100)}%</span>
                            <span>Full Res</span>
                        </div>
                    </div>

                    {meta && (
                        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-4">Export Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-indigo-500 pb-2">
                                    <span className="text-xs opacity-80 text-white">Dimensions</span>
                                    <span className="text-sm font-mono">{meta.dimensions.w} × {meta.dimensions.h} px</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-indigo-500 pb-2">
                                    <span className="text-xs opacity-80 text-white">Original</span>
                                    <span className="text-sm font-mono line-through opacity-60">{meta.originalSize}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-xs opacity-80 text-white">Optimized</span>
                                    <span className="text-lg font-bold">{meta.newSize}</span>
                                </div>
                            </div>
                            <a
                                href={previews?.processed}
                                download={`optimized-${meta.name}`}
                                className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all active:scale-95"
                            >
                                <Download size={18} />
                                Download Image
                            </a>
                        </div>
                    )}
                </div>

                {/* Workspace Side */}
                <div className="lg:col-span-8">
                    {!previews ? (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleFile}
                            className={`relative border-2 border-dashed rounded-3xl h-[450px] flex flex-col items-center justify-center transition-all duration-200 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                                }`}
                        >
                            <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                                <Upload className="text-indigo-600" size={32} />
                            </div>
                            <p className="text-slate-900 font-semibold text-lg">Drop your image here</p>
                            <p className="text-slate-500 text-sm mt-1">PNG, JPG or WebP up to 20MB</p>
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFile}
                                accept="image/*"
                            />
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                    <ImageIcon size={16} /> {meta?.name}
                                </span>
                                <button
                                    onClick={() => setPreviews(null)}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <RefreshCcw size={18} />
                                </button>
                            </div>
                            <div className="p-8 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-100">
                                <div className="relative group">
                                    <img
                                        src={previews.processed}
                                        className="max-h-[500px] rounded-lg shadow-2xl transition-all"
                                        alt="Processed"
                                    />
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                            <Maximize2 size={12} /> Preview
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default ProfessionalResizer;