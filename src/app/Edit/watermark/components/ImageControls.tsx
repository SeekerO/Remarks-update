"use client";

import React, { useState } from "react";
import { useImageEditor } from "./ImageEditorContext";
import { FaImage, FaImages } from "react-icons/fa";
import { Trash2, AlertTriangle, GripVertical, Copy, CheckCheck } from "lucide-react";

interface WatermarkSettings {
    position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
    width: number;
    height: number;
    paddingX: number;
    paddingY: number;
    opacity?: number;
    rotation?: number;
}

export const FooterControlsBlock = ({
    selectedFooterId,
    currentFooterSettings,
    updateFooterSettings,
}: {
    selectedFooterId: string | null;
    currentFooterSettings: any;
    updateFooterSettings: (s: any) => void;
}) => {
    if (!selectedFooterId || !currentFooterSettings) return null;

    const autoFit: boolean = currentFooterSettings.autoFit ?? true;
    const fitVal: number = currentFooterSettings.fitScale ?? 25;

    const sliders = [
        { label: "Opacity", key: "opacity", min: 0, max: 1, val: currentFooterSettings.opacity ?? 1, unit: "%", display: String(Math.round((currentFooterSettings.opacity ?? 1) * 100)), step: 0.01, always: true },
        { label: "Offset X", key: "offsetX", min: -500, max: 500, val: currentFooterSettings.offsetX ?? 0, unit: "px", always: false },
        { label: "Offset Y", key: "offsetY", min: -500, max: 500, val: currentFooterSettings.offsetY ?? 0, unit: "px", always: false },
        { label: "Scale", key: "scale", min: 0.1, max: 5, val: currentFooterSettings.scale ?? 1, unit: "×", display: (currentFooterSettings.scale ?? 1).toFixed(2), step: 0.01, always: false },
        { label: "Rotation", key: "rotation", min: -180, max: 180, val: currentFooterSettings.rotation ?? 0, unit: "°", always: true },
    ].filter(({ always, key }) => {
        if (always) return true;
        if (autoFit) return key === "offsetX" || key === "offsetY";
        return true;
    });

    return (
        <div className="space-y-3 pt-2 mb-20 border-t border-gray-100 dark:border-gray-800">

            {/* Auto Fit toggle */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40">
                <div>
                    <p className="text-xs font-semibold text-green-800 dark:text-green-300">Auto Fit</p>
                    <p className="text-[10px] text-green-600 dark:text-green-400 leading-snug mt-0.5">
                        Bottom-center · auto-scaled to canvas
                    </p>
                </div>
                <button
                    onClick={() => updateFooterSettings({ autoFit: !autoFit })}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0
                        ${autoFit ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                        ${autoFit ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Fit Size slider — only visible in auto-fit mode */}
            {autoFit && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Fit Size
                        </span>
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 tabular-nums">
                            {fitVal}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min={5}
                        max={100}
                        step={1}
                        value={fitVal}
                        onChange={(e) => updateFooterSettings({ fitScale: parseInt(e.target.value) })}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right,
                                rgb(34,197,94) 0%,
                                rgb(34,197,94) ${((fitVal - 5) / 95) * 100}%,
                                rgb(229,231,235) ${((fitVal - 5) / 95) * 100}%,
                                rgb(229,231,235) 100%)`
                        }}
                    />
                    <div className="flex justify-between mt-0.5">
                        <span className="text-[10px] text-gray-400">5% · tiny</span>
                        <span className="text-[10px] text-gray-400">100% · full width</span>
                    </div>
                </div>
            )}

            {/* Opacity / Offsets / Scale / Rotation */}
            {sliders.map(({ label, key, min, max, val, unit, display, step }) => (
                <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {label}
                            {autoFit && (key === "offsetX" || key === "offsetY") && (
                                <span className="ml-1 text-[9px] text-green-500 font-semibold">nudge</span>
                            )}
                        </span>
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 tabular-nums">
                            {display ?? val}{unit}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step ?? 1}
                        value={val}
                        onChange={(e) => updateFooterSettings({
                            [key]: step ? parseFloat(e.target.value) : parseInt(e.target.value)
                        })}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right,
                                rgb(34,197,94) 0%,
                                rgb(34,197,94) ${((val - min) / (max - min)) * 100}%,
                                rgb(229,231,235) ${((val - min) / (max - min)) * 100}%,
                                rgb(229,231,235) 100%)`
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

const calculateEdgeDistance = (position: string, paddingX: number, paddingY: number) => {
    let minDistance = Infinity;
    const edges: string[] = [];

    switch (position) {
        case "top-left":
            minDistance = Math.min(paddingX, paddingY);
            if (paddingX <= 10) edges.push("left");
            if (paddingY <= 10) edges.push("top");
            break;
        case "top-center":
            minDistance = paddingY;
            if (paddingY <= 10) edges.push("top");
            break;
        case "top-right":
            minDistance = Math.min(paddingX, paddingY);
            if (paddingX <= 10) edges.push("right");
            if (paddingY <= 10) edges.push("top");
            break;
        case "bottom-left":
            minDistance = Math.min(paddingX, paddingY);
            if (paddingX <= 10) edges.push("left");
            if (paddingY <= 10) edges.push("bottom");
            break;
        case "bottom-center":
            minDistance = paddingY;
            if (paddingY <= 10) edges.push("bottom");
            break;
        case "bottom-right":
            minDistance = Math.min(paddingX, paddingY);
            if (paddingX <= 10) edges.push("right");
            if (paddingY <= 10) edges.push("bottom");
            break;
    }

    return { minDistance, edges, isNearEdge: minDistance <= 10 };
};

export default function ImageControls() {
    const {
        images,
        selectedImageIndex,
        globalLogoSettings,
        globalFooterSettings,
        toggleUseGlobalSettings,
        copyGlobalToIndividual,
        globalLogos,
        selectedLogoId,
        setSelectedLogoId,
        removeGlobalLogo,
        updateGlobalLogoSettings,
        removeIndividualLogo,
        updateIndividualImageLogoSettings,
        globalFooters,
        selectedFooterId,
        setSelectedFooterId,
        removeGlobalFooter,
        updateGlobalFooterSettings,
        removeIndividualFooter,
        updateIndividualImageFooterSettings,
        reorderGlobalLogos,
        reorderIndividualLogos,
        reorderGlobalFooters,
        reorderIndividualFooters,
    } = useImageEditor();

    const [expandedLogoSection, setExpandedLogoSection] = useState(true);
    const [expandedFooterSection, setExpandedFooterSection] = useState(true);
    const [draggedLogoIndex, setDraggedLogoIndex] = useState<number | null>(null);
    const [draggedFooterIndex, setDraggedFooterIndex] = useState<number | null>(null);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const adjustmentTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const isImageSelected = selectedImageIndex !== null && selectedImageIndex < images.length;
    const selectedImage = isImageSelected && selectedImageIndex !== null
        ? images[selectedImageIndex]
        : null;
    const useGlobal = selectedImage?.useGlobalSettings ?? true;

    const logosToDisplay = useGlobal
        ? globalLogos
        : (selectedImage?.individualLogos || []);

    const footersToDisplay = useGlobal
        ? globalFooters
        : (selectedImage?.individualFooters || []);

    const selectedLogo = logosToDisplay.find(l => l.id === selectedLogoId);
    const selectedFooter = footersToDisplay.find(f => f.id === selectedFooterId);

    const currentLogoSettings = selectedLogo?.settings || globalLogoSettings;
    const currentFooterSettings = selectedFooter?.settings ||
        (useGlobal ? globalFooterSettings : selectedImage?.individualFooterSettings);

    const edgeInfo = currentLogoSettings
        ? calculateEdgeDistance(
            currentLogoSettings.position,
            currentLogoSettings.paddingX,
            currentLogoSettings.paddingY
        )
        : null;

    // Check if individual settings differ from global
    const hasDivergence = !useGlobal && selectedImage && (
        (selectedImage.individualLogos?.length ?? 0) !== globalLogos.length ||
        (selectedImage.individualFooters?.length ?? 0) !== globalFooters.length
    );

    const handleCopyFromGlobal = () => {
        copyGlobalToIndividual();
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const scheduleAdjusting = () => {
        setIsAdjusting(true);
        if (adjustmentTimeoutRef.current) clearTimeout(adjustmentTimeoutRef.current);
        adjustmentTimeoutRef.current = setTimeout(() => setIsAdjusting(false), 500);
    };

    const updateLogoSettings = (settings: Partial<typeof globalLogoSettings>) => {
        if (!selectedLogoId) return;
        scheduleAdjusting();
        if (useGlobal) {
            updateGlobalLogoSettings(selectedLogoId, settings);
        } else if (selectedImageIndex !== null) {
            updateIndividualImageLogoSettings(selectedImageIndex, selectedLogoId, settings);
        }
    };

    const updateFooterSettings = (settings: Partial<typeof globalFooterSettings>) => {
        if (!selectedFooterId) return;
        scheduleAdjusting();
        if (useGlobal) {
            updateGlobalFooterSettings(selectedFooterId, settings);
        } else if (selectedImageIndex !== null) {
            updateIndividualImageFooterSettings(selectedImageIndex, selectedFooterId, settings);
        }
    };

    const handleRemoveLogo = (logoId: string) => {
        if (useGlobal) removeGlobalLogo(logoId);
        else if (selectedImageIndex !== null) removeIndividualLogo(selectedImageIndex, logoId);
    };

    const handleRemoveFooter = (footerId: string) => {
        if (useGlobal) removeGlobalFooter(footerId);
        else if (selectedImageIndex !== null) removeIndividualFooter(selectedImageIndex, footerId);
    };

    // Drag handlers — logos
    const handleLogoDragStart = (e: React.DragEvent, index: number) => {
        setDraggedLogoIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };
    const handleLogoDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedLogoIndex === null || draggedLogoIndex === index) return;
        const newLogos = [...logosToDisplay];
        const [dragged] = newLogos.splice(draggedLogoIndex, 1);
        newLogos.splice(index, 0, dragged);
        if (useGlobal) reorderGlobalLogos(newLogos);
        else if (selectedImageIndex !== null) reorderIndividualLogos(selectedImageIndex, newLogos);
        setDraggedLogoIndex(index);
    };
    const handleLogoDragEnd = () => setDraggedLogoIndex(null);

    // Drag handlers — footers
    const handleFooterDragStart = (e: React.DragEvent, index: number) => {
        setDraggedFooterIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };
    const handleFooterDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedFooterIndex === null || draggedFooterIndex === index) return;
        const newFooters = [...footersToDisplay];
        const [dragged] = newFooters.splice(draggedFooterIndex, 1);
        newFooters.splice(index, 0, dragged);
        if (useGlobal) reorderGlobalFooters(newFooters);
        else if (selectedImageIndex !== null) reorderIndividualFooters(selectedImageIndex, newFooters);
        setDraggedFooterIndex(index);
    };
    const handleFooterDragEnd = () => setDraggedFooterIndex(null);

    React.useEffect(() => {
        return () => {
            if (adjustmentTimeoutRef.current) clearTimeout(adjustmentTimeoutRef.current);
        };
    }, []);

    return (
        <div className="space-y-4">

            {/* ── Global / Individual toggle ── */}
            {isImageSelected && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Toggle row */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Settings Scope
                        </span>
                        <button
                            onClick={toggleUseGlobalSettings}
                            className={`relative flex items-center w-32 h-8 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                                ${useGlobal
                                    ? "bg-indigo-600"
                                    : "bg-purple-600"
                                }`}
                        >
                            {/* Sliding pill */}
                            <div className={`absolute flex items-center justify-center w-[60px] h-7 bg-white rounded-full shadow-md transform transition-transform duration-300
                                ${useGlobal ? "translate-x-0.5" : "translate-x-[62px]"}`}
                            >
                                {useGlobal
                                    ? <FaImages className="w-3.5 h-3.5 text-indigo-600" />
                                    : <FaImage className="w-3.5 h-3.5 text-purple-600" />
                                }
                            </div>
                            <span className={`absolute left-2 text-[11px] font-bold text-white transition-opacity duration-200
                                ${useGlobal ? "opacity-0" : "opacity-100"}`}>
                                Global
                            </span>
                            <span className={`absolute right-2 text-[11px] font-bold text-white transition-opacity duration-200
                                ${useGlobal ? "opacity-100" : "opacity-0"}`}>
                                Indiv.
                            </span>
                        </button>
                    </div>

                    {/* Copy from Global banner — only shown in individual mode */}
                    {!useGlobal && (
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                        Individual Mode
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                        {hasDivergence
                                            ? "Settings differ from global — editing independently."
                                            : "Using independent settings for this image."
                                        }
                                    </p>
                                </div>

                                {/* Copy from global button */}
                                {globalLogos.length > 0 || globalFooters.length > 0 ? (
                                    <button
                                        onClick={handleCopyFromGlobal}
                                        title="Copy all global logos, footers and settings into this image"
                                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                                            ${copySuccess
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                                : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                                            }`}
                                    >
                                        {copySuccess
                                            ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</>
                                            : <><Copy className="w-3.5 h-3.5" /> Copy from Global</>
                                        }
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── LOGOS SECTION ── */}
            {logosToDisplay.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Section header */}
                    <button
                        onClick={() => setExpandedLogoSection(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            {useGlobal ? "Global Logos" : "Individual Logos"}
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                {logosToDisplay.length}
                            </span>
                        </span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            {expandedLogoSection ? "Collapse" : "Expand"}
                        </span>
                    </button>

                    {expandedLogoSection && (
                        <div className="px-4 pb-4 pt-3 space-y-4">
                            {/* Drag hint */}
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                💡 Drag thumbnails to reorder rendering order
                            </p>

                            {/* Logo grid */}
                            <div className="grid grid-cols-3 gap-2">
                                {logosToDisplay.map((logo, idx) => (
                                    <div
                                        key={logo.id}
                                        draggable
                                        onDragStart={(e) => handleLogoDragStart(e, idx)}
                                        onDragOver={(e) => handleLogoDragOver(e, idx)}
                                        onDragEnd={handleLogoDragEnd}
                                        onClick={() => setSelectedLogoId(logo.id)}
                                        className={`relative group cursor-move rounded-lg overflow-hidden border-2 transition-all
                                            ${selectedLogoId === logo.id
                                                ? "border-indigo-500 shadow-md"
                                                : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                                            }
                                            ${draggedLogoIndex === idx ? "opacity-40 scale-95" : ""}
                                        `}
                                    >
                                        <div className="absolute top-1 left-1 p-1 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <GripVertical className="w-3 h-3" />
                                        </div>
                                        <img
                                            src={logo.url}
                                            alt="Logo"
                                            className="w-full h-16 object-contain bg-gray-100 dark:bg-gray-700/60 p-2 pointer-events-none"
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveLogo(logo.id); }}
                                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                        {selectedLogoId === logo.id && (
                                            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-500" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Logo controls */}
                            {selectedLogoId && currentLogoSettings && (
                                <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">

                                    {/* Edge warning */}
                                    {edgeInfo?.isNearEdge && (
                                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-800 dark:text-amber-200">
                                                Logo is <strong>{edgeInfo.minDistance}px</strong> from {edgeInfo.edges.join(" & ")} edge
                                            </p>
                                        </div>
                                    )}

                                    {/* Position */}
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                        Position
                                        <select
                                            value={currentLogoSettings.position}
                                            onChange={(e) => updateLogoSettings({ position: e.target.value as WatermarkSettings["position"] })}
                                            className="mt-1 block w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="top-left">Top Left</option>
                                            <option value="top-center">Top Center</option>
                                            <option value="top-right">Top Right</option>
                                            <option value="bottom-left">Bottom Left</option>
                                            <option value="bottom-center">Bottom Center</option>
                                            <option value="bottom-right">Bottom Right</option>
                                        </select>
                                    </label>

                                    {/* Sliders */}
                                    {[
                                        { label: "Width", key: "width", min: 10, max: 1000, val: currentLogoSettings.width, unit: "px" },
                                        { label: "Height", key: "height", min: 10, max: 1000, val: currentLogoSettings.height, unit: "px" },
                                        { label: "Padding X", key: "paddingX", min: 0, max: 100, val: currentLogoSettings.paddingX, unit: "px", warn: edgeInfo?.edges.includes("left") || edgeInfo?.edges.includes("right") },
                                        { label: "Padding Y", key: "paddingY", min: 0, max: 100, val: currentLogoSettings.paddingY, unit: "px", warn: edgeInfo?.edges.includes("top") || edgeInfo?.edges.includes("bottom") },
                                        { label: "Opacity", key: "opacity", min: 0, max: 1, val: currentLogoSettings.opacity ?? 1, unit: "%", display: Math.round((currentLogoSettings.opacity ?? 1) * 100), step: 0.01 },
                                        { label: "Rotation", key: "rotation", min: -180, max: 180, val: currentLogoSettings.rotation ?? 0, unit: "°" },
                                    ].map(({ label, key, min, max, val, unit, warn, display, step }) => (
                                        <div key={key} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${warn ? "text-amber-600 dark:text-amber-400 font-bold" : "text-gray-600 dark:text-gray-400"}`}>
                                                    {label}
                                                </span>
                                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                                    {display ?? val}{unit}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={min}
                                                max={max}
                                                step={step ?? 1}
                                                value={val}
                                                onChange={(e) => updateLogoSettings({
                                                    [key]: step ? parseFloat(e.target.value) : parseInt(e.target.value)
                                                })}
                                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                                                style={{
                                                    background: `linear-gradient(to right,
                                                        rgb(99,102,241) 0%,
                                                        rgb(99,102,241) ${((val - min) / (max - min)) * 100}%,
                                                        rgb(229,231,235) ${((val - min) / (max - min)) * 100}%,
                                                        rgb(229,231,235) 100%)`
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── FOOTERS SECTION ── */}
            {footersToDisplay.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                        onClick={() => setExpandedFooterSection(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            {useGlobal ? "Global Footers" : "Individual Footers"}
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                                {footersToDisplay.length}
                            </span>
                        </span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            {expandedFooterSection ? "Collapse" : "Expand"}
                        </span>
                    </button>

                    {expandedFooterSection && (
                        <div className="px-4 pb-4 pt-3 space-y-4">
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                💡 Drag thumbnails to reorder rendering order
                            </p>

                            {/* Footer grid */}
                            <div className="grid grid-cols-3 gap-2">
                                {footersToDisplay.map((footer, idx) => (
                                    <div
                                        key={footer.id}
                                        draggable
                                        onDragStart={(e) => handleFooterDragStart(e, idx)}
                                        onDragOver={(e) => handleFooterDragOver(e, idx)}
                                        onDragEnd={handleFooterDragEnd}
                                        onClick={() => setSelectedFooterId(footer.id)}
                                        className={`relative group cursor-move rounded-lg overflow-hidden border-2 transition-all
                                            ${selectedFooterId === footer.id
                                                ? "border-green-500 shadow-md"
                                                : "border-gray-200 dark:border-gray-700 hover:border-green-300"
                                            }
                                            ${draggedFooterIndex === idx ? "opacity-40 scale-95" : ""}
                                        `}
                                    >
                                        <div className="absolute top-1 left-1 p-1 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <GripVertical className="w-3 h-3" />
                                        </div>
                                        <img
                                            src={footer.url}
                                            alt="Footer"
                                            className="w-full h-16 object-contain bg-gray-100 dark:bg-gray-700/60 p-2 pointer-events-none"
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveFooter(footer.id); }}
                                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                        {selectedFooterId === footer.id && (
                                            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-green-500" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Footer controls */}
                            {selectedFooterId && currentFooterSettings && (() => {
                                const autoFit: boolean = (currentFooterSettings as any).autoFit ?? true;
                                const fitVal: number = (currentFooterSettings as any).fitScale ?? 25;

                                const sliders = [
                                    {
                                        label: "Opacity", key: "opacity",
                                        min: 0, max: 1, step: 0.01,
                                        val: currentFooterSettings.opacity ?? 1,
                                        unit: "%",
                                        display: String(Math.round((currentFooterSettings.opacity ?? 1) * 100)),
                                        always: true,
                                    },
                                    {
                                        label: "Offset X", key: "offsetX",
                                        min: -500, max: 500, step: 1,
                                        val: currentFooterSettings.offsetX ?? 0,
                                        unit: "px",
                                        always: false,
                                    },
                                    {
                                        label: "Offset Y", key: "offsetY",
                                        min: -500, max: 500, step: 1,
                                        val: currentFooterSettings.offsetY ?? 0,
                                        unit: "px",
                                        always: false,
                                    },
                                    {
                                        label: "Scale", key: "scale",
                                        min: 0.1, max: 5, step: 0.01,
                                        val: currentFooterSettings.scale ?? 1,
                                        unit: "×",
                                        display: (currentFooterSettings.scale ?? 1).toFixed(2),
                                        always: false,
                                    },
                                    {
                                        label: "Rotation", key: "rotation",
                                        min: -180, max: 180, step: 1,
                                        val: currentFooterSettings.rotation ?? 0,
                                        unit: "°",
                                        always: true,
                                    },
                                ].filter(({ always, key }) => {
                                    if (always) return true;
                                    // In auto-fit mode: keep offsetX/Y as nudge controls, hide manual scale
                                    if (autoFit) return key === "offsetX" || key === "offsetY";
                                    return true;
                                });

                                return (
                                    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">

                                        {/* ── Auto Fit toggle ──────────────────────────────────── */}
                                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40">
                                            <div>
                                                <p className="text-xs font-semibold text-green-800 dark:text-green-300">
                                                    Auto Fit
                                                </p>
                                                <p className="text-[10px] text-green-600 dark:text-green-400 leading-snug mt-0.5">
                                                    Bottom-center · auto-scaled to canvas
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => updateFooterSettings({ autoFit: !autoFit })}
                                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0
                        ${autoFit ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                        ${autoFit ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </button>
                                        </div>

                                        {/* ── Fit Size slider — only visible when Auto Fit is ON ── */}
                                        {autoFit && (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        Fit Size
                                                    </span>
                                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 tabular-nums">
                                                        {fitVal}%
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={5}
                                                    max={100}
                                                    step={1}
                                                    value={fitVal}
                                                    onChange={(e) => updateFooterSettings({ fitScale: parseInt(e.target.value) })}
                                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                                    style={{
                                                        background: `linear-gradient(to right,
                                rgb(34,197,94) 0%,
                                rgb(34,197,94) ${((fitVal - 5) / 95) * 100}%,
                                rgb(229,231,235) ${((fitVal - 5) / 95) * 100}%,
                                rgb(229,231,235) 100%)`
                                                    }}
                                                />
                                                <div className="flex justify-between mt-0.5">
                                                    <span className="text-[10px] text-gray-400">5% · tiny</span>
                                                    <span className="text-[10px] text-gray-400">100% · full width</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Opacity / Offsets / Scale / Rotation ────────────── */}
                                        {sliders.map(({ label, key, min, max, step, val, unit, display }) => (
                                            <div key={key} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        {label}
                                                        {autoFit && (key === "offsetX" || key === "offsetY") && (
                                                            <span className="ml-1 text-[9px] text-green-500 font-semibold">
                                                                nudge
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 tabular-nums">
                                                        {display ?? val}{unit}
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={min}
                                                    max={max}
                                                    step={step}
                                                    value={val}
                                                    onChange={(e) => updateFooterSettings({
                                                        [key]: step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value)
                                                    })}
                                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                                    style={{
                                                        background: `linear-gradient(to right,
                                rgb(34,197,94) 0%,
                                rgb(34,197,94) ${((val - min) / (max - min)) * 100}%,
                                rgb(229,231,235) ${((val - min) / (max - min)) * 100}%,
                                rgb(229,231,235) 100%)`
                                                    }}
                                                />
                                            </div>
                                        ))}

                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* Empty state when no logos or footers */}
            {logosToDisplay.length === 0 && footersToDisplay.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No logos or footers added yet
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Use the Upload tab to add assets
                    </p>
                </div>
            )}
        </div>
    );
}

