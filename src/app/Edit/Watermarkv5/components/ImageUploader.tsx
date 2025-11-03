// app/components/ImageUploader.tsx
"use client";

import React, { useRef, useState } from "react";
import { useImageEditor } from "./ImageEditorContext";
import { FaImage } from "react-icons/fa6";
import { Plus } from "lucide-react";

export default function ImageUploader() {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const multiLogoInputRef = useRef<HTMLInputElement>(null);
    const multiFooterInputRef = useRef<HTMLInputElement>(null); // Correct Ref
    const individualLogoInputRef = useRef<HTMLInputElement>(null);
    const individualFooterInputRef = useRef<HTMLInputElement>(null);


    const [isImageDragOver, setIsImageDragOver] = useState(false);
    const [isMultiLogoDragOver, setIsMultiLogoDragOver] = useState(false);
    const [isMultiFooterDragOver, setIsMultiFooterDragOver] = useState(false); // Correct State
    const [isIndividualLogoDragOver, setIsIndividualLogoDragOver] = useState(false);
    const [isIndividualFooterDragOver, setIsIndividualFooterDragOver] = useState(false);


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


    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesArray = Array.from(event.target.files);
            const newImages = filesArray.map(file => ({ file, url: URL.createObjectURL(file), useGlobalSettings: true }));
            setImages(prevImages => [...prevImages, ...newImages]);
            setSelectedImageIndex(images.length === 0 ? 0 : null);
        }
    };


    const handleMultiLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) Array.from(event.target.files).forEach(f => addGlobalLogo(URL.createObjectURL(f)));
    };


    const handleMultiFooterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Renamed function to align with ref and state names
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
        // --- FIX: Add missing 'image' drag over state ---
        if (type === "image") setIsImageDragOver(true);
        // ------------------------------------------------
        if (type === "multiLogo") setIsMultiLogoDragOver(true);
        if (type === "multiFooter") setIsMultiFooterDragOver(true);
        if (type === "individualLogo") setIsIndividualLogoDragOver(true);
        if (type === "individualFooter") setIsIndividualFooterDragOver(true);
    };


    const handleDragLeave = (e: React.DragEvent, type: string) => {
        e.preventDefault();
        // --- FIX: Add missing 'image' drag leave state ---
        if (type === "image") setIsImageDragOver(false);
        // ------------------------------------------------
        if (type === "multiLogo") setIsMultiLogoDragOver(false);
        if (type === "multiFooter") setIsMultiFooterDragOver(false);
        if (type === "individualLogo") setIsIndividualLogoDragOver(false);
        if (type === "individualFooter") setIsIndividualFooterDragOver(false);
    };


    const handleDrop = (e: React.DragEvent, type: string) => {
        e.preventDefault();
        if (!e.dataTransfer.files.length) return;
        const files = Array.from(e.dataTransfer.files);

        // --- FIX: Handle 'image' drop logic ---
        if (type === 'image') {
            const newImages = files.map(file => ({ file, url: URL.createObjectURL(file), useGlobalSettings: true }));
            setImages(prevImages => [...prevImages, ...newImages]);
            setSelectedImageIndex(images.length === 0 ? 0 : null);
        }
        // --------------------------------------

        if (type === "multiLogo") files.forEach(f => addGlobalLogo(URL.createObjectURL(f)));
        if (type === "multiFooter") files.forEach(f => addGlobalFooter(URL.createObjectURL(f)));
        if (type === "individualLogo" && selectedImageIndex !== null) files.forEach(f => addIndividualLogo(selectedImageIndex, URL.createObjectURL(f)));
        if (type === "individualFooter" && selectedImageIndex !== null) files.forEach(f => addIndividualFooter(selectedImageIndex, URL.createObjectURL(f)));
    };


    // Added the triggerImageInput call to the drag/drop logic for consistency
    const triggerImageInput = () => imageInputRef.current?.click();
    const triggerMultiLogoInput = () => multiLogoInputRef.current?.click();
    const triggerMultiFooterInput = () => multiFooterInputRef.current?.click();
    const triggerIndividualLogoInput = () => individualLogoInputRef.current?.click();
    const triggerIndividualFooterInput = () => individualFooterInputRef.current?.click();


    return (
        <div className="space-y-6">
            {/* Images Upload */}
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
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                        ${isImageDragOver
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                        }`}
                    onDragOver={(e) => handleDragOver(e, 'image')}
                    onDragLeave={(e) => handleDragLeave(e, 'image')}
                    onDrop={(e) => handleDrop(e, 'image')}
                    onClick={triggerImageInput}
                >
                    <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Upload Your Images</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">(Drag & drop or click to browse)</p>
                    <span className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200">
                        Select Images
                    </span>
                </label>
            </div>

            {!isIndividual && (
                <>
                    {/* NEW: Multiple Logos Upload */}
                    <div>
                        <input
                            type="file"
                            multiple
                            ref={multiLogoInputRef}
                            onChange={handleMultiLogoChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <label
                            htmlFor="multi-logo-upload"
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                                ${isMultiLogoDragOver
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                    : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                                }`}
                            onDragOver={(e) => handleDragOver(e, 'multiLogo')}
                            onDragLeave={(e) => handleDragLeave(e, 'multiLogo')}
                            onDrop={(e) => handleDrop(e, 'multiLogo')}
                            onClick={triggerMultiLogoInput}
                        >
                            <div className="relative">
                                <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                                <Plus className="absolute -top-1 -right-1 w-5 h-5 text-purple-600 bg-white dark:bg-gray-800 rounded-full" />
                            </div>
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Add Global Logos</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">(Multiple logos supported - Drag & drop or click)</p>
                            <span className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200">
                                <Plus className="w-5 h-5 mr-2" />
                                Add Logos
                            </span>
                        </label>
                    </div>

                    {/* Global Footer (Modified to use the 'multi' variables for consistency) */}
                    <div>
                        <input
                            type="file"
                            // FIX: Use the correct ref
                            ref={multiFooterInputRef}
                            // FIX: Use the correct handler function
                            onChange={handleMultiFooterChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <label
                            htmlFor="footer-upload"
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                                // FIX: Use the correct drag state
                                ${isMultiFooterDragOver
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                                }`}
                            onDragOver={(e) => handleDragOver(e, 'multiFooter')}
                            onDragLeave={(e) => handleDragLeave(e, 'multiFooter')}
                            onDrop={(e) => handleDrop(e, 'multiFooter')}
                            // FIX: Use the correct trigger function
                            onClick={triggerMultiFooterInput}
                        >
                            <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Upload Global Footer</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">(Optional - Drag & drop or click)</p>
                            <span className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-green-600 hover:bg-green-700 transition-colors duration-200">
                                Select Footer
                            </span>
                        </label>
                    </div>
                </>
            )}

            {isIndividual && (
                <>
                    {/* Individual Logos */}
                    <div>
                        <input
                            type="file"
                            multiple
                            ref={individualLogoInputRef}
                            onChange={handleIndividualLogoChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <label
                            htmlFor="individual-logo-upload"
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                                ${isIndividualLogoDragOver
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                    : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                                }`}
                            onDragOver={(e) => handleDragOver(e, 'individualLogo')}
                            onDragLeave={(e) => handleDragLeave(e, 'individualLogo')}
                            onDrop={(e) => handleDrop(e, 'individualLogo')}
                            onClick={triggerIndividualLogoInput}
                        >
                            <div className="relative">
                                <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                                <Plus className="absolute -top-1 -right-1 w-5 h-5 text-purple-600 bg-white dark:bg-gray-800 rounded-full" />
                            </div>
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Add Individual Logos</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">(Multiple logos for this image)</p>
                            <span className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200">
                                <Plus className="w-5 h-5 mr-2" />
                                Add Individual Logos
                            </span>
                        </label>
                    </div>

                    {/* Individual Footer */}
                    <div>
                        <input
                            type="file"
                            ref={individualFooterInputRef}
                            onChange={handleIndividualFooterChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <label
                            htmlFor="individual-footer-upload"
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                                ${isIndividualFooterDragOver
                                    ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                                    : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                                }`}
                            onDragOver={(e) => handleDragOver(e, 'individualFooter')}
                            onDragLeave={(e) => handleDragLeave(e, 'individualFooter')}
                            onDrop={(e) => handleDrop(e, 'individualFooter')}
                            onClick={triggerIndividualFooterInput}
                        >
                            <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-100">Upload Individual Footer</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">(Optional for this image)</p>
                            <span className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-pink-600 hover:bg-pink-700 transition-colors duration-200">
                                Select Footer
                            </span>
                        </label>
                    </div>
                </>
            )}
        </div>
    );
}