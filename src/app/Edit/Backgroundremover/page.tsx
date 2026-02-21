'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, X, Loader2, Image as ImageIcon, Info, RotateCcw } from 'lucide-react';

const PureBackgroundRemover: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const segmentationRef = useRef<any>(null);

    // 1. Initialize MediaPipe on Mount
    useEffect(() => {
        const initMediaPipe = async () => {
            try {
                const mpSelfie = await import('@mediapipe/selfie_segmentation');
                // Handle CommonJS vs ESM export differences
                const SelfieClass = mpSelfie.SelfieSegmentation || (mpSelfie as any).default;

                if (SelfieClass) {
                    const selfieSegmentation = new SelfieClass({
                        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
                    });

                    selfieSegmentation.setOptions({
                        modelSelection: 1, // 1 for General (better quality), 0 for Landscape (faster)
                    });

                    selfieSegmentation.onResults(handleSegmentationResults);
                    segmentationRef.current = selfieSegmentation;
                    setModelLoaded(true);
                }
            } catch (err) {
                console.error("Failed to load MediaPipe:", err);
            }
        };

        initMediaPipe();
    }, []);

    // 2. The Core Canvas Logic
    const handleSegmentationResults = (results: any) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and resize
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Step A: Draw the mask provided by the AI
        ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

        // Step B: Use 'source-in' to composite the original image over the mask
        // This keeps only the pixels that overlap with the "person" mask
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        // Step C: Reset composite mode for future operations
        ctx.globalCompositeOperation = 'source-over';

        setProcessedImage(canvas.toDataURL('image/png'));
        setLoading(false);
    };

    // 3. File Handling
    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            setOriginalImage(event.target?.result as string);
            setProcessedImage(null);
            setLoading(false);
        };
        reader.readAsDataURL(file);
    };

    // 4. Drag and Drop Logic
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, []);

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
        const link = document.createElement('a');
        link.href = processedImage;
        link.download = 'no-bg.png';
        link.click();
    };

    return (
        <div className="min-h-screen w-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center">
            <div className="max-w-5xl w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        AI Background Remover
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Privacy-first: Processing happens entirely in your browser.
                    </p>
                </div>

                {!originalImage ? (
                    /* Upload Zone */
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 ${dragActive
                            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                            }`}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            hidden
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                        />
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                                <Upload className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Drag & Drop Image</h3>
                            <p className="text-slate-500 mb-8">or click to browse from your computer</p>

                            <label
                                htmlFor="file-upload"
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-lg shadow-blue-500/25"
                            >
                                Choose Image
                            </label>
                        </div>
                    </div>
                ) : (
                    /* Editor View */
                    <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in zoom-in duration-300">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Original</span>
                                <button onClick={() => setOriginalImage(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                                <img src={originalImage} className="w-full h-full object-contain" alt="Original" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Result</span>
                                {processedImage && (
                                    <button onClick={downloadImage} className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-sm font-bold">
                                        <Download className="w-4 h-4" /> Save PNG
                                    </button>
                                )}
                            </div>
                            <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')]">
                                {processedImage ? (
                                    <img src={processedImage} className="w-full h-full object-contain" alt="Processed" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                                                <p className="font-medium animate-pulse">Removing background...</p>
                                            </>
                                        ) : (
                                            <div className="text-center px-6">
                                                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <button
                                                    onClick={runSegmentation}
                                                    disabled={!modelLoaded}
                                                    className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-bold hover:bg-slate-700 disabled:opacity-50"
                                                >
                                                    {modelLoaded ? "Start AI Processing" : "Loading AI Engine..."}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {originalImage && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => { setOriginalImage(null); setProcessedImage(null); }}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" /> Upload a different image
                        </button>
                    </div>
                )}
            </div>

            {/* Internal processing canvas */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default PureBackgroundRemover;