'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { Upload, Download, X, Loader2, Image, Info } from 'lucide-react';
import { useAuth } from '../../Chat/AuthContext';
const BackgroundRemover: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [progress, setProgress] = useState<string>('');
    const { user } = useAuth();

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setOriginalImage(e.target?.result as string);
            setProcessedImage(null);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const removeBackground = async () => {
        if (!originalImage) {
            setError('Please upload an image');
            return;
        }

        setLoading(true);
        setError(null);
        setProgress('Loading AI model...');

        try {
            // Dynamically import the library
            const { removeBackground: removeBg } = await import('@imgly/background-removal');

            setProgress('Processing image...');

            // Convert data URL to blob
            const response = await fetch(originalImage);
            const blob = await response.blob();

            // Remove background
            const result = await removeBg(blob, {
                progress: (key, current, total) => {
                    const percentage = Math.round((current / total) * 100);
                    setProgress(`${key}: ${percentage}%`);
                },
            });

            // Convert result to data URL
            const url = URL.createObjectURL(result);
            setProcessedImage(url);
            setProgress('');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to remove background');
            setProgress('');
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = () => {
        if (!processedImage) return;

        const link = document.createElement('a');
        link.href = processedImage;
        link.download = 'removed-background.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const reset = () => {
        setOriginalImage(null);
        setProcessedImage(null);
        setError(null);
        setProgress('');
    };
    if (user || (user as any)?.canChat === true)
        return (
            <div className="h-screen w-screen flex bg-gradient-to-br px-3 py-5 overflow-y-auto">
                <div className="max-w-6xl h-[80%] mx-auto mt-10 flex flex-col">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-slate-800 dark:text-gray-100 mb-2">Background Remover</h1>
                        <p className="text-gray-600 dark:text-gray-100">Remove backgrounds from your images using AI - completely free!</p>
                    </div>

                    <div className=" border border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-600 dark:text-blue-100">
                            <strong>100% Client-Side Processing:</strong> Your images never leave your device.
                            The AI model runs directly in your browser. First use may take longer as the model downloads (~50MB).
                        </div>
                    </div>

                    {!originalImage ? (
                        <div
                            className={` rounded-lg shadow-lg p-12 text-center transition-all ${dragActive ? 'border-4 border-purple-800 ' : 'border border-dashed border-blue-700'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2">
                                Drag and drop your image here
                            </h3>
                            <p className="text-gray-100 mb-6">or</p>
                            <label className="inline-block">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInput}
                                    className="hidden"
                                />
                                <span className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer inline-flex items-center gap-2">
                                    <Image className="w-5 h-5" />
                                    Choose File
                                </span>
                            </label>
                        </div>
                    ) : (
                        <div className="border-blue-700 border  rounded-lg shadow-lg p-6 h-fit">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold dark:text-gray-100 text-gray-800">
                                    {processedImage ? 'Results' : 'Preview'}
                                </h3>
                                <button
                                    onClick={reset}
                                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="text-sm font-medium dark:text-gray-100 text-gray-600 mb-2">Original</h4>
                                    <div className="relative aspect-square border-slate-50 bg-white border-dashed border-2 rounded-lg overflow-hidden">
                                        <img
                                            src={originalImage}
                                            alt="Original"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium dark:text-gray-100 text-gray-600 mb-2">Processed</h4>
                                    <div className="relative aspect-square border-slate-50 border-2 bg-white rounded-lg overflow-hidden bg-[linear-gradient(45deg,#e5e5e5_25%,transparent_25%,transparent_75%,#e5e5e5_75%,#e5e5e5),linear-gradient(45deg,#e5e5e5_25%,transparent_25%,transparent_75%,#e5e5e5_75%,#e5e5e5)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
                                        {processedImage ? (
                                            <img
                                                src={processedImage}
                                                alt="Processed"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                {loading ? (
                                                    <div className="text-center">
                                                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
                                                        {progress && (
                                                            <p className="text-sm text-gray-600">{progress}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Image className="w-12 h-12" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4 justify-center">
                                {!processedImage ? (
                                    <button
                                        onClick={removeBackground}
                                        disabled={loading}
                                        className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Remove Background'
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={downloadImage}
                                            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download
                                        </button>
                                        <button
                                            onClick={reset}
                                            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            Upload New Image
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
};

export default BackgroundRemover;
