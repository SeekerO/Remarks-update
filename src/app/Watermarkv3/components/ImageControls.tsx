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
        <div className="space-y-6 mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {isImageSelected ? (
                        <span>Editing: Image <span className="text-blue-600 dark:text-blue-400">{selectedImageIndex! + 1}</span></span>
                    ) : (
                        <span>Global Watermark Settings</span>
                    )}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {isImageSelected && !selectedImage?.useGlobalSettings
                        ? "Adjust settings specifically for this image. Toggle below to apply global settings instead."
                        : "Configure default settings that apply to all images, or to individual images using global settings."}
                </p>
            </div>

            {isImageSelected && (
                <div className="flex items-center justify-between py-2 mb-4">
                    <span className="text-base font-medium text-gray-700 dark:text-gray-200">Apply Global Settings</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedImage?.useGlobalSettings || false}
                            onChange={toggleIndividualEdit}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            )}

            <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Logo Settings</h4>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo Position</label>
                    <select
                        value={currentLogoSettings?.position || "top-left"}
                        onChange={(e) => updateLogoSettings({ position: e.target.value })}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition duration-150 ease-in-out sm:text-sm"
                    >
                        <option value="top-left">Top Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                    </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo Width</label>
                        <input
                            type="number"
                            value={currentLogoSettings?.width || 0}
                            onChange={(e) => updateLogoSettings({ width: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition duration-150 ease-in-out sm:text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo Height</label>
                        <input
                            type="number"
                            value={currentLogoSettings?.height || 0}
                            onChange={(e) => updateLogoSettings({ height: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition duration-150 ease-in-out sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Logo Padding X: <span className="font-normal text-gray-500 dark:text-gray-400">{currentLogoSettings?.paddingX || 0}</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={currentLogoSettings?.paddingX || 0}
                        onChange={(e) => updateLogoSettings({ paddingX: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Logo Padding Y: <span className="font-normal text-gray-500 dark:text-gray-400">{currentLogoSettings?.paddingY || 0}</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={currentLogoSettings?.paddingY || 0}
                        onChange={(e) => updateLogoSettings({ paddingY: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                    />
                </div>
            </div>

            <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Footer Settings</h4>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Footer Scale: <span className="font-normal text-gray-500 dark:text-gray-400">{currentFooterSettings?.scale || 0}</span>
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={currentFooterSettings?.scale || 0}
                        onChange={(e) => updateFooterSettings({ scale: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Footer Opacity: <span className="font-normal text-gray-500 dark:text-gray-400">{currentFooterSettings?.opacity || 0}</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={currentFooterSettings?.opacity || 0}
                        onChange={(e) => updateFooterSettings({ opacity: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Footer Offset X: <span className="font-normal text-gray-500 dark:text-gray-400">{currentFooterSettings?.offsetX || 0}</span>
                    </label>
                    <input
                        type="range"
                        min="-5000"
                        max="10000"
                        value={currentFooterSettings?.offsetX || 0}
                        onChange={(e) => updateFooterSettings({ offsetX: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                    />
                </div>
            </div>
        </div>
    );
}

