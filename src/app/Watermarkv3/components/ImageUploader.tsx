// app/components/ImageUploader.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */


import React, { useRef, useState } from "react";
// Corrected import path for ImageEditorContext
import { useImageEditor } from "./ImageEditorContext";

// Icon from react-icons or any other icon library can be used here
import { FaImage } from "react-icons/fa6";

import Logo from "@/lib/image/COMELEC.png"
import Footer from "@/lib/image/FOOTER.png"
import { StaticImageData } from "next/image";

// Component for uploading source images, logos, and footers.
export default function ImageUploader() {
    // Refs for file input elements.
    const imageInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const footerInputRef = useRef<HTMLInputElement>(null);

    // State for drag-and-drop visual feedback
    const [isImageDragOver, setIsImageDragOver] = useState(false);
    const [isLogoDragOver, setIsLogoDragOver] = useState(false);
    const [isFooterDragOver, setIsFooterDragOver] = useState(false);


    // Destructure context functions and states.
    const {
        setImages,
        setLogo,
        setFooter,
        images,
        setSelectedImageIndex,
    } = useImageEditor();

    // Helper function to prevent default drag behavior
    const preventDefaults = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Generic handler for drag over
    const handleDragOver = (e: React.DragEvent, setDragOver: React.Dispatch<React.SetStateAction<boolean>>) => {
        preventDefaults(e);
        setDragOver(true);
    };

    // Generic handler for drag leave
    const handleDragLeave = (e: React.DragEvent, setDragOver: React.Dispatch<React.SetStateAction<boolean>>) => {
        preventDefaults(e);
        setDragOver(false);
    };

    // Generic handler for drop. It passes the FileList to the specific upload handler.
    const handleDrop = (e: React.DragEvent, uploadHandler: (eventOrFileList: React.ChangeEvent<HTMLInputElement> | React.DragEvent | FileList) => void, setDragOver: React.Dispatch<React.SetStateAction<boolean>>) => {
        preventDefaults(e);
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            uploadHandler(files); // Pass the FileList directly to the specific handler
            console.log("Files dropped:", files); // For debugging
        }
    };

    // Handler for uploading a logo image.
    // Updated to correctly handle a single File from a drop event or input change.
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent | FileList) => {
        let file: File | undefined;

        if (e instanceof FileList) {
            // Case 1: 'e' is directly a FileList (from handleDrop)
            file = e[0];
        } else if ('target' in e && e.target instanceof HTMLInputElement && e.target.files?.[0]) {
            // Case 2: 'e' is a React.ChangeEvent and has a target with files
            // Check for 'target' property existence and its type
            file = e.target.files[0];
        } else if ('dataTransfer' in e && e.dataTransfer.files?.[0]) {
            // Case 3: 'e' is a React.DragEvent and has dataTransfer with files
            // Check for 'dataTransfer' property existence
            file = e.dataTransfer.files[0];
        }

        if (file) {
            setLogo(URL.createObjectURL(file)); // Set the logo URL in context.
        }
    };

    // Handler for uploading a footer image. (Identical structure)
    const handleFooterUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent | FileList) => {
        let file: File | undefined;

        if (e instanceof FileList) {
            file = e[0];
        } else if ('target' in e && e.target instanceof HTMLInputElement && e.target.files?.[0]) {
            file = e.target.files[0];
        } else if ('dataTransfer' in e && e.dataTransfer.files?.[0]) {
            file = e.dataTransfer.files[0];
        }

        if (file) {
            setFooter(URL.createObjectURL(file)); // Set the footer URL in context.
        }
    };

    // And similarly for handleImageUpload if you want to apply the same pattern:
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent | FileList) => {
        let files: FileList | null = null;

        if (e instanceof FileList) {
            files = e;
        } else if ('target' in e && e.target instanceof HTMLInputElement && e.target.files) {
            files = e.target.files;
        } else if ('dataTransfer' in e && e.dataTransfer.files) {
            files = e.dataTransfer.files;
        }

        if (!files) return;

        const fileArray = Array.from(files).map(file => ({
            file,
            url: URL.createObjectURL(file),
            useGlobalSettings: true,
        }));

        setImages((prev: any) => {
            const newImages = [...prev, ...fileArray];
            if (fileArray.length > 0) {
                if (images.length === 0) {
                    setSelectedImageIndex(0);
                }
            }
            return newImages;
        });
    };

    const handleDefault = async () => { // Make the function async
        try {
            const imageLOGO = (Logo as StaticImageData).src; // Cast to StaticImageData if TypeScript complains
            const imageFOOTER = (Footer as StaticImageData).src

            const responseLOGO = await fetch(imageLOGO);
            const responseFOOTER = await fetch(imageFOOTER)

            if (!responseLOGO.ok || !responseFOOTER.ok) {
                throw new Error(`HTTP error! status: ${responseLOGO.status}`);
            }

            const imageBlobLOGO = await responseLOGO.blob();
            const imageBlobFOOTER = await responseFOOTER.blob()
            setLogo(URL.createObjectURL(imageBlobLOGO));
            setFooter(URL.createObjectURL(imageBlobFOOTER))

        } catch (error) {
            console.error("Error setting default logo:", error);
        }
    };

    return (
        <div className="space-y-6 px-">
            <div
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 ease-in-out
    ${isImageDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'}
    shadow-sm hover:shadow-md`}
                onDragOver={(e) => handleDragOver(e, setIsImageDragOver)}
                onDragLeave={(e) => handleDragLeave(e, setIsImageDragOver)}
                onDrop={(e) => handleDrop(e, handleImageUpload, setIsImageDragOver)}
            >
                <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="image-upload-input"
                />

                <label
                    htmlFor="image-upload-input"
                    className="cursor-pointer flex flex-col items-center gap-3 text-center"
                >
                    <FaImage className="text-4xl text-blue-500 dark:text-blue-400" />
                    <span className="font-semibold text-lg text-gray-700 dark:text-gray-100">Upload Your Images</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Drag & drop or click to browse</p>
                    <span
                        className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        Browse Files
                    </span>
                </label>
            </div>

            <div
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 ease-in-out
    ${isLogoDragOver ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'}
    shadow-sm hover:shadow-md`}
                onDragOver={(e) => handleDragOver(e, setIsLogoDragOver)}
                onDragLeave={(e) => handleDragLeave(e, setIsLogoDragOver)}
                onDrop={(e) => handleDrop(e, handleLogoUpload, setIsLogoDragOver)}
            >
                <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                    id="logo-upload-input" />

                <label
                    htmlFor="logo-upload-input"
                    className="cursor-pointer flex flex-col items-center gap-3 text-center"
                >
                    <FaImage className="text-4xl text-purple-500 dark:text-purple-400" />
                    <span className="font-semibold text-lg text-gray-700 dark:text-gray-100">Upload Your Logo</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">(Optional) Drag & drop or click to browse</p>
                    <span
                        className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                    >
                        Select Logo
                    </span>
                </label>
            </div>

            <div
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 ease-in-out
    ${isFooterDragOver ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'}
    shadow-sm hover:shadow-md`}
                onDragOver={(e) => handleDragOver(e, setIsFooterDragOver)}
                onDragLeave={(e) => handleDragLeave(e, setIsFooterDragOver)}
                onDrop={(e) => handleDrop(e, handleFooterUpload, setIsFooterDragOver)}
            >
                <input
                    type="file"
                    ref={footerInputRef}
                    onChange={handleFooterUpload}
                    accept="image/*"
                    className="hidden"
                    id="footer-upload-input"
                />

                <label
                    htmlFor="footer-upload-input"
                    className="cursor-pointer flex flex-col items-center gap-3 text-center"
                >
                    <FaImage className="text-4xl text-green-500 dark:text-green-400" />
                    <span className="font-semibold text-lg text-gray-700 dark:text-gray-100">Upload Your Footer Image</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">(Optional) Drag & drop or click to browse</p>
                    <span
                        className="mt-3 inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                        Select Footer
                    </span>
                </label>
            </div>
            <div className="flex justify-center ">
                <button
                    onClick={handleDefault}
                    className="relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full shadow-lg
           hover:from-yellow-600 hover:to-orange-600 hover:shadow-xl
           focus:outline-none focus:ring-4 focus:ring-yellow-300 dark:focus:ring-yellow-800
           transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
                >
                    <span className="relative z-10">COMELEC Footer & Logo</span>
                </button>
            </div>
        </div>
    );
}