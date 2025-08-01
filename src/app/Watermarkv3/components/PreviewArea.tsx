// app/components/PreviewArea.tsx
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */


import React, { useState, useRef, useEffect, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from 'file-saver';
import { useImageEditor } from "./ImageEditorContext";
import SingleImageEditor from "./SingleImageEditor"; // Ensure this is the updated one
import ModalLoading from "./ModalLoading";
import { HiOutlineFolderDownload } from "react-icons/hi";
import { IoImage } from "react-icons/io5";

export default function PreviewArea() {
    const { images, selectedImageIndex, setSelectedImageIndex } = useImageEditor();
    const [processing, setProcessing] = useState<boolean>(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [fileName, setFileName] = useState<string>("watermarked_images.zip");

    const abortControllerRef = useRef<AbortController | null>(null);

    // New: Store functions to get blobs from each SingleImageEditor
    // Map index to a function that returns a Promise<Blob | null>
    const imageBlobGetters = useRef<Map<number, () => Promise<Blob | null>>>(new Map());

    // Callback from SingleImageEditor when its canvas is ready
    const handleCanvasReady = useCallback((index: number, getBlobFunc: () => Promise<Blob | null>) => {
        imageBlobGetters.current.set(index, getBlobFunc);
        console.log(`Canvas ${index} ready and getter stored.`);
    }, []); // Dependencies are empty because getBlobFunc changes on each render of child, but we only care about the latest

    const downloadAll = async () => {
        if (images.length === 0) return;

        setProcessing(true);
        setDownloadProgress(0);

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const filteredFilename = fileName.replace(".", " ");
        const zip = new JSZip();
        const folder = zip.folder(filteredFilename);

        try {
            for (const [index] of images.entries()) {
                if (signal.aborted) {
                    console.log("Download cancelled during image processing loop (Aborted signal).");
                    return;
                }

                // *** CRITICAL CHANGE HERE ***
                // Get the blob using the stored getter function, NOT by document.getElementById
                const getBlob = imageBlobGetters.current.get(index);
                if (!getBlob) {
                    console.warn(`No blob getter found for image at index ${index}. This image might not be loaded yet or failed to render.`);
                    // Optionally, you could try to wait, or skip this image, or throw an error.
                    // For now, it will skip.
                    continue;
                }

                const blob: Blob | null = await getBlob(); // Call the function to get the blob

                if (signal.aborted) {
                    console.log("Download cancelled after blob creation (Aborted signal).");
                    return;
                }

                if (blob) {
                    folder?.file(`watermarked_image_${index + 1}.png`, blob);
                    setDownloadProgress(prev => prev + 1);
                } else {
                    console.warn(`Failed to get blob for image at index ${index}. Blob was null.`);
                }
            }

            if (signal.aborted) {
                console.log("Download cancelled before zip generation (Aborted signal).");
                return;
            }

            const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
                console.log("Zip generation progress (JSZip):", metadata.percent);
                if (signal.aborted) {
                    console.log("Abort signal detected during JSZip progress callback. Preventing further actions.");
                }
            });

            if (signal.aborted) {
                console.log("Download cancelled after zip generation, before save (Aborted signal).");
                return;
            }
            saveAs(content, filteredFilename);

        } catch (error: any) {
            console.error("Error during download process:", error);
        } finally {
            setProcessing(false);
            setDownloadProgress(0);
            abortControllerRef.current = null;
            // Clear the map to ensure fresh getters are collected if images are re-uploaded/changed significantly
            imageBlobGetters.current.clear();
        }
    };

    const cancelDownload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            console.log("Abort signal sent.");
        }
        setProcessing(false);
        setDownloadProgress(0);
    };

    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastClickedIndexRef = useRef<number | null>(null);
    const DOUBLE_CLICK_THRESHOLD_MS = 300;

    const handleSelectImage = useCallback((index: number) => {
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;

            if (lastClickedIndexRef.current === index) {
                setSelectedImageIndex(null);
                lastClickedIndexRef.current = null;
            } else {
                setSelectedImageIndex(index);
                lastClickedIndexRef.current = index;
                clickTimerRef.current = setTimeout(() => {
                    clickTimerRef.current = null;
                    lastClickedIndexRef.current = null;
                }, DOUBLE_CLICK_THRESHOLD_MS);
            }
        } else {
            setSelectedImageIndex(index);
            lastClickedIndexRef.current = index;
            clickTimerRef.current = setTimeout(() => {
                clickTimerRef.current = null;
                lastClickedIndexRef.current = null;
            }, DOUBLE_CLICK_THRESHOLD_MS);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    Image Previews
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shadow-sm">
                        <IoImage className="mr-1 text-base" />
                        {images.length}
                    </span>
                </h2>
                {images.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Enter file name (optional)"
                            onChange={(e) => setFileName(e.target.value)}
                            className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 w-full sm:w-auto"
                        />
                        <button
                            onClick={downloadAll}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            disabled={images.length === 0 || processing}
                        >
                            <HiOutlineFolderDownload className="text-2xl" /> Download All as ZIP
                        </button>
                    </div>
                )}
            </div>

            {images.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-xl text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700">
                    No images uploaded yet. Please use the uploader on the left.
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`relative rounded-xl overflow-hidden transition-all duration-300 ease-in-out cursor-pointer
                            ${selectedImageIndex === index
                                    ? "border-4 border-blue-500 shadow-xl scale-102"
                                    : "border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 shadow-md hover:shadow-lg"
                                } h-fit`}
                            onClick={() => handleSelectImage(index)}
                        >
                            {/* Pass the new callback to SingleImageEditor */}
                            <SingleImageEditor image={image} index={index} onCanvasReady={handleCanvasReady} />
                            {selectedImageIndex === index && (
                                <div className="select-none absolute inset-0 bg-blue-600 bg-opacity-30 rounded-xl flex items-center justify-center text-white font-bold text-3xl opacity-100 transition-opacity duration-300 pointer-events-none">
                                    SELECTED
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ModalLoading open={processing} cancelProcess={cancelDownload} progress={downloadProgress} totalImages={images.length} />
        </div>
    );
}