// app/components/ImageControls.tsx
"use client";

import React, { useState } from "react";
import { useImageEditor } from "./ImageEditorContext";
import { FaImage, FaImages } from "react-icons/fa";
import { Trash2, AlertTriangle, GripVertical } from "lucide-react";

interface WatermarkSettings {
    position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
    width: number;
    height: number;
    paddingX: number;
    paddingY: number;
    opacity?: number;
    rotation?: number;
}

// Calculate distance from edges
const calculateEdgeDistance = (
    position: string,
    paddingX: number,
    paddingY: number
) => {
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
    const adjustmentTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const isImageSelected = selectedImageIndex !== null && selectedImageIndex < images.length;
    const selectedImage = isImageSelected && selectedImageIndex !== null ? images[selectedImageIndex] : null;
    const useGlobal = selectedImage?.useGlobalSettings ?? true;

    // Get logos to display
    const logosToDisplay = useGlobal ? globalLogos : (selectedImage?.individualLogos || []);
    const selectedLogo = logosToDisplay.find(l => l.id === selectedLogoId);

    // Get footers to display
    const footersToDisplay = useGlobal ? globalFooters : (selectedImage?.individualFooters || []);
    const selectedFooter = footersToDisplay.find(f => f.id === selectedFooterId);

    const currentLogoSettings = selectedLogo?.settings || globalLogoSettings;
    const currentFooterSettings = selectedFooter?.settings ||
        (useGlobal ? globalFooterSettings : selectedImage?.individualFooterSettings);

    // Calculate edge proximity
    const edgeInfo = currentLogoSettings ? calculateEdgeDistance(
        currentLogoSettings.position,
        currentLogoSettings.paddingX,
        currentLogoSettings.paddingY
    ) : null;

    const updateLogoSettings = (settings: Partial<typeof globalLogoSettings>) => {
        if (!selectedLogoId) return;

        // Trigger loading state
        setIsAdjusting(true);

        // Clear any existing timeout
        if (adjustmentTimeoutRef.current) {
            clearTimeout(adjustmentTimeoutRef.current);
        }

        if (useGlobal) {
            updateGlobalLogoSettings(selectedLogoId, settings);
        } else if (selectedImageIndex !== null) {
            updateIndividualImageLogoSettings(selectedImageIndex, selectedLogoId, settings);
        }

        // Set timeout to hide loading after adjustment completes
        adjustmentTimeoutRef.current = setTimeout(() => {
            setIsAdjusting(false);
        }, 500);
    };

    const updateFooterSettings = (settings: Partial<typeof globalFooterSettings>) => {
        if (!selectedFooterId) return;

        // Trigger loading state
        setIsAdjusting(true);

        // Clear any existing timeout
        if (adjustmentTimeoutRef.current) {
            clearTimeout(adjustmentTimeoutRef.current);
        }

        if (useGlobal) {
            updateGlobalFooterSettings(selectedFooterId, settings);
        } else if (selectedImageIndex !== null) {
            updateIndividualImageFooterSettings(selectedImageIndex, selectedFooterId, settings);
        }

        // Set timeout to hide loading after adjustment completes
        adjustmentTimeoutRef.current = setTimeout(() => {
            setIsAdjusting(false);
        }, 500);
    };

    const handleRemoveLogo = (logoId: string) => {
        if (useGlobal) {
            removeGlobalLogo(logoId);
        } else if (selectedImageIndex !== null) {
            removeIndividualLogo(selectedImageIndex, logoId);
        }
    };

    const handleRemoveFooter = (footerId: string) => {
        if (useGlobal) {
            removeGlobalFooter(footerId);
        } else if (selectedImageIndex !== null) {
            removeIndividualFooter(selectedImageIndex, footerId);
        }
    };

    // Logo drag and drop handlers
    const handleLogoDragStart = (e: React.DragEvent, index: number) => {
        setDraggedLogoIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleLogoDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedLogoIndex === null || draggedLogoIndex === index) return;

        const newLogos = [...logosToDisplay];
        const draggedLogo = newLogos[draggedLogoIndex];
        newLogos.splice(draggedLogoIndex, 1);
        newLogos.splice(index, 0, draggedLogo);

        if (useGlobal) {
            reorderGlobalLogos(newLogos);
        } else if (selectedImageIndex !== null) {
            reorderIndividualLogos(selectedImageIndex, newLogos);
        }

        setDraggedLogoIndex(index);
    };

    const handleLogoDragEnd = () => {
        setDraggedLogoIndex(null);
    };

    // Footer drag and drop handlers
    const handleFooterDragStart = (e: React.DragEvent, index: number) => {
        setDraggedFooterIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleFooterDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedFooterIndex === null || draggedFooterIndex === index) return;

        const newFooters = [...footersToDisplay];
        const draggedFooter = newFooters[draggedFooterIndex];
        newFooters.splice(draggedFooterIndex, 1);
        newFooters.splice(index, 0, draggedFooter);

        if (useGlobal) {
            reorderGlobalFooters(newFooters);
        } else if (selectedImageIndex !== null) {
            reorderIndividualFooters(selectedImageIndex, newFooters);
        }

        setDraggedFooterIndex(index);
    };

    const handleFooterDragEnd = () => {
        setDraggedFooterIndex(null);
    };

    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (adjustmentTimeoutRef.current) {
                clearTimeout(adjustmentTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="space-y-6">


            {isImageSelected && (
                <div className="w-full flex justify-center">
                    <div className="h-[1px] w-[80%] dark:bg-slate-600 bg-slate-300" />
                </div>
            )}

            {isImageSelected && (
                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-inner">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Apply Settings:</span>
                    <div
                        className={`z-0 relative w-28 h-8 flex items-center rounded-full cursor-pointer transition-colors duration-300 ${useGlobal ? 'bg-blue-600' : 'bg-purple-600'}`}
                        onClick={toggleUseGlobalSettings}
                    >
                        <div className={`z-50 flex items-center justify-center absolute w-1/2 h-full bg-white rounded-full shadow-md transform transition-transform duration-300 ${useGlobal ? 'translate-x-0' : 'translate-x-full'}`}>
                            {useGlobal ? <FaImages /> : <FaImage />}
                        </div>
                        <span className={`absolute left-0 w-1/2 text-center text-xs font-semibold transition-colors duration-300 ${useGlobal ? 'text-white' : 'text-gray-200'}`}>Global</span>
                        <span className={`absolute right-0 w-1/2 text-center text-xs font-semibold transition-colors duration-300 ${useGlobal ? 'text-gray-200' : 'text-white'}`}>Individual</span>
                    </div>
                </div>
            )}

            {/* LOGOS SECTION */}
            {logosToDisplay.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b pb-2 mb-3 border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {useGlobal ? 'Global Logos' : 'Individual Logos'} ({logosToDisplay.length})
                        </h2>
                        <button
                            onClick={() => setExpandedLogoSection(!expandedLogoSection)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {expandedLogoSection ? 'Collapse' : 'Expand'}
                        </button>
                    </div>

                    {expandedLogoSection && (
                        <>
                            {/* Logo Selection Grid with Drag and Drop */}
                            <div className="space-y-1 mb-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    💡 Drag to reorder logos
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {logosToDisplay.map((logo, index) => (
                                        <div
                                            key={logo.id}
                                            draggable
                                            onDragStart={(e) => handleLogoDragStart(e, index)}
                                            onDragOver={(e) => handleLogoDragOver(e, index)}
                                            onDragEnd={handleLogoDragEnd}
                                            className={`relative group cursor-move rounded-lg overflow-hidden border-2 transition-all ${selectedLogoId === logo.id
                                                ? 'border-blue-500 shadow-lg'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                                } ${draggedLogoIndex === index ? 'opacity-50' : ''}`}
                                            onClick={() => setSelectedLogoId(logo.id)}
                                        >
                                            <div className="absolute top-1 left-1 p-1 bg-gray-800 bg-opacity-70 text-white rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <GripVertical className="w-3 h-3" />
                                            </div>
                                            <img
                                                src={logo.url}
                                                alt="Logo"
                                                className="w-full h-20 object-contain bg-gray-100 dark:bg-gray-700 p-2 pointer-events-none"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveLogo(logo.id);
                                                }}
                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            {selectedLogoId === logo.id && (
                                                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-0">
                                                    <span className="text-white text-xs font-bold bg-blue-600 px-2 py-1 rounded">EDITING</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Logo Controls */}
                            {selectedLogoId && currentLogoSettings && (
                                <>
                                    {/* Edge Proximity Warning */}
                                    {edgeInfo?.isNearEdge && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 flex items-start gap-2">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                                <strong>Edge Warning:</strong> Logo is {edgeInfo.minDistance}px from {edgeInfo.edges.join(' & ')} edge{edgeInfo.edges.length > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Position:
                                            <select
                                                value={currentLogoSettings.position}
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
                                            Width: {currentLogoSettings.width}px
                                            <input
                                                type="range"
                                                min="10"
                                                max="1000"
                                                value={currentLogoSettings.width}
                                                onChange={(e) => updateLogoSettings({ width: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Height: {currentLogoSettings.height}px
                                            <input
                                                type="range"
                                                min="10"
                                                max="1000"
                                                value={currentLogoSettings.height}
                                                onChange={(e) => updateLogoSettings({ height: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <span className={edgeInfo?.edges.includes('left') || edgeInfo?.edges.includes('right') ? 'text-yellow-600 dark:text-yellow-400 font-bold' : ''}>
                                                Padding X: {currentLogoSettings.paddingX}px
                                            </span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={currentLogoSettings.paddingX}
                                                onChange={(e) => updateLogoSettings({ paddingX: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <span className={edgeInfo?.edges.includes('top') || edgeInfo?.edges.includes('bottom') ? 'text-yellow-600 dark:text-yellow-400 font-bold' : ''}>
                                                Padding Y: {currentLogoSettings.paddingY}px
                                            </span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={currentLogoSettings.paddingY}
                                                onChange={(e) => updateLogoSettings({ paddingY: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Opacity: {((currentLogoSettings.opacity || 1) * 100).toFixed(0)}%
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={currentLogoSettings.opacity || 1}
                                                onChange={(e) => updateLogoSettings({ opacity: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Rotation: {(currentLogoSettings.rotation || 0)}°
                                            <input
                                                type="range"
                                                min="-180"
                                                max="180"
                                                value={currentLogoSettings.rotation || 0}
                                                onChange={(e) => updateLogoSettings({ rotation: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* FOOTER SECTION */}
            {footersToDisplay.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b pb-2 mb-3 border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {useGlobal ? 'Global Footers' : 'Individual Footers'} ({footersToDisplay.length})
                        </h2>
                        <button
                            onClick={() => setExpandedFooterSection(!expandedFooterSection)}
                            className="text-sm text-green-600 dark:text-green-400 hover:underline"
                        >
                            {expandedFooterSection ? 'Collapse' : 'Expand'}
                        </button>
                    </div>

                    {expandedFooterSection && (
                        <>
                            {/* Footer Selection Grid with Drag and Drop */}
                            <div className="space-y-1 mb-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    💡 Drag to reorder footers
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {footersToDisplay.map((footer, index) => (
                                        <div
                                            key={footer.id}
                                            draggable
                                            onDragStart={(e) => handleFooterDragStart(e, index)}
                                            onDragOver={(e) => handleFooterDragOver(e, index)}
                                            onDragEnd={handleFooterDragEnd}
                                            className={`relative group cursor-move rounded-lg overflow-hidden border-2 transition-all ${selectedFooterId === footer.id
                                                ? 'border-green-500 shadow-lg'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                                                } ${draggedFooterIndex === index ? 'opacity-50' : ''}`}
                                            onClick={() => setSelectedFooterId(footer.id)}
                                        >
                                            <div className="absolute top-1 left-1 p-1 bg-gray-800 bg-opacity-70 text-white rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <GripVertical className="w-3 h-3" />
                                            </div>
                                            <img
                                                src={footer.url}
                                                alt="Footer"
                                                className="w-full h-20 object-contain bg-gray-100 dark:bg-gray-700 p-2 pointer-events-none"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveFooter(footer.id);
                                                }}
                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            {selectedFooterId === footer.id && (
                                                <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center z-0">
                                                    <span className="text-white text-xs font-bold bg-green-600 px-2 py-1 rounded">EDITING</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Controls - OPTIMIZED */}
                            {selectedFooterId && currentFooterSettings && (
                                <>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Opacity: {((currentFooterSettings.opacity || 1) * 100).toFixed(0)}%
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={currentFooterSettings.opacity || 1}
                                                onChange={(e) => updateFooterSettings({ opacity: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Scale: {((currentFooterSettings.scale || 1) * 100).toFixed(0)}%
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="5"
                                                step="0.01"
                                                value={currentFooterSettings.scale || 1}
                                                onChange={(e) => updateFooterSettings({ scale: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Offset X: {currentFooterSettings.offsetX || 0}px
                                            <input
                                                type="range"
                                                min="-1500"
                                                max="1500"
                                                value={currentFooterSettings.offsetX || 0}
                                                onChange={(e) => updateFooterSettings({ offsetX: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Offset Y: {currentFooterSettings.offsetY || 0}px
                                            <input
                                                type="range"
                                                min="-1500"
                                                max="1500"
                                                value={currentFooterSettings.offsetY || 0}
                                                onChange={(e) => updateFooterSettings({ offsetY: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Rotation: {(currentFooterSettings.rotation || 0)}°
                                            <input
                                                type="range"
                                                min="-180"
                                                max="180"
                                                value={currentFooterSettings.rotation || 0}
                                                onChange={(e) => updateFooterSettings({ rotation: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </label>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}