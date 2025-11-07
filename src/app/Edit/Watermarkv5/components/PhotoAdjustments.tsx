// app/components/PhotoAdjustments.tsx
"use client";

import React, { useState } from "react";
import { useImageEditor } from "./ImageEditorContext";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface AdjustmentSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    unit?: string;
    description?: string;
}

const AdjustmentSlider: React.FC<AdjustmentSliderProps> = ({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
    unit = "",
    description
}) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const isModified = value !== 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                    {description && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ({description})
                        </span>
                    )}
                </label>
                <span className={`text-sm font-semibold ${isModified ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {value}{unit}
                </span>
            </div>
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    style={{
                        background: `linear-gradient(to right, 
                            rgb(59, 130, 246) 0%, 
                            rgb(59, 130, 246) ${percentage}%, 
                            rgb(229, 231, 235) ${percentage}%, 
                            rgb(229, 231, 235) 100%)`
                    }}
                />
            </div>
        </div>
    );
};

export default function PhotoAdjustments() {
    const {
        images,
        selectedImageIndex,
        globalPhotoAdjustments,
        setGlobalPhotoAdjustments,
        updateIndividualPhotoAdjustments,
        resetPhotoAdjustments,
    } = useImageEditor();

    const [expandedSections, setExpandedSections] = useState({
        light: false,
        color: false,
        detail: false,
        effects: false
    });

    const isImageSelected = selectedImageIndex !== null && selectedImageIndex < images.length;
    const selectedImage = isImageSelected && selectedImageIndex !== null ? images[selectedImageIndex] : null;
    const useGlobal = selectedImage?.useGlobalSettings ?? true;

    const currentAdjustments = useGlobal
        ? globalPhotoAdjustments
        : (selectedImage?.photoAdjustments || globalPhotoAdjustments);

    const updateAdjustment = (key: keyof typeof globalPhotoAdjustments, value: number) => {
        if (useGlobal) {
            setGlobalPhotoAdjustments(prev => ({ ...prev, [key]: value }));
        } else {
            updateIndividualPhotoAdjustments({ [key]: value });
        }
    };
    const reset = () => {
        if (selectedImageIndex !== null) {
            // Reset individual image adjustments
            resetPhotoAdjustments();
        } else {
            // Reset global adjustments
            resetPhotoAdjustments();
        }
    }

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const hasModifications = Object.values(currentAdjustments).some(v => v !== 0);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-4 p-4">
            <div className="flex flex-col items-start justify-between border-b pb-3 border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    📸 Photo Adjustments
                    {hasModifications && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Modified
                        </span>
                    )}
                </h2>
                <button
                    onClick={reset}
                    disabled={!hasModifications}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                    title="Reset all adjustments"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset All
                </button>
            </div>

            {/* LIGHT SECTION */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                    onClick={() => toggleSection('light')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                    <span className="font-semibold text-gray-800 dark:text-gray-100">☀️ Light</span>
                    {expandedSections.light ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.light && (
                    <div className="p-4 space-y-4">
                        <AdjustmentSlider
                            label="Exposure"
                            value={currentAdjustments.exposure}
                            min={-100}
                            max={100}
                            onChange={(v) => updateAdjustment('exposure', v)}
                            description="Overall brightness"
                        />
                        <AdjustmentSlider
                            label="Brilliance"
                            value={currentAdjustments.brilliance}
                            min={-100}
                            max={100}
                            onChange={(v) => updateAdjustment('brilliance', v)}
                            description="Enhances mid-tones"
                        />
                        <AdjustmentSlider
                            label="Highlights"
                            value={currentAdjustments.highlights}
                            min={-100}
                            max={100}
                            onChange={(v) => updateAdjustment('highlights', v)}
                            description="Bright areas only"
                        />
                        <AdjustmentSlider
                            label="Shadows"
                            value={currentAdjustments.shadows}
                            min={-100}
                            max={100}
                            onChange={(v) => updateAdjustment('shadows', v)}
                            description="Dark areas only"
                        />
                        <AdjustmentSlider
                            label="Contrast"
                            value={currentAdjustments.contrast}
                            min={-100}
                            max={100}
                            onChange={(v) => updateAdjustment('contrast', v)}
                            description="Light/dark difference"
                        />
                        <AdjustmentSlider
                            label="Brightness"
                            value={currentAdjustments.brightness}
                            min={-100}
                            max={100}
                            onChange={(v) => updateAdjustment('brightness', v)}
                            description="Simple brightness"
                        />
                        <AdjustmentSlider
                            label="Black Point"
                            value={currentAdjustments.blackPoint}
                            min={0}
                            max={100}
                            onChange={(v) => updateAdjustment('blackPoint', v)}
                            description="Deepens blacks"
                        />
                    </div>
                )}
            </div>

            {/* COLOR SECTION */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                    onClick={() => toggleSection('color')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                    <span className="font-semibold text-gray-800 dark:text-gray-100">🎨 Color</span>
                    {expandedSections.color ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.color && (
                    <div className="p-4 space-y-4">
                        <AdjustmentSlider
                            label="Saturation"
                            value={currentAdjustments.saturation}
                            min={-100}
                            max={100}
                            onChange={(v) => updateAdjustment('saturation', v)}
                            description="Color intensity"
                        />
                        <AdjustmentSlider
                            label="Vibrance"
                            value={currentAdjustments.vibrance}
                            min={-100}
                            max={100}
                            onChange={(v) => updateAdjustment('vibrance', v)}
                            description="Smart saturation"
                        />
                        <AdjustmentSlider
                            label="Warmth"
                            value={currentAdjustments.warmth}
                            min={-100}
                            max={100}
                            onChange={(v) => updateAdjustment('warmth', v)}
                            description="Temperature"
                        />
                        <AdjustmentSlider
                            label="Tint"
                            value={currentAdjustments.tint}
                            min={-100}
                            max={100}
                            onChange={(v) => updateAdjustment('tint', v)}
                            description="Green/Magenta"
                        />
                    </div>
                )}
            </div>

            {/* DETAIL SECTION */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                    onClick={() => toggleSection('detail')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                    <span className="font-semibold text-gray-800 dark:text-gray-100">🔍 Detail</span>
                    {expandedSections.detail ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.detail && (
                    <div className="p-4 space-y-4">
                        <AdjustmentSlider
                            label="Sharpness"
                            value={currentAdjustments.sharpness}
                            min={0}
                            max={100}
                            onChange={(v) => updateAdjustment('sharpness', v)}
                            description="Edge enhancement"
                        />
                        <AdjustmentSlider
                            label="Definition"
                            value={currentAdjustments.definition}
                            min={0}
                            max={100}
                            onChange={(v) => updateAdjustment('definition', v)}
                            description="Local contrast"
                        />
                        <AdjustmentSlider
                            label="Noise Reduction"
                            value={currentAdjustments.noiseReduction}
                            min={0}
                            max={100}
                            onChange={(v) => updateAdjustment('noiseReduction', v)}
                            description="Smoothing"
                        />
                    </div>
                )}
            </div>

            {/* EFFECTS SECTION */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                    onClick={() => toggleSection('effects')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                    <span className="font-semibold text-gray-800 dark:text-gray-100">✨ Effects</span>
                    {expandedSections.effects ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.effects && (
                    <div className="p-4 space-y-4">
                        <AdjustmentSlider
                            label="Vignette"
                            value={currentAdjustments.vignette}
                            min={0}
                            max={100}
                            onChange={(v) => updateAdjustment('vignette', v)}
                            description="Darken corners"
                        />
                    </div>
                )}
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> These adjustments apply {useGlobal ? 'to all images' : 'only to the selected image'}.
                    {`Toggle "Global/Individual" above to change scope.`}
                </p>
            </div>
        </div>
    );
}