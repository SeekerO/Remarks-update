// page.tsx
"use client";


import React from "react";
import Link from 'next/link';
import ImageUploader from "./components/ImageUploader";
import ImageControls from "./components/ImageControls";
import PreviewArea from "./components/PreviewArea";
import BreadCrumb from "../component/breadcrumb";
// Corrected import path for context assuming it's in app/context/
import { ImageEditorProvider, useImageEditor } from "./components/ImageEditorContext";
import { MdDelete } from "react-icons/md";
import { useAuth } from "../Chat/AuthContext";

// Main page component for the watermark application.
function WatermarkPageContent() {
    // Access the images from the context to conditionally display messages.
    const { images, removeAllImages } = useImageEditor();
    const { user } = useAuth();


    if (!user || (user as any).canChat === false) {

        window.location.href = "/";

        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Link href={"/"} className="text-gray-600 dark:text-gray-400 text-center px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md text-base font-medium transition-colors duration-300">
                    Please log in to access the Watermark Editor.
                </Link>
            </div>
        );
    }




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
export default function WatermarkPage() {
    return (
        <ImageEditorProvider>
            <WatermarkPageContent />
        </ImageEditorProvider>
    );
}
