// app/components/PreviewArea.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef } from "react";
import JSZip from "jszip"; // Import JSZip
import { saveAs } from 'file-saver'; // For saving the generated zip file
import { useImageEditor } from "./ImageEditorContext";
import SingleImageEditor from "./SingleImageEditor";
import ModalLoading from "./ModalLoading";
import { HiOutlineFolderDownload } from "react-icons/hi";
import { IoImage } from "react-icons/io5";

export default function PreviewArea() {
    // Destructure necessary values from the image editor context.
    const { images, selectedImageIndex, setSelectedImageIndex } = useImageEditor();
    const [processing, setProcessing] = useState<boolean>(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [fileName, setFileName] = useState<string>("watermarked_images.zip");

    // Use useRef to store the AbortController instance across renders
    const abortControllerRef = useRef<AbortController | null>(null);


    // Function to download all processed images as a ZIP file.
    const downloadAll = async () => {
        if (images.length === 0) return;

        setProcessing(true);
        setDownloadProgress(0);

        // Initialize a new AbortController for this download session
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;



        const filteredFilename = fileName.replace(".", " ")
        const zip = new JSZip();
        const folder = zip.folder(filteredFilename);

        try {
            for (const [index] of images.entries()) {
                // Immediately check for cancellation signal before processing each image
                if (signal.aborted) {
                    console.log("Download cancelled during image processing loop (Aborted signal).");
                    return; // Exit the function immediately
                }

                const canvas = document.getElementById(`canvas-${index}`) as HTMLCanvasElement;
                if (canvas) {
                    // Get image data as a Blob
                    // Note: canvas.toBlob cannot be directly aborted, but we check signal after it completes.
                    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

                    // Crucial: Check signal *after* blob creation (if it took time)
                    if (signal.aborted) {
                        console.log("Download cancelled after blob creation (Aborted signal).");
                        return; // Exit if cancelled while blob was being created
                    }

                    if (blob) {
                        folder?.file(`watermarked_image_${index + 1}.png`, blob); // Add to zip folder
                        setDownloadProgress(prev => prev + 1); // Update progress
                    }
                }
            }

            // Check for cancellation signal before starting zip generation
            if (signal.aborted) {
                console.log("Download cancelled before zip generation (Aborted signal).");
                return; // Exit the function immediately
            }

            // Corrected: Removed `signal: signal` from the options object
            // JSZip does not natively support AbortSignal directly here.
            const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
                console.log("Zip generation progress (JSZip):", metadata.percent);
                // Even though JSZip doesn't support AbortSignal directly,
                // we can still check signal.aborted *within this callback*
                // to decide if we should stop further processing/cleanup *after* generateAsync completes.
                // However, generateAsync itself will still run to completion.
                if (signal.aborted) {
                    console.log("Abort signal detected during JSZip progress callback. Preventing further actions.");
                    // No direct way to stop generateAsync, but we can ensure .then() doesn't proceed.
                }
            });

            // Final check for cancellation after zip generation completes
            if (signal.aborted) {
                console.log("Download cancelled after zip generation, before save (Aborted signal).");
                return; // Don't save if cancelled
            }
            saveAs(content, filteredFilename);

        } catch (error: any) { // Use 'any' for error to safely check for potential AbortError or others
            // Note: generateAsync will not throw an AbortError from an AbortSignal here
            // because it doesn't natively support it. This catch would be for other errors.
            console.error("Error during download process:", error);
        } finally {
            // Always reset states whether successful, cancelled, or errored
            setProcessing(false);
            setDownloadProgress(0);
            abortControllerRef.current = null; // Clean up the controller reference
        }
    };

    // Function to signal the cancellation
    const cancelDownload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort(); // Trigger the abort signal
            console.log("Abort signal sent.");
        }
        // Immediately update UI for cancellation feedback
        setProcessing(false);
        setDownloadProgress(0);
    };

    return (
        <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    Image Previews
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shadow-sm">
                        <IoImage className="mr-1 text-base" />
                        {images.length}
                    </span>
                </h2>
                {images.length > 0 && (<div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Enter file name (optional)"
                        onChange={(e) => setFileName(e.target.value)}
                        className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 w-full sm:w-auto"
                    />

                    <button
                        onClick={downloadAll}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        disabled={images.length === 0 || processing} // Disable button while processing
                    >
                        <HiOutlineFolderDownload className="text-2xl" /> Download All as ZIP
                    </button>
                </div>
                )}

            </div>

            {/* Content Area */}
            {images.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-xl text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700">
                    No images uploaded yet. Please use the uploader on the left.
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-6">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`relative rounded-xl overflow-hidden transition-all duration-300 ease-in-out cursor-pointer
                            ${selectedImageIndex === index
                                    ? "border-4 border-blue-500 shadow-xl scale-102"
                                    : "border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 shadow-md hover:shadow-lg"
                                }`}
                            onClick={() => setSelectedImageIndex(index)}
                        >
                            <SingleImageEditor image={image} index={index} />
                            {selectedImageIndex === index && (
                                <div className="absolute inset-0 bg-blue-600 bg-opacity-30 rounded-xl flex items-center justify-center text-white font-bold text-3xl opacity-100 transition-opacity duration-300 pointer-events-none">
                                    SELECTED
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Loading Modal */}
            {/* Ensure ModalLoading is imported or passed as a prop */}
            <ModalLoading open={processing} cancelProcess={cancelDownload} progress={downloadProgress} totalImages={images.length} />
        </div>
    );
}