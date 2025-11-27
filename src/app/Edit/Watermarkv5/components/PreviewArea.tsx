// app/components/PreviewArea.tsx
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from 'file-saver';
import { useImageEditor } from "./ImageEditorContext";
import SingleImageEditor from "./SingleImageEditor";
import ModalLoading from "./ModalLoading";
import { HiOutlineFolderDownload } from "react-icons/hi";
import { IoImage } from "react-icons/io5";
import { useTemplateActions } from "./hooks/useTemplateActions";

export default function PreviewArea() {
    const {
        images,
        selectedImageIndex,
        setSelectedImageIndex,
    } = useImageEditor();
    const [processing, setProcessing] = useState<boolean>(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [fileName, setFileName] = useState<string>("watermarked_images.zip");

    const abortControllerRef = useRef<AbortController | null>(null);
    const imageBlobGetters = useRef<Map<number, () => Promise<Blob | null>>>(new Map());

    const { saveTemplate } = useTemplateActions();

    const handleCanvasReady = useCallback((index: number, getBlobFunc: () => Promise<Blob | null>) => {
        imageBlobGetters.current.set(index, getBlobFunc);
        console.log(`Canvas ${index} ready and getter stored.`);
    }, []);

    const downloadAll = async () => {
        saveTemplate();
        if (images.length === 0) return;

        setProcessing(true);
        setDownloadProgress(0);

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const filteredFilename = fileName.replace(/\./g, " ");
        const zip = new JSZip();
        const folder = zip.folder(filteredFilename);

        try {
            // Wait a bit to ensure all canvases are fully rendered
            await new Promise(resolve => setTimeout(resolve, 500));

            for (const [index] of images.entries()) {
                if (signal.aborted) {
                    console.log("Download cancelled during image processing loop (Aborted signal).");
                    return;
                }

                const getBlob = imageBlobGetters.current.get(index);
                if (!getBlob) {
                    console.warn(`No blob getter found for image at index ${index}. Waiting for canvas to be ready...`);

                    // Wait up to 3 seconds for the canvas to be ready
                    let attempts = 0;
                    while (attempts < 30 && !imageBlobGetters.current.has(index)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        attempts++;
                    }

                    const retryGetBlob = imageBlobGetters.current.get(index);
                    if (!retryGetBlob) {
                        console.error(`Canvas ${index} still not ready after waiting. Skipping.`);
                        continue;
                    }
                }

                const finalGetBlob = imageBlobGetters.current.get(index);
                if (!finalGetBlob) continue;

                const blob: Blob | null = await finalGetBlob();

                if (signal.aborted) {
                    console.log("Download cancelled after blob creation (Aborted signal).");
                    return;
                }

                if (blob) {
                    const imageName = images[index].file.name;
                    const nameWithoutExt = imageName.substring(0, imageName.lastIndexOf('.')) || imageName;
                    folder?.file(`${nameWithoutExt}_watermarked.png`, blob);
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
                if (signal.aborted) {
                    console.log("Abort signal detected during JSZip progress callback.");
                }
            });

            if (signal.aborted) {
                console.log("Download cancelled after zip generation, before save (Aborted signal).");
                return;
            }

            saveAs(content, `${filteredFilename}.zip`);
            console.log("✅ All images downloaded successfully!");

        } catch (error: any) {
            console.error("Error during download process:", error);
        } finally {
            setProcessing(false);
            setDownloadProgress(0);
            abortControllerRef.current = null;
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
    }, [setSelectedImageIndex]);

    useEffect(() => {
        return () => {
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Clear stale getters when images array changes significantly
        const currentIndices = new Set(images.map((_, idx) => idx));
        const getterIndices = Array.from(imageBlobGetters.current.keys());

        getterIndices.forEach(idx => {
            if (!currentIndices.has(idx)) {
                imageBlobGetters.current.delete(idx);
            }
        });
    }, [images.length]);

    return (
        <div className="space-y-8 p-6 min-h-screen rounded-lg shadow-inner">
            <div className="flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex px-2 items-center gap-3">
                        Image Previews
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shadow-sm">
                            <IoImage className="mr-1 text-base" size={20} />
                            {images.length}
                        </span>
                    </h2>
                    {images.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Enter file name (optional)"
                                    value={fileName}
                                    maxLength={256}
                                    minLength={1}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="flex-grow px-4 pl-14 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 w-full "
                                />
                                <label className="pr-2 italic text-gray-400 text-sm absolute left-1 top-[25%] border-r-2 border-gray-400">{fileName.length}/256</label>
                            </div>
                            <button
                                onClick={downloadAll}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                                disabled={images.length === 0 || processing}
                            >
                                <HiOutlineFolderDownload className="text-2xl" />
                                <p className="truncate">Download as ZIP</p>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {images.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-xl text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 overflow-hidden">
                    No images uploaded yet. Please use the uploader on the left.
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-6">
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
                            <SingleImageEditor image={image} index={index} onCanvasReady={handleCanvasReady} />
                            {selectedImageIndex === index && (
                                <div className="select-none absolute inset-0 bg-blue-800/30 rounded-xl flex flex-col items-center justify-center text-white font-bold text-3xl opacity-100 transition-opacity duration-300 pointer-events-none">
                                    <h1 className="text-white">SELECTED</h1>
                                    <span className="font-normal italic text-lg">Double Click to DeSelect</span>
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