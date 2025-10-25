// page.tsx
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */


import React from "react";
import ImageUploader from "./components/ImageUploader";
import ImageControls from "./components/ImageControls";
import PreviewArea from "./components/PreviewArea";
import BreadCrumb from "../../component/breadcrumb";
// Corrected import path for context assuming it's in app/context/
import { ImageEditorProvider, useImageEditor } from "./components/ImageEditorContext";
import { MdDelete } from "react-icons/md";
import { useAuth } from "../../Chat/AuthContext";
import { Info } from "lucide-react";

// Main page component for the watermark application.
function WatermarkPageContent() {
    const { images, removeAllImages } = useImageEditor();
    const { user } = useAuth();

    if (user || (user as any)?.canChat === true)

        return (
            <div className="min-h-screen flex flex-col font-sans overflow-hidden w-full">
                {/* Left Panel for Uploads and Controls */}
                <div className="flex min-h-screen">
                    <div className="w-[350px] h-screen overflow-auto p-4 border-r flex flex-col shadow-lg rounded-r-lg">
                        <div className="mb-5 mt-2 ">
                            <BreadCrumb />
                        </div>
                        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center justify-between">Watermark Editor

                            {images.length !== 0 &&
                                <div onClick={removeAllImages} className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full cursor-pointer hover:bg-red-200 transition-colors duration-300 text-gray-100 hover:text-red-500">
                                    <MdDelete className=" text-[15px]" />
                                </div>
                            }
                        </h1>

                        <div className=" border border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-600 dark:text-blue-100">
                                <strong>100% Client-Side Processing:</strong> Your images never leave your device.
                                It runs in your browser, ensuring maximum privacy and security.
                            </div>
                        </div>

                        <div className="mb-8">
                            <ImageUploader />
                        </div>
                        {/* ImageControls is always rendered, it will internally decide if it's showing
                    global controls or individual controls based on selectedImageIndex. */}
                        <ImageControls />

                    </div>

                    {/* Right Panel for Previews */}
                    <div className="flex-1 overflow-auto  h-screen">
                        <PreviewArea />
                    </div>
                </div>
            </div>
        );
}

// Wrapper for WatermarkPageContent to provide the ImageEditorContext.
function WatermarkPage() {
    return (
        <ImageEditorProvider>
            <WatermarkPageContent />
        </ImageEditorProvider>
    );
}

export default WatermarkPage
