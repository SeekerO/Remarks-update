// app/components/ImageUploader.tsx
"use client";

import React, { useRef, useState } from "react";
import { useImageEditor } from "./ImageEditorContext";
import { FaImage, FaImages } from "react-icons/fa6";
import { Plus, Loader2 } from "lucide-react";
import PresSelect from "./PresSelect";

/**
 * Utility to optimize images larger than 5MB on the client side.
 * Converts to JPEG and caps resolution to maintain high performance.
 */
const optimizeLargeImage = (file: File): Promise<File | Blob> => {
    return new Promise((resolve) => {
        // If file is small, return original to preserve quality
        if (file.size < 5 * 1024 * 1024) {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Professional resolution cap (2500px)
                const MAX_SIZE = 2500;
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                }

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                                type: "image/jpeg",
                            });
                            resolve(optimizedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    "image/jpeg",
                    0.85 // High quality compression
                );
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export default function ImageUploader() {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const multiLogoInputRef = useRef<HTMLInputElement>(null);
    const multiFooterInputRef = useRef<HTMLInputElement>(null);
    const individualLogoInputRef = useRef<HTMLInputElement>(null);
    const individualFooterInputRef = useRef<HTMLInputElement>(null);

    const [isImageDragOver, setIsImageDragOver] = useState(false);
    const [isMultiLogoDragOver, setIsMultiLogoDragOver] = useState(false);
    const [isMultiFooterDragOver, setIsMultiFooterDragOver] = useState(false);
    const [isIndividualLogoDragOver, setIsIndividualLogoDragOver] = useState(false);
    const [isIndividualFooterDragOver, setIsIndividualFooterDragOver] = useState(false);

    // NEW: Processing state
    const [isOptimizing, setIsOptimizing] = useState(false);

    const {
        images,
        setImages,
        selectedImageIndex,
        setSelectedImageIndex,
        addGlobalLogo,
        addIndividualLogo,
        addGlobalFooter,
        addIndividualFooter,
    } = useImageEditor();

    const isIndividual = selectedImageIndex !== null && !images[selectedImageIndex]?.useGlobalSettings;

    // Refactored Image Processing Logic
    const handleImagesUpload = async (files: File[]) => {
        setIsOptimizing(true);
        try {
            const processedFiles = await Promise.all(
                files.map(async (file) => {
                    const optimized = await optimizeLargeImage(file);
                    return {
                        file: optimized as File,
                        url: URL.createObjectURL(optimized),
                        useGlobalSettings: true
                    };
                })
            );
            setImages(prevImages => [...prevImages, ...processedFiles]);
            if (images.length === 0) setSelectedImageIndex(0);
        } catch (error) {
            console.error("Optimization failed:", error);
        } finally {
            setIsOptimizing(false);
            setIsImageDragOver(false);
        }
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            handleImagesUpload(Array.from(event.target.files));
        }
    };

    const handleMultiLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) Array.from(event.target.files).forEach(f => addGlobalLogo(URL.createObjectURL(f)));
    };

    const handleMultiFooterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) Array.from(event.target.files).forEach(f => addGlobalFooter(URL.createObjectURL(f)));
    };

    const handleIndividualLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && selectedImageIndex !== null) Array.from(event.target.files).forEach(f => addIndividualLogo(selectedImageIndex, URL.createObjectURL(f)));
    };

    const handleIndividualFooterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && selectedImageIndex !== null) Array.from(event.target.files).forEach(f => addIndividualFooter(selectedImageIndex, URL.createObjectURL(f)));
    };

    const handleDragOver = (e: React.DragEvent, type: string) => {
        e.preventDefault();
        if (type === "image") setIsImageDragOver(true);
        if (type === "multiLogo") setIsMultiLogoDragOver(true);
        if (type === "multiFooter") setIsMultiFooterDragOver(true);
        if (type === "individualLogo") setIsIndividualLogoDragOver(true);
        if (type === "individualFooter") setIsIndividualFooterDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent, type: string) => {
        e.preventDefault();
        if (type === "image") setIsImageDragOver(false);
        if (type === "multiLogo") setIsMultiLogoDragOver(false);
        if (type === "multiFooter") setIsMultiFooterDragOver(false);
        if (type === "individualLogo") setIsIndividualLogoDragOver(false);
        if (type === "individualFooter") setIsIndividualFooterDragOver(false);
    };

    const handleDrop = (e: React.DragEvent, type: string) => {
        e.preventDefault();
        if (!e.dataTransfer.files.length) return;
        const files = Array.from(e.dataTransfer.files);

        if (type === 'image') {
            handleImagesUpload(files);
        }
        if (type === "multiLogo") files.forEach(f => addGlobalLogo(URL.createObjectURL(f)));
        if (type === "multiFooter") files.forEach(f => addGlobalFooter(URL.createObjectURL(f)));
        if (type === "individualLogo" && selectedImageIndex !== null) files.forEach(f => addIndividualLogo(selectedImageIndex, URL.createObjectURL(f)));
        if (type === "individualFooter" && selectedImageIndex !== null) files.forEach(f => addIndividualFooter(selectedImageIndex, URL.createObjectURL(f)));
    };

    const triggerImageInput = () => imageInputRef.current?.click();
    const triggerMultiLogoInput = () => multiLogoInputRef.current?.click();
    const triggerMultiFooterInput = () => multiFooterInputRef.current?.click();
    const triggerIndividualLogoInput = () => individualLogoInputRef.current?.click();
    const triggerIndividualFooterInput = () => individualFooterInputRef.current?.click();

    return (
        <div className="space-y-6">
            {/* Images Upload Section */}
            <div>
                <input
                    type="file"
                    multiple
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                />
                <label
                    className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-300
                        ${isImageDragOver
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-gray-300 bg-gray-50 hover:border-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                        } ${isOptimizing ? "cursor-wait" : "cursor-pointer"}`}
                    onDragOver={(e) => handleDragOver(e, 'image')}
                    onDragLeave={(e) => handleDragLeave(e, 'image')}
                    onDrop={(e) => handleDrop(e, 'image')}
                    onClick={() => !isOptimizing && triggerImageInput()}
                >
                    {isOptimizing ? (
                        <div className="flex flex-col items-center py-2 text-indigo-600 dark:text-indigo-400">
                            <Loader2 className="w-12 h-12 animate-spin mb-3" />
                            <span className="font-bold text-lg">Optimizing Large Assets...</span>
                            <p className="text-xs text-gray-400 mt-1">Applying client-side compression</p>
                        </div>
                    ) : (
                        <>
                            <FaImages className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Upload Your Images</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">(Images 10MB+ will be auto-optimized)</p>
                            <span className="mt-4 inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Images
                            </span>
                        </>
                    )}
                </label>
            </div>

            {!isIndividual && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Global Logos */}
                    <div>
                        <input type="file" multiple ref={multiLogoInputRef} onChange={handleMultiLogoChange} className="hidden" accept="image/*" />
                        <label
                            className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all
                                ${isMultiLogoDragOver ? "border-purple-500 bg-purple-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800"}`}
                            onDragOver={(e) => handleDragOver(e, 'multiLogo')}
                            onDragLeave={(e) => handleDragLeave(e, 'multiLogo')}
                            onDrop={(e) => handleDrop(e, 'multiLogo')}
                            onClick={triggerMultiLogoInput}
                        >
                            <div className="relative mb-2">
                                <FaImage className="text-2xl text-gray-400" />
                                <Plus className="absolute -top-1 -right-1 w-3 h-3 text-purple-600 bg-white rounded-full" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Global Logos</span>
                        </label>
                    </div>

                    {/* Global Footer */}
                    <div>
                        <input type="file" ref={multiFooterInputRef} onChange={handleMultiFooterChange} className="hidden" accept="image/*" />
                        <label
                            className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all
                                ${isMultiFooterDragOver ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800"}`}
                            onDragOver={(e) => handleDragOver(e, 'multiFooter')}
                            onDragLeave={(e) => handleDragLeave(e, 'multiFooter')}
                            onDrop={(e) => handleDrop(e, 'multiFooter')}
                            onClick={triggerMultiFooterInput}
                        >
                            <div className="relative mb-2">
                                <FaImage className="text-2xl text-gray-400" />
                                <Plus className="absolute -top-1 -right-1 w-3 h-3 text-green-600 bg-white rounded-full" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Global Footer</span>
                        </label>
                    </div>
                </div>
            )}

            {isIndividual && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                    {/* Individual Logos */}
                    <button
                        onClick={triggerIndividualLogoInput}
                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-300 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all"
                    >
                        <input type="file" multiple ref={individualLogoInputRef} onChange={handleIndividualLogoChange} className="hidden" accept="image/*" />
                        <span className="text-sm font-bold text-purple-700">Add Individual Logo</span>
                    </button>

                    {/* Individual Footer */}
                    <button
                        onClick={triggerIndividualFooterInput}
                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-pink-300 bg-pink-50 rounded-lg hover:bg-pink-100 transition-all"
                    >
                        <input type="file" ref={individualFooterInputRef} onChange={handleIndividualFooterChange} className="hidden" accept="image/*" />
                        <span className="text-sm font-bold text-pink-700">Set Individual Footer</span>
                    </button>
                </div>
            )}

            <div className="pt-2">
                <PresSelect />
            </div>
        </div>
    );
}