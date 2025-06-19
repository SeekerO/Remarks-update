// page.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint / no - unused - vars */

import React from "react";
import ImageUploader from "./components/ImageUploader";
import ImageControls from "./components/ImageControls";
import PreviewArea from "./components/PreviewArea";
// Corrected import path for context assuming it's in app/context/
import { ImageEditorProvider, useImageEditor } from "./components/ImageEditorContext";

// Main page component for the watermark application.
function WatermarkPageContent() {
    // Access the images from the context to conditionally display messages.
    const { images } = useImageEditor();

    return (
        <div className="min-h-screen flex font-sans">
            {/* Left Panel for Uploads and Controls */}
            <div className="w-[350px] p-4 border-r bg-gray-50 flex flex-col shadow-lg rounded-r-lg">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Watermark Editor</h1>
                <div className="mb-8">
                    <ImageUploader />
                </div>
                {/* ImageControls is always rendered, it will internally decide if it's showing
                    global controls or individual controls based on selectedImageIndex. */}
                <ImageControls />
                {!images.length && ( // Display message if no images are uploaded
                    <p className="text-gray-500 text-center mt-8 p-4 bg-white rounded-lg shadow-inner">
                        Upload images to start editing.
                    </p>
                )}
            </div>

            {/* Right Panel for Previews */}
            <div className="flex-1 p-6 overflow-auto bg-gray-100">
                <PreviewArea />
            </div>
        </div>
    );
}

// Wrapper for WatermarkPageContent to provide the ImageEditorContext.
export default function WatermarkPage() {
    return (
        <ImageEditorProvider>
            <WatermarkPageContent />
        </ImageEditorProvider>
    );
}
