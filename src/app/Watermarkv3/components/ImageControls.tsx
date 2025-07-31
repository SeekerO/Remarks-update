// app/components/ImageControls.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
// Corrected import path for ImageEditorContext
import { useImageEditor } from "./ImageEditorContext";

interface WatermarkSettings {
    position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
    width: number;
    height: number;
    paddingX: number;
    paddingY: number;
}

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
        globalShadowSettings,
        setGlobalShadowSettings,
        globalShadowTarget,
        setGlobalShadowTarget,
        toggleUseGlobalSettings, // NEW
        updateIndividualLogoSettings, // NEW
        updateIndividualFooterSettings, // NEW
        updateIndividualShadowSettings, // NEW
    } = useImageEditor();

    // Determine if an image is selected and get its data.
    const isImageSelected = selectedImageIndex !== null;
    const selectedImage = isImageSelected ? images[selectedImageIndex!] : null;

    // Determine which settings to use for rendering controls: global or individual.
    const useGlobal = selectedImage?.useGlobalSettings ?? true; // Default to global if no image selected

    const currentLogoSettings = useGlobal
        ? globalLogoSettings
        : selectedImage?.individualLogoSettings;

    const currentFooterSettings = useGlobal
        ? globalFooterSettings
        : selectedImage?.individualFooterSettings;

    const currentShadowSettings = useGlobal
        ? globalShadowSettings
        : selectedImage?.individualShadowSettings;

    const currentShadowTarget = useGlobal
        ? globalShadowTarget
        : selectedImage?.individualShadowSettings ? "whole-image" : "none"; // Assuming individual shadow only applies to whole image for simplicity, or add a specific target for individual settings if needed.

    // Functions to update settings (either global or individual)
    const updateLogoSettings = (settings: Partial<typeof globalLogoSettings>) => {
        if (useGlobal) {
            setGlobalLogoSettings(prev => ({ ...prev, ...settings }));
        } else {
            updateIndividualLogoSettings(settings);
        }
    };

    const updateFooterSettings = (settings: Partial<typeof globalFooterSettings>) => {
        if (useGlobal) {
            setGlobalFooterSettings(prev => ({ ...prev, ...settings }));
        } else {
            updateIndividualFooterSettings(settings);
        }
    };

    const updateShadowSettings = (settings: Partial<typeof globalShadowSettings>) => {
        if (useGlobal) {
            setGlobalShadowSettings(prev => ({ ...prev, ...settings }));
        } else {
            updateIndividualShadowSettings(settings);
        }
    };

    const updateShadowTarget = (target: typeof globalShadowTarget) => {
        if (useGlobal) {
            setGlobalShadowTarget(target);
        }
        // For individual settings, the target is implicitly handled by `updateIndividualShadowSettings`
        // or can be added as a property to individualShadowSettings if more granular control is needed.
    };


    return (
        <div className="space-y-6">
            {isImageSelected && (
                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-inner">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Apply Settings:</span>
                    <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center cursor-pointer">
                            <input
                                type="radio"
                                className="form-radio h-4 w-4 text-blue-600"
                                name="settingsScope"
                                value="global"
                                checked={useGlobal}
                                onChange={toggleUseGlobalSettings}
                            />
                            <span className="ml-2 text-gray-800 dark:text-gray-100 text-sm">Global</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                            <input
                                type="radio"
                                className="form-radio h-4 w-4 text-purple-600"
                                name="settingsScope"
                                value="individual"
                                checked={!useGlobal}
                                onChange={toggleUseGlobalSettings}
                                disabled={!isImageSelected} // Disable if no image is selected
                            />
                            <span className="ml-2 text-gray-800 dark:text-gray-100 text-sm">Individual</span>
                        </label>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b pb-2 mb-3 border-gray-200 dark:border-gray-700">Logo Controls</h2>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Position:
                        <select
                            value={currentLogoSettings?.position || "bottom-right"}
                            onChange={(e) => updateLogoSettings({ position: e.target.value as WatermarkSettings["position"] })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white transition duration-150 ease-in-out"
                        >
                            <option value="top-left">Top-Left</option>
                            <option value="top-center">Top-Center</option>
                            <option value="top-right">Top-Right</option>
                            <option value="bottom-left">Bottom-Left</option>
                            <option value="bottom-center">Bottom-Center</option>
                            <option value="bottom-right">Bottom-Right</option>
                        </select>
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Width: {currentLogoSettings?.width || 0}px
                        <input
                            type="range"
                            min="10"
                            max="500"
                            value={currentLogoSettings?.width || 0}
                            onChange={(e) => updateLogoSettings({ width: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                        />
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Height: {currentLogoSettings?.height || 0}px
                        <input
                            type="range"
                            min="10"
                            max="500"
                            value={currentLogoSettings?.height || 0}
                            onChange={(e) => updateLogoSettings({ height: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                        />
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Padding X: {currentLogoSettings?.paddingX || 0}px
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentLogoSettings?.paddingX || 0}
                            onChange={(e) => updateLogoSettings({ paddingX: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                        />
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Padding Y: {currentLogoSettings?.paddingY || 0}px
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentLogoSettings?.paddingY || 0}
                            onChange={(e) => updateLogoSettings({ paddingY: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                        />
                    </label>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b pb-2 mb-3 border-gray-200 dark:border-gray-700">Footer Controls</h2>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Opacity: {(currentFooterSettings?.opacity || 0) * 100}%
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={currentFooterSettings?.opacity || 0}
                            onChange={(e) => updateFooterSettings({ opacity: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                        />
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Scale: {currentFooterSettings?.scale || 0}x
                        <input
                            type="range"
                            min="0.1"
                            max="2"
                            step="0.01"
                            value={currentFooterSettings?.scale || 0}
                            onChange={(e) => updateFooterSettings({ scale: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                        />
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Offset X: {currentFooterSettings?.offsetX || 0}px
                        <input
                            type="range"
                            min="-200"
                            max="200"
                            value={currentFooterSettings?.offsetX || 0}
                            onChange={(e) => updateFooterSettings({ offsetX: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                        />
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Offset Y: {currentFooterSettings?.offsetY || 0}px
                        <input
                            type="range"
                            min="-200"
                            max="200"
                            value={currentFooterSettings?.offsetY || 0}
                            onChange={(e) => updateFooterSettings({ offsetY: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                        />
                    </label>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b pb-2 mb-3 border-gray-200 dark:border-gray-700">Shadow Controls</h2>

                {useGlobal && ( // Shadow target only available for global settings for now
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Apply Shadow To:
                            <select
                                value={currentShadowTarget || "none"}
                                onChange={(e) => updateShadowTarget(e.target.value as typeof globalShadowTarget)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white transition duration-150 ease-in-out"
                            >
                                <option value="none">None</option>
                                <option value="footer">Footer</option>
                                <option value="whole-image">Whole Image</option>
                            </select>
                        </label>
                    </div>
                )}

                {(currentShadowTarget !== "none" || !useGlobal) && ( // Show shadow controls if target is not none or if individual settings are active
                    <>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Shadow Color:
                                <input
                                    type="color"
                                    value={currentShadowSettings?.color || "#000000"}
                                    onChange={(e) => updateShadowSettings({ color: e.target.value })}
                                    className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 cursor-pointer"
                                />
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Shadow Opacity: {(currentShadowSettings?.opacity || 0) * 100}%
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={currentShadowSettings?.opacity || 0}
                                    onChange={(e) => updateShadowSettings({ opacity: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                                />
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Shadow Offset X: {currentShadowSettings?.offsetX || 0}px
                                <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    value={currentShadowSettings?.offsetX || 0}
                                    onChange={(e) => updateShadowSettings({ offsetX: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                                />
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Shadow Offset Y: {currentShadowSettings?.offsetY || 0}px
                                <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    value={currentShadowSettings?.offsetY || 0}
                                    onChange={(e) => updateShadowSettings({ offsetY: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                                />
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Shadow Blur: {currentShadowSettings?.blur || 0}px
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    step="1"
                                    value={currentShadowSettings?.blur || 0}
                                    onChange={(e) => updateShadowSettings({ blur: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue dark:bg-gray-700 transition duration-150 ease-in-out"
                                />
                            </label>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}