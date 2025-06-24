// page.tsx
"use client";


import React from "react";
import ImageUploader from "./components/ImageUploader";
import ImageControls from "./components/ImageControls";
import PreviewArea from "./components/PreviewArea";
import BreadCrumb from "../component/breadcrumb";
// Corrected import path for context assuming it's in app/context/
import { ImageEditorProvider, useImageEditor } from "./components/ImageEditorContext";
import { MdDelete } from "react-icons/md";

// Main page component for the watermark application.
function WatermarkPageContent() {
    // Access the images from the context to conditionally display messages.
    const { images } = useImageEditor();

    const handleDeleteAll = () => {
        // Logic to delete all images can be added here.  
        window.location.reload()
        console.log("Delete all images clicked");
    }

    return (
        <div className="min-h-screen flex flex-col font-sans overflow-hidden ">
            {/* Left Panel for Uploads and Controls */}

            <div className="flex min-h-screen">
                <div className="w-[350px] h-screen overflow-auto p-4 border-r bg-gray-50 dark:bg-gray-900 flex flex-col shadow-lg rounded-r-lg">
                    <div className="mb-5 mt-2 ">
                        <BreadCrumb />
                    </div>
                    <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center justify-between">Watermark Editor

                        {images.length &&
                            <div onClick={handleDeleteAll} className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full cursor-pointer hover:bg-red-200 transition-colors duration-300 text-gray-100 hover:text-red-500">
                                <MdDelete className=" text-[15px]" />
                            </div>
                        }
                    </h1>

                    <div className="mb-8">
                        <ImageUploader />
                    </div>
                    {/* ImageControls is always rendered, it will internally decide if it's showing
                    global controls or individual controls based on selectedImageIndex. */}
                    <ImageControls />
                    {!images.length && ( // Display message if no images are uploaded
                        <p className="text-gray-500 dark:text-gray-200 text-center mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner text-sm italic font-thin shadow-black">
                            Created by SeekerDev
                        </p>
                    )}
                </div>

                {/* Right Panel for Previews */}
                <div className="flex-1 p-6 overflow-auto bg-gray-100 dark:bg-gray-900 h-screen">
                    <PreviewArea />
                </div>
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
