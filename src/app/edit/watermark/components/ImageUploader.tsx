"use client";

import React, { useRef, useState } from "react";
import { useImageEditor } from "./ImageEditorContext";
import { FaImage, FaImages } from "react-icons/fa6";
import { Plus, Zap, ZapOff } from "lucide-react";
import PresSelect from "./PresSelect";

const optimizeLargeImage = (file: File): Promise<File | Blob> => {
    return new Promise((resolve) => {
        if (file.size < 10 * 1024 * 1024) return resolve(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
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
                            const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
                            resolve(optimizedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    "image/jpeg",
                    0.85
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
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [autoOptimize, setAutoOptimize] = useState(true);

    const {
        images, setImages, selectedImageIndex, setSelectedImageIndex,
        addGlobalLogo, addIndividualLogo, addGlobalFooter, addIndividualFooter,
    } = useImageEditor();

    const isIndividual = selectedImageIndex !== null && !images[selectedImageIndex]?.useGlobalSettings;

    const handleImagesUpload = async (files: File[]) => {
        setIsOptimizing(true);
        try {
            const processedFiles = await Promise.all(
                files.map(async (file) => {
                    const finalFile = autoOptimize ? await optimizeLargeImage(file) : file;
                    return { file: finalFile as File, url: URL.createObjectURL(finalFile), useGlobalSettings: true };
                })
            );
            setImages(prevImages => [...prevImages, ...processedFiles]);
            if (images.length === 0 && processedFiles.length > 0) setSelectedImageIndex(0);
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setIsOptimizing(false);
            setIsImageDragOver(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleImagesUpload(Array.from(e.target.files));
    };
    const handleMultiLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) Array.from(e.target.files).forEach(f => addGlobalLogo(URL.createObjectURL(f)));
    };
    const handleMultiFooterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) Array.from(e.target.files).forEach(f => addGlobalFooter(URL.createObjectURL(f)));
    };
    const handleIndividualLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && selectedImageIndex !== null)
            Array.from(e.target.files).forEach(f => addIndividualLogo(selectedImageIndex, URL.createObjectURL(f)));
    };
    const handleIndividualFooterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && selectedImageIndex !== null)
            Array.from(e.target.files).forEach(f => addIndividualFooter(selectedImageIndex, URL.createObjectURL(f)));
    };

    const handleDragOver = (e: React.DragEvent, type: string) => {
        e.preventDefault();
        if (type === "image") setIsImageDragOver(true);
        if (type === "multiLogo") setIsMultiLogoDragOver(true);
        if (type === "multiFooter") setIsMultiFooterDragOver(true);
    };
    const handleDragLeave = (e: React.DragEvent, type: string) => {
        e.preventDefault();
        if (type === "image") setIsImageDragOver(false);
        if (type === "multiLogo") setIsMultiLogoDragOver(false);
        if (type === "multiFooter") setIsMultiFooterDragOver(false);
    };
    const handleDrop = (e: React.DragEvent, type: string) => {
        e.preventDefault();
        if (!e.dataTransfer.files.length) return;
        const files = Array.from(e.dataTransfer.files);
        if (type === 'image') handleImagesUpload(files);
        if (type === "multiLogo") files.forEach(f => addGlobalLogo(URL.createObjectURL(f)));
        if (type === "multiFooter") files.forEach(f => addGlobalFooter(URL.createObjectURL(f)));
    };

    return (
        <div className="space-y-6">
            {/* Optimization Toggle */}
            <div className="flex items-center justify-between p-3
                bg-gray-100 dark:bg-gray-800/50
                border border-gray-200 dark:border-gray-700
                rounded-xl">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Image Optimization</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Compresses assets over 10MB</span>
                </div>
                <button
                    onClick={() => setAutoOptimize(!autoOptimize)}
                    className={`relative w-24 h-9 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none
                        ${autoOptimize ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                    <div className={`absolute flex items-center justify-center w-7 h-7 bg-white rounded-full shadow-lg transform transition-transform duration-300
                        ${autoOptimize ? 'translate-x-14' : 'translate-x-0'}`}>
                        {autoOptimize ? <Zap className="w-4 h-4 text-indigo-600" /> : <ZapOff className="w-4 h-4 text-gray-400" />}
                    </div>
                    <span className={`ml-2 text-[10px] font-bold uppercase ${autoOptimize ? 'text-indigo-100 opacity-100' : 'opacity-0'}`}>ON</span>
                    <span className={`ml-auto mr-2 text-[10px] font-bold uppercase ${!autoOptimize ? 'text-white opacity-100' : 'opacity-0'}`}>OFF</span>
                </button>
            </div>

            {/* Images Upload Section */}
            <div>
                <input type="file" multiple ref={imageInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                <label
                    className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer
                        ${isImageDragOver
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-gray-500"
                        } ${isOptimizing ? "cursor-wait" : "cursor-pointer"}`}
                    onDragOver={(e) => handleDragOver(e, 'image')}
                    onDragLeave={(e) => handleDragLeave(e, 'image')}
                    onDrop={(e) => handleDrop(e, 'image')}
                    onClick={() => !isOptimizing && imageInputRef.current?.click()}
                >
                    {isOptimizing ? (
                        <div className="flex flex-col items-center py-2 text-indigo-600 dark:text-indigo-400">
                            <div className="loader" />
                            <span className="font-bold text-lg">Processing Assets...</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {autoOptimize ? "Optimizing high-res files" : "Preparing upload"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <FaImages className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Upload Your Images</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                {autoOptimize ? "Large files will be auto-optimized" : "Original quality will be preserved"}
                            </p>
                            <span className="mt-4 inline-flex items-center justify-center px-6 py-2 text-sm font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Images
                            </span>
                        </>
                    )}
                </label>
            </div>

            {/* Global or Individual inputs */}
            {!isIndividual ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div onClick={() => multiLogoInputRef.current?.click()}>
                        <input type="file" multiple ref={multiLogoInputRef} onChange={handleMultiLogoChange} className="hidden" accept="image/*" />
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer
                            border-gray-300 dark:border-gray-600
                            bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/60
                            transition-colors">
                            <FaImage className="text-2xl text-gray-400 mb-1" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Global Logos</span>
                        </label>
                    </div>

                    <div onClick={() => multiFooterInputRef.current?.click()}>
                        <input type="file" ref={multiFooterInputRef} onChange={handleMultiFooterChange} className="hidden" accept="image/*" />
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer
                            border-gray-300 dark:border-gray-600
                            bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/60
                            transition-colors">
                            <FaImage className="text-2xl text-gray-400 mb-1" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Global Footer</span>
                        </label>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                    <button
                        onClick={() => individualLogoInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed
                            border-purple-300 bg-purple-50 hover:bg-purple-100
                            dark:border-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/30
                            rounded-lg transition-colors"
                    >
                        <input type="file" multiple ref={individualLogoInputRef} onChange={handleIndividualLogoChange} className="hidden" accept="image/*" />
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Add Individual Logo</span>
                    </button>

                    <button
                        onClick={() => individualFooterInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed
                            border-pink-300 bg-pink-50 hover:bg-pink-100
                            dark:border-pink-700 dark:bg-pink-900/20 dark:hover:bg-pink-900/30
                            rounded-lg transition-colors"
                    >
                        <input type="file" ref={individualFooterInputRef} onChange={handleIndividualFooterChange} className="hidden" accept="image/*" />
                        <span className="text-sm font-bold text-pink-700 dark:text-pink-300">Set Individual Footer</span>
                    </button>
                </div>
            )}

            <div className="pt-2">
                <PresSelect />
            </div>
        </div>
    );
}