// app/components/ImageControls.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
// Corrected import path for ImageEditorContext
import { useImageEditor } from "./ImageEditorContext";


// Component to provide controls for adjusting logo and footer settings.
// It can apply settings globally or to a selected individual image.
export default function ImageControls() {
    // Destructure all necessary states and functions from context.
    const {
        images,
        setImages,
        selectedImageIndex,
        globalLogoSettings,
        setGlobalLogoSettings,
        globalFooterSettings,
        setGlobalFooterSettings,
    } = useImageEditor();

    // Determine if an image is selected and get its data.
    const isImageSelected = selectedImageIndex !== null;
    const selectedImage = isImageSelected ? images[selectedImageIndex!] : null;

    // Determine which settings to use for rendering controls: global or individual.
    const currentLogoSettings = selectedImage?.useGlobalSettings === false
        ? selectedImage.individualLogoSettings
        : globalLogoSettings;

    const currentFooterSettings = selectedImage?.useGlobalSettings === false
        ? selectedImage.individualFooterSettings
        : globalFooterSettings;

    // Function to update either global or individual logo settings
    const updateLogoSettings = (changes: any) => {
        if (isImageSelected && selectedImage?.useGlobalSettings === false) {
            // Update individual settings for the selected image
            const updatedImages = [...images];
            updatedImages[selectedImageIndex!] = {
                ...updatedImages[selectedImageIndex!],
                individualLogoSettings: {
                    ...currentLogoSettings,
                    ...changes,
                },
            };
            setImages(updatedImages);
        } else {
            // Update global settings
            setGlobalLogoSettings(prev => ({ ...prev, ...changes }));
        }
    };

    // Function to update either global or individual footer settings
    const updateFooterSettings = (changes: any) => {
        if (isImageSelected && selectedImage?.useGlobalSettings === false) {
            // Update individual settings for the selected image
            const updatedImages = [...images];
            updatedImages[selectedImageIndex!] = {
                ...updatedImages[selectedImageIndex!],
                individualFooterSettings: {
                    ...currentFooterSettings,
                    ...changes,
                },
            };
            setImages(updatedImages);
        } else {
            // Update global settings
            setGlobalFooterSettings(prev => ({ ...prev, ...changes }));
        }
    };

    // Function to toggle between global and individual settings for a selected image
    const toggleIndividualEdit = () => {
        if (selectedImage) {
            const updatedImages = [...images];
            const currentImage = updatedImages[selectedImageIndex!];

            if (currentImage.useGlobalSettings) {
                // Switching from global to individual: copy current global settings
                updatedImages[selectedImageIndex!] = {
                    ...currentImage,
                    useGlobalSettings: false,
                    individualLogoSettings: { ...globalLogoSettings },
                    individualFooterSettings: { ...globalFooterSettings },
                };
            } else {
                // Switching from individual to global: clear individual settings (optional)
                updatedImages[selectedImageIndex!] = {
                    ...currentImage,
                    useGlobalSettings: true,
                    individualLogoSettings: undefined, // Clear individual settings
                    individualFooterSettings: undefined, // Clear individual settings
                };
            }
            setImages(updatedImages);
        }
    };

    return (
        <div className="space-y-4 mt-6 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-lg">
            {isImageSelected ? (
                // Controls for a selected image (individual or global applies)
                <>
                    <h3 className="text-lg font-bold text-gray-700 dark:text-white border-b pb-2 mb-4">
                        Editing: Image {selectedImageIndex! + 1}
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-gray-700  dark:text-white">Apply Global Settings:</span>
                        <input
                            type="checkbox"
                            checked={selectedImage?.useGlobalSettings || false} // Make sure it's a boolean
                            onChange={toggleIndividualEdit}
                            className="toggle toggle-primary" // Tailwind-style toggle, assuming a component library or custom CSS
                        />
                    </div>
                </>
            ) : (
                // Controls for global settings (when no image is selected or general controls)
                <h3 className="text-lg font-bold text-gray-700  dark:text-white border-b pb-2 mb-4">Global Watermark Settings</h3>
            )}

            <p className="text-sm text-gray-500  dark:text-gray-300 mb-4">
                {isImageSelected && !selectedImage?.useGlobalSettings
                    ? "Adjust settings for this specific image."
                    : "Adjust settings for all images (or images using global settings)."}
            </p>

            {/* Logo Controls Section */}
            <div className="space-y-3 p-3 border border-gray-200 rounded-md">
                <h4 className="font-semibold text-gray-700  dark:text-white">Logo Settings</h4>
                <div>
                    <label className="font-medium text-gray-600 block mb-1  dark:text-white">Logo Position</label>
                    <select
                        value={currentLogoSettings?.position || "top-left"}
                        onChange={(e) => updateLogoSettings({ position: e.target.value })}
                        className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="top-left">Top Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                    </select>
                </div>

                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="font-medium text-gray-600  dark:text-white block mb-1">Logo Width</label>
                        <input
                            type="number"
                            value={currentLogoSettings?.width || 0}
                            onChange={(e) => updateLogoSettings({ width: Number(e.target.value) })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="font-medium text-gray-600  dark:text-white block mb-1">Logo Height</label>
                        <input
                            type="number"
                            value={currentLogoSettings?.height || 0}
                            onChange={(e) => updateLogoSettings({ height: Number(e.target.value) })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="font-medium text-gray-600  dark:text-white block mb-1">Logo Padding X</label>
                    <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={currentLogoSettings?.paddingX || 0}
                        onChange={(e) => updateLogoSettings({ paddingX: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                    />
                </div>

                <div>
                    <label className="font-medium text-gray-600  dark:text-white block mb-1">Logo Padding Y</label>
                    <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={currentLogoSettings?.paddingY || 0}
                        onChange={(e) => updateLogoSettings({ paddingY: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                    />
                </div>
            </div>

            {/* Footer Controls Section */}
            <div className="space-y-3 p-3 border border-gray-200 rounded-md">
                <h4 className="font-semibold text-gray-700  dark:text-white">Footer Settings</h4>
                <div>
                    <label className="font-medium text-gray-600  dark:text-white block mb-1">Footer Scale</label>
                    <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={currentFooterSettings?.scale || 0}
                        onChange={(e) => updateFooterSettings({ scale: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                    />
                </div>

                <div>
                    <label className="font-medium text-gray-600  dark:text-white block mb-1">Footer Opacity</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={currentFooterSettings?.opacity || 0}
                        onChange={(e) => updateFooterSettings({ opacity: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                    />
                </div>

                <div>
                    <label className="font-medium text-gray-600  dark:text-white block mb-1">Footer Offset X</label>
                    <input
                        type="range"
                        min="-5000"
                        max="10000"
                        value={currentFooterSettings?.offsetX || 0}
                        onChange={(e) => updateFooterSettings({ offsetX: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                    />
                </div>
            </div>
        </div>
    );
}

