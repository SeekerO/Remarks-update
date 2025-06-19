// app/components/ImageUploader.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint / no - unused - vars */

import React, { useRef } from "react";
// Corrected import path for ImageEditorContext
import { useImageEditor } from "./ImageEditorContext";

// Component for uploading source images, logos, and footers.
export default function ImageUploader() {
    // Refs for file input elements.
    const imageInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const footerInputRef = useRef<HTMLInputElement>(null);

    // Destructure context functions and states.
    const {
        setImages,
        setLogo,
        setFooter,
        images,
        setSelectedImageIndex,
        globalLogoSettings, // Get global settings for new image defaults
        globalFooterSettings, // Get global settings for new image defaults
    } = useImageEditor();

    // Handler for uploading multiple main images.
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Map uploaded files to ImageData objects with default settings.
        const fileArray = Array.from(files).map(file => ({
            file,
            url: URL.createObjectURL(file),
            useGlobalSettings: true, // Default to using global settings
            // individualLogoSettings and individualFooterSettings are optional
            // and will only be set if useGlobalSettings is toggled off later.
        }));

        // Add new images to the existing list.
        setImages((prev: any) => {
            const newImages = [...prev, ...fileArray];
            // Select the first newly uploaded image if there are any
            if (fileArray.length > 0) {
                // If no image was selected before, select the first new one.
                // Otherwise, keep the current selection or handle as needed.
                if (images.length === 0) {
                    setSelectedImageIndex(0); // Select the very first image uploaded
                }
            }
            return newImages;
        });
    };

    // Handler for uploading a logo image.
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogo(URL.createObjectURL(file)); // Set the logo URL in context.
        }
    };

    // Handler for uploading a footer image.
    const handleFooterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFooter(URL.createObjectURL(file)); // Set the footer URL in context.
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="font-semibold text-gray-700 block mb-2">Upload Main Images</label>
                <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    multiple // Allow multiple file selection
                    accept="image/*" // Accept only image files
                    className="block w-full text-sm text-gray-500
                               file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0
                               file:text-sm file:font-semibold
                               file:bg-blue-50 file:text-blue-700
                               hover:file:bg-blue-100" // Styled file input
                />
            </div>

            <div>
                <label className="font-semibold text-gray-700 block mb-2">Upload Logo (Optional)</label>
                <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="block w-full text-sm text-gray-500
                               file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0
                               file:text-sm file:font-semibold
                               file:bg-purple-50 file:text-purple-700
                               hover:file:bg-purple-100"
                />
            </div>

            <div>
                <label className="font-semibold text-gray-700 block mb-2">Upload Footer (Optional)</label>
                <input
                    type="file"
                    ref={footerInputRef}
                    onChange={handleFooterUpload}
                    accept="image/*"
                    className="block w-full text-sm text-gray-500
                               file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0
                               file:text-sm file:font-semibold
                               file:bg-green-50 file:text-green-700
                               hover:file:bg-green-100"
                />
            </div>
        </div>
    );
}

