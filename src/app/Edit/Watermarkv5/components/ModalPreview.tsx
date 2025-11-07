"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { SetStateAction, useLayoutEffect, useRef, useEffect, useState } from "react";
import { useImageEditor } from "./ImageEditorContext";
import { applyPhotoAdjustments } from "../lib/utils/canvasFilters";
import { X, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

interface ModalPreviewProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    open: boolean;
    onClose: React.Dispatch<SetStateAction<boolean>>;
    modalCanvasId: string;
    imageIndex: number; // NEW: Need to know which image we're editing
}

interface AdjustmentSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}

const QuickSlider: React.FC<AdjustmentSliderProps> = ({ label, value, min, max, onChange }) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const isModified = value !== 0;

    return (
        <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-20 text-right">
                {label}
            </label>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                style={{
                    background: `linear-gradient(to right, 
                        rgb(59, 130, 246) 0%, 
                        rgb(59, 130, 246) ${percentage}%, 
                        rgb(229, 231, 235) ${percentage}%, 
                        rgb(229, 231, 235) 100%)`
                }}
            />
            <span className={`text-xs font-semibold w-12 ${isModified ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                {value}
            </span>
        </div>
    );
};

const ModalPreview = ({
    canvasRef,
    open,
    onClose,
    modalCanvasId,
    imageIndex,
}: ModalPreviewProps): React.JSX.Element | null => {
    const modalCanvasRef = useRef<HTMLCanvasElement>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);
    const originalImageDataRef = useRef<ImageData | null>(null);

    const { images, updateIndividualPhotoAdjustments, globalPhotoAdjustments } = useImageEditor();
    const currentImage = images[imageIndex];

    const [showControls, setShowControls] = useState(false);
    const [activeTab, setActiveTab] = useState<'light' | 'color' | 'detail'>('light');

    // Get current adjustments for this specific image
    const currentAdjustments = currentImage?.photoAdjustments || globalPhotoAdjustments;

    // Copy canvas content and store original image data
    useLayoutEffect(() => {
        const originalCanvas = canvasRef.current;
        const modalCanvas = modalCanvasRef.current;

        if (originalCanvas && modalCanvas) {
            const ctx = modalCanvas.getContext("2d");
            if (ctx) {
                modalCanvas.width = originalCanvas.width;
                modalCanvas.height = originalCanvas.height;
                ctx.drawImage(originalCanvas, 0, 0);

                // Store original image data for reset
                originalImageDataRef.current = ctx.getImageData(0, 0, modalCanvas.width, modalCanvas.height);
            }
        }
    }, [open, canvasRef]);

    // Apply adjustments whenever they change
    useEffect(() => {
        if (!open) return;

        const modalCanvas = modalCanvasRef.current;
        if (!modalCanvas || !originalImageDataRef.current) return;

        const ctx = modalCanvas.getContext("2d");
        if (!ctx) return;

        // Restore original image data first
        ctx.putImageData(originalImageDataRef.current, 0, 0);

        // Apply current adjustments
        applyPhotoAdjustments(modalCanvas, currentAdjustments);
    }, [currentAdjustments, open]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                onClose(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const updateAdjustment = (key: keyof typeof globalPhotoAdjustments, value: number) => {
        updateIndividualPhotoAdjustments({ [key]: value });
    };

    const resetAdjustments = () => {
        // Reset all adjustments to 0
        const resetValues: any = {};
        Object.keys(currentAdjustments).forEach(key => {
            resetValues[key] = 0;
        });
        updateIndividualPhotoAdjustments(resetValues);
    };

    const hasModifications = Object.values(currentAdjustments).some(v => v !== 0);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div
                ref={modalContentRef}
                className="relative w-full h-full flex flex-col lg:flex-row p-4 gap-4"
            >
                {/* Main Canvas Area */}
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <canvas
                        ref={modalCanvasRef}
                        id={modalCanvasId}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                </div>

                {/* Controls Panel */}
                {showControls && (
                    <div className="w-full lg:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] lg:max-h-full">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    Quick Adjustments
                                </h3>
                                {hasModifications && (
                                    <button
                                        onClick={resetAdjustments}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Reset
                                    </button>
                                )}
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('light')}
                                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'light'
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                                        }`}
                                >
                                    ☀️ Light
                                </button>
                                <button
                                    onClick={() => setActiveTab('color')}
                                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'color'
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                                        }`}
                                >
                                    🎨 Color
                                </button>
                                <button
                                    onClick={() => setActiveTab('detail')}
                                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'detail'
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                                        }`}
                                >
                                    🔍 Detail
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Controls */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {activeTab === 'light' && (
                                <>
                                    <QuickSlider
                                        label="Exposure"
                                        value={currentAdjustments.exposure}
                                        min={-100}
                                        max={100}
                                        onChange={(v) => updateAdjustment('exposure', v)}
                                    />
                                    <QuickSlider
                                        label="Brilliance"
                                        value={currentAdjustments.brilliance}
                                        min={-100}
                                        max={100}
                                        onChange={(v) => updateAdjustment('brilliance', v)}
                                    />
                                    <QuickSlider
                                        label="Highlights"
                                        value={currentAdjustments.highlights}
                                        min={-100}
                                        max={100}
                                        onChange={(v) => updateAdjustment('highlights', v)}
                                    />
                                    <QuickSlider
                                        label="Shadows"
                                        value={currentAdjustments.shadows}
                                        min={-100}
                                        max={100}
                                        onChange={(v) => updateAdjustment('shadows', v)}
                                    />
                                    <QuickSlider
                                        label="Contrast"
                                        value={currentAdjustments.contrast}
                                        min={-100}
                                        max={100}
                                        onChange={(v) => updateAdjustment('contrast', v)}
                                    />
                                    <QuickSlider
                                        label="Brightness"
                                        value={currentAdjustments.brightness}
                                        min={-100}
                                        max={100}
                                        onChange={(v) => updateAdjustment('brightness', v)}
                                    />
                                    <QuickSlider
                                        label="Black Point"
                                        value={currentAdjustments.blackPoint}
                                        min={0}
                                        max={100}
                                        onChange={(v) => updateAdjustment('blackPoint', v)}
                                    />
                                </>
                            )}

                            {activeTab === 'color' && (
                                <>
                                    <QuickSlider
                                        label="Saturation"
                                        value={currentAdjustments.saturation}
                                        min={-100}
                                        max={100}
                                        onChange={(v) => updateAdjustment('saturation', v)}
                                    />
                                    <QuickSlider
                                        label="Vibrance"
                                        value={currentAdjustments.vibrance}
                                        min={-100}
                                        max={100}
                                        onChange={(v) => updateAdjustment('vibrance', v)}
                                    />
                                    <QuickSlider
                                        label="Warmth"
                                        value={currentAdjustments.warmth}
                                        min={-100}
                                        max={100}
                                        onChange={(v) => updateAdjustment('warmth', v)}
                                    />
                                    <QuickSlider
                                        label="Tint"
                                        value={currentAdjustments.tint}
                                        min={-100}
                                        max={100}
                                        onChange={(v) => updateAdjustment('tint', v)}
                                    />
                                </>
                            )}

                            {activeTab === 'detail' && (
                                <>
                                    <QuickSlider
                                        label="Sharpness"
                                        value={currentAdjustments.sharpness}
                                        min={0}
                                        max={100}
                                        onChange={(v) => updateAdjustment('sharpness', v)}
                                    />
                                    <QuickSlider
                                        label="Definition"
                                        value={currentAdjustments.definition}
                                        min={0}
                                        max={100}
                                        onChange={(v) => updateAdjustment('definition', v)}
                                    />
                                    <QuickSlider
                                        label="Noise Reduction"
                                        value={currentAdjustments.noiseReduction}
                                        min={0}
                                        max={100}
                                        onChange={(v) => updateAdjustment('noiseReduction', v)}
                                    />
                                    <QuickSlider
                                        label="Vignette"
                                        value={currentAdjustments.vignette}
                                        min={0}
                                        max={100}
                                        onChange={(v) => updateAdjustment('vignette', v)}
                                    />
                                </>
                            )}
                        </div>

                        {/* Info Footer */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                                💡 Changes apply only to this image and are saved automatically.
                            </p>
                        </div>
                    </div>
                )}

                {/* Top Action Bar */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <button
                        onClick={() => setShowControls(!showControls)}
                        className="pointer-events-auto px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg shadow-lg transition-colors flex items-center gap-2"
                    >
                        {showControls ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        {showControls ? 'Hide Controls' : 'Show Controls'}
                    </button>

                    <button
                        onClick={() => onClose(false)}
                        className="pointer-events-auto p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalPreview;