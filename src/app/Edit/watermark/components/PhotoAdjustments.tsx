// app/components/PhotoAdjustments.tsx
"use client";

import React, { useState } from "react";
import { useImageEditor, defaultPhotoAdjustments } from "./ImageEditorContext";
import { RotateCcw, Sun, Palette, ScanSearch, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    description,
}) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const isModified = value !== 0;

    return (
        <div className="space-y-2 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </span>
                    {description && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden group-hover:inline transition-all">
                            {description}
                        </span>
                    )}
                </div>
                <motion.span
                    key={value}
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${
                        isModified
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                >
                    {value > 0 ? `+${value}` : value}
                    {unit}
                </motion.span>
            </div>
            <div className="relative h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10"
                />
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-100"
                    style={{ width: `${percentage}%` }}
                />
                {/* Thumb indicator */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-500 shadow-md transition-all duration-100 pointer-events-none"
                    style={{ left: `calc(${percentage}% - 7px)` }}
                />
            </div>
        </div>
    );
};

const sections = [
    {
        key: "light",
        label: "Light",
        icon: Sun,
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-900/10",
        border: "border-amber-200 dark:border-amber-800/40",
        emoji: null,
    },
    {
        key: "color",
        label: "Color",
        icon: Palette,
        color: "text-pink-500",
        bg: "bg-pink-50 dark:bg-pink-900/10",
        border: "border-pink-200 dark:border-pink-800/40",
        emoji: null,
    },
    {
        key: "detail",
        label: "Detail",
        icon: ScanSearch,
        color: "text-cyan-500",
        bg: "bg-cyan-50 dark:bg-cyan-900/10",
        border: "border-cyan-200 dark:border-cyan-800/40",
        emoji: null,
    },
    {
        key: "effects",
        label: "Effects",
        icon: Sparkles,
        color: "text-purple-500",
        bg: "bg-purple-50 dark:bg-purple-900/10",
        border: "border-purple-200 dark:border-purple-800/40",
        emoji: null,
    },
] as const;

type SectionKey = (typeof sections)[number]["key"];

export default function PhotoAdjustments() {
    const {
        images,
        selectedImageIndex,
        globalPhotoAdjustments,
        setGlobalPhotoAdjustments,
        updateIndividualPhotoAdjustments,
        resetPhotoAdjustments,
    } = useImageEditor();

    const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
        light: false,
        color: false,
        detail: false,
        effects: false,
    });

    const isImageSelected = selectedImageIndex !== null && selectedImageIndex < images.length;
    const selectedImage = isImageSelected && selectedImageIndex !== null ? images[selectedImageIndex] : null;
    const useGlobal = selectedImage?.useGlobalSettings ?? true;

    const currentAdjustments = useGlobal
        ? globalPhotoAdjustments
        : selectedImage?.photoAdjustments || globalPhotoAdjustments;

    const updateAdjustment = (key: keyof typeof globalPhotoAdjustments, value: number) => {
        if (useGlobal) {
            setGlobalPhotoAdjustments((prev) => ({ ...prev, [key]: value }));
        } else {
            updateIndividualPhotoAdjustments({ [key]: value });
        }
    };

    const reset = () => {
        if (!useGlobal && selectedImageIndex !== null) {
            resetPhotoAdjustments();
        } else {
            // Resets the global adjustments directly
            setGlobalPhotoAdjustments({ ...defaultPhotoAdjustments });
        }
    }

    const toggleSection = (section: SectionKey) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const hasModifications = Object.values(currentAdjustments).some((v) => v !== 0);

    
const resetSection = (keys: string[]) => {
    const partial = Object.fromEntries(keys.map(k => [k, 0])) as Partial<typeof defaultPhotoAdjustments>;
    if (useGlobal) {
        setGlobalPhotoAdjustments(prev => ({ ...prev, ...partial }));
    } else {
        updateIndividualPhotoAdjustments(partial);
    }
};

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Adjustments
                    </h2>
                    <AnimatePresence>
                        {hasModifications && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 tracking-wide uppercase"
                            >
                                Edited
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={reset}
                    disabled={!hasModifications}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        disabled:opacity-30 disabled:cursor-not-allowed
                        bg-gray-100 hover:bg-gray-200 text-gray-600
                        dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                </motion.button>
            </div>

            {/* Sections */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">

                {/* LIGHT */}
                <Section
                   sectionKey="light"
                    label="Light"
                    icon={Sun}
                    iconColor="text-amber-500"
                    isOpen={expandedSections.light}
                    onToggle={() => toggleSection("light")}
                    adjustments={currentAdjustments as unknown as Partial<Record<string, number>>}
                    modifiedKeys={["exposure", "brilliance", "highlights", "shadows", "contrast", "brightness", "blackPoint"]}
                    onResetSection={() => resetSection(["exposure", "brilliance", "highlights", "shadows", "contrast", "brightness", "blackPoint"])}
                >
                    <AdjustmentSlider label="Exposure" value={currentAdjustments.exposure} min={-100} max={100} onChange={(v) => updateAdjustment("exposure", v)} description="Overall brightness" />
                    <AdjustmentSlider label="Brilliance" value={currentAdjustments.brilliance} min={-100} max={100} onChange={(v) => updateAdjustment("brilliance", v)} description="Enhances mid-tones" />
                    <AdjustmentSlider label="Highlights" value={currentAdjustments.highlights} min={-100} max={100} onChange={(v) => updateAdjustment("highlights", v)} description="Bright areas only" />
                    <AdjustmentSlider label="Shadows" value={currentAdjustments.shadows} min={-100} max={100} onChange={(v) => updateAdjustment("shadows", v)} description="Dark areas only" />
                    <AdjustmentSlider label="Contrast" value={currentAdjustments.contrast} min={-100} max={100} onChange={(v) => updateAdjustment("contrast", v)} description="Light/dark difference" />
                    <AdjustmentSlider label="Brightness" value={currentAdjustments.brightness} min={-100} max={100} onChange={(v) => updateAdjustment("brightness", v)} description="Simple brightness" />
                    <AdjustmentSlider label="Black Point" value={currentAdjustments.blackPoint} min={0} max={100} onChange={(v) => updateAdjustment("blackPoint", v)} description="Deepens blacks" />
                </Section>

                {/* COLOR */}
                <Section
                    sectionKey="color"
                    label="Color"
                    icon={Palette}
                    iconColor="text-pink-500"
                    isOpen={expandedSections.color}
                    onToggle={() => toggleSection("color")}
                    adjustments={currentAdjustments as unknown as Partial<Record<string, number>>}
                    modifiedKeys={["saturation", "vibrance", "warmth", "tint"]}
                >
                    <AdjustmentSlider label="Saturation" value={currentAdjustments.saturation} min={-100} max={100} onChange={(v) => updateAdjustment("saturation", v)} description="Color intensity" />
                    <AdjustmentSlider label="Vibrance" value={currentAdjustments.vibrance} min={-100} max={100} onChange={(v) => updateAdjustment("vibrance", v)} description="Smart saturation" />
                    <AdjustmentSlider label="Warmth" value={currentAdjustments.warmth} min={-100} max={100} onChange={(v) => updateAdjustment("warmth", v)} description="Temperature" />
                    <AdjustmentSlider label="Tint" value={currentAdjustments.tint} min={-100} max={100} onChange={(v) => updateAdjustment("tint", v)} description="Green/Magenta" />
                </Section>

                {/* DETAIL */}
                <Section
                    sectionKey="detail"
                    label="Detail"
                    icon={ScanSearch}
                    iconColor="text-cyan-500"
                    isOpen={expandedSections.detail}
                    onToggle={() => toggleSection("detail")}
                    adjustments={currentAdjustments as unknown as Partial<Record<string, number>>}
                    modifiedKeys={["sharpness", "definition", "noiseReduction"]}
                >
                    <AdjustmentSlider label="Sharpness" value={currentAdjustments.sharpness} min={0} max={100} onChange={(v) => updateAdjustment("sharpness", v)} description="Edge enhancement" />
                    <AdjustmentSlider label="Definition" value={currentAdjustments.definition} min={0} max={100} onChange={(v) => updateAdjustment("definition", v)} description="Local contrast" />
                    <AdjustmentSlider label="Noise Reduction" value={currentAdjustments.noiseReduction} min={0} max={100} onChange={(v) => updateAdjustment("noiseReduction", v)} description="Smoothing" />
                </Section>

                {/* EFFECTS */}
                <Section
                    sectionKey="effects"
                    label="Effects"
                    icon={Sparkles}
                    iconColor="text-purple-500"
                    isOpen={expandedSections.effects}
                    onToggle={() => toggleSection("effects")}
                    adjustments={currentAdjustments as unknown as Partial<Record<string, number>>}
                    modifiedKeys={["vignette"]}
                >
                    <AdjustmentSlider label="Vignette" value={currentAdjustments.vignette} min={0} max={100} onChange={(v) => updateAdjustment("vignette", v)} description="Darken corners" />
                </Section>

            </div>

            {/* Footer tip */}
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    Adjustments apply {useGlobal ? "to all images globally" : "to selected image only"}.
                </p>
            </div>
        </div>
    );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
interface SectionProps {
    sectionKey: string;
    label: string;
    icon: React.ElementType;
    iconColor: string;
    isOpen: boolean;
    onToggle: () => void;
    adjustments: Partial<Record<string, number>>;
    modifiedKeys: string[];
    children: React.ReactNode;
    onResetSection?: () => void;
}

function Section({
    label,
    icon: Icon,
    iconColor,
    isOpen,
    onToggle,
    adjustments,
    modifiedKeys,
    children,
    onResetSection, // ADD this prop
}: SectionProps & { onResetSection?: () => void }) {
    const modifiedCount = modifiedKeys.filter((k) => (adjustments[k] ?? 0) !== 0).length;


    

    return (
        <div>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {label}
                    </span>
                    <AnimatePresence>
                        {modifiedCount > 0 && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.6 }}
                                className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center"
                            >
                                {modifiedCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="text-gray-400"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </button>

            {/* Collapsed summary pills — only when closed and something is modified */}
            <AnimatePresence>
                {!isOpen && modifiedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-2.5 flex flex-wrap gap-1.5"
                    >
                        {modifiedKeys
                            .filter(k => (adjustments[k] ?? 0) !== 0)
                            .map(k => {
                                const val = adjustments[k] ?? 0;
                                return (
                                    <span
                                        key={k}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    >
                                        {/* Humanize camelCase key into readable label */}
                                        {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                        <span className={`font-bold ${val > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                            {val > 0 ? `+${val}` : val}
                                        </span>
                                    </span>
                                );
                            })
                        }
                </motion.div>
                )}
            </AnimatePresence>

            {/* Expanded content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: "hidden" }}
                    >
                        <div className="px-5 pb-5 pt-2 space-y-5 bg-gray-50/60 dark:bg-gray-800/30">
                            {children}

                            {/* Per-section reset */}
                            {modifiedCount > 0 && onResetSection && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onResetSection();
                                    }}
                                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 dark:text-red-400 font-medium transition-colors mt-1"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset {label}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        
    );
    
}