"use client";

import React, { useState, useRef, useEffect } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageControls from "./components/ImageControls";
import PreviewArea from "./components/PreviewArea";
import BreadCrumb from "../../component/breadcrumb";
import { ImageEditorProvider, useImageEditor } from "./components/ImageEditorContext";
import { MdDelete } from "react-icons/md";
import { useAuth } from "../../Chat/AuthContext";
import {
    Info, Upload, Layers, SlidersHorizontal,
    Undo2, Redo2, ChevronDown, PanelLeftOpen, X
} from "lucide-react";
import PhotoAdjustments from "./components/PhotoAdjustments";
import { useKeyboardShortcuts } from "./components/hooks/useKeyboardShortcuts";

type TabId = "upload" | "watermark" | "adjust";

// ── Drag handle for the bottom sheet ──────────────────────────────────────────
function DragHandle() {
    return (
        <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
    );
}

// ── Mobile Bottom Sheet ───────────────────────────────────────────────────────
interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    snapPoints?: number[]; // percentages of viewport height e.g. [40, 85]
}

function BottomSheet({ open, onClose, children, snapPoints = [45, 88] }: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const [snapIndex, setSnapIndex] = useState(0);
    const [dragging, setDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartSnap = useRef(0);

    const currentHeight = snapPoints[snapIndex];

    // Drag to resize / dismiss
    const onTouchStart = (e: React.TouchEvent) => {
        setDragging(true);
        dragStartY.current = e.touches[0].clientY;
        dragStartSnap.current = snapIndex;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!dragging || !sheetRef.current) return;
        const dy = e.touches[0].clientY - dragStartY.current;
        const viewH = window.innerHeight;
        const currentPct = snapPoints[snapIndex];
        const newPct = currentPct - (dy / viewH) * 100;
        // Live-resize the sheet
        sheetRef.current.style.height = `${Math.max(10, Math.min(95, newPct))}%`;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        setDragging(false);
        if (!sheetRef.current) return;
        const viewH = window.innerHeight;
        const dy = e.changedTouches[0].clientY - dragStartY.current;
        const movedPct = (dy / viewH) * 100;

        if (movedPct > 20) {
            // Swiped down significantly — dismiss or snap down
            if (snapIndex === 0) {
                onClose();
                sheetRef.current.style.height = `${snapPoints[0]}%`;
            } else {
                setSnapIndex(snapIndex - 1);
                sheetRef.current.style.height = `${snapPoints[snapIndex - 1]}%`;
            }
        } else if (movedPct < -15) {
            // Swiped up — expand
            const nextSnap = Math.min(snapIndex + 1, snapPoints.length - 1);
            setSnapIndex(nextSnap);
            sheetRef.current.style.height = `${snapPoints[nextSnap]}%`;
        } else {
            // Snap back to current
            sheetRef.current.style.height = `${snapPoints[snapIndex]}%`;
        }
    };

    // Reset to first snap when opened
    useEffect(() => {
        if (open) {
            setSnapIndex(0);
            if (sheetRef.current) sheetRef.current.style.height = `${snapPoints[0]}%`;
        }
    }, [open]);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
                onClick={onClose}
            />
            {/* Sheet */}
            <div
                ref={sheetRef}
                className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl shadow-2xl
                    bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
                style={{
                    height: `${currentHeight}%`,
                    transition: dragging ? "none" : "height 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                    willChange: "height",
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <DragHandle />

                {/* Header inside sheet */}
                <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Editor Panel</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const next = (snapIndex + 1) % snapPoints.length;
                                setSnapIndex(next);
                                if (sheetRef.current) sheetRef.current.style.height = `${snapPoints[next]}%`;
                            }}
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500"
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform ${snapIndex === snapPoints.length - 1 ? 'rotate-180' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
                    {children}
                </div>
            </div>
        </>
    );
}

// ── Mobile Tab Bar (fixed at bottom) ─────────────────────────────────────────
interface MobileTabBarProps {
    tabs: { id: TabId; label: string; icon: React.ElementType; count?: number; countColor?: string }[];
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    onOpen: () => void;
    panelOpen: boolean;
}

function MobileTabBar({ tabs, activeTab, onTabChange, onOpen, panelOpen }: MobileTabBarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
            <div className="flex items-center h-16">
                {tabs.map(({ id, label, icon: Icon, count, countColor }) => {
                    const isActive = activeTab === id && panelOpen;
                    return (
                        <button
                            key={id}
                            onClick={() => {
                                onTabChange(id);
                                onOpen();
                            }}
                            className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors relative
                                ${isActive
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-b-full bg-indigo-500" />
                            )}
                            <div className="relative">
                                <Icon className="w-5 h-5" />
                                {count !== undefined && count > 0 && (
                                    <span className={`absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${countColor}`}>
                                        {count > 99 ? "99+" : count}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-semibold">{label}</span>
                        </button>
                    );
                })}
            </div>
            {/* Safe area spacer for phones with home indicator */}
            <div className="h-safe-area-inset-bottom" />
        </div>
    );
}

// ── Main Page Content ─────────────────────────────────────────────────────────
function WatermarkPageContent() {
    const {
        images,
        removeAllImages,
        undo,
        redo,
        canUndo,
        canRedo,
        globalLogos,
        globalFooters,
        selectedImageIndex,
        globalPhotoAdjustments,
    } = useImageEditor();

    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabId>("upload");

    // Mobile sheet state
    const [sheetOpen, setSheetOpen] = useState(false);

    useKeyboardShortcuts({
        onUndo: undo,
        onRedo: redo,
    });

    const uploadCount = images.length;
    const watermarkCount = globalLogos.length + globalFooters.length;

    const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;
    const activeAdjustments = selectedImage?.useGlobalSettings
        ? globalPhotoAdjustments
        : (selectedImage?.photoAdjustments || globalPhotoAdjustments);
    const adjustCount = Object.values(activeAdjustments).filter(v => v !== 0).length;

    const TABS: {
        id: TabId;
        label: string;
        icon: React.ElementType;
        count?: number;
        countColor?: string;
    }[] = [
            { id: "upload", label: "Upload", icon: Upload, count: uploadCount, countColor: "bg-indigo-500" },
            { id: "watermark", label: "Watermark", icon: Layers, count: watermarkCount || undefined, countColor: "bg-purple-500" },
            { id: "adjust", label: "Adjust", icon: SlidersHorizontal, count: adjustCount || undefined, countColor: "bg-amber-500" },
        ];

    // ── Tab content (shared between sidebar and sheet) ────────────────────────
    const renderTabContent = () => (
        <>
            {activeTab === "upload" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <ImageUploader />
                </div>
            )}

            {activeTab === "watermark" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {watermarkCount === 0 && images.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                                <Layers className="w-7 h-7 text-purple-500" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No watermarks yet</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px]">
                                Upload images first, then add logos and footers here.
                            </p>
                            <button
                                onClick={() => setActiveTab("upload")}
                                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                            >
                                Go to Upload
                            </button>
                        </div>
                    ) : watermarkCount === 0 && images.length > 0 ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                    💡 Switch to the <strong>Upload</strong> tab to add logos and footers, then come back here to control their settings.
                                </p>
                            </div>
                            <ImageControls />
                        </div>
                    ) : (
                        <ImageControls />
                    )}
                </div>
            )}

            {activeTab === "adjust" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {images.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                                <SlidersHorizontal className="w-7 h-7 text-amber-500" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No images to adjust</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px]">
                                Upload some images first to use photo adjustments.
                            </p>
                            <button
                                onClick={() => setActiveTab("upload")}
                                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                            >
                                Go to Upload
                            </button>
                        </div>
                    ) : (
                        <PhotoAdjustments />
                    )}
                </div>
            )}
        </>
    );

    if (user && (user as any)?.canChat === true)
        return (
            <div className="min-h-screen font-sans w-full bg-gray-50 dark:bg-gray-950">

                {/* ── DESKTOP: Side-by-side layout (lg+) ───────────────────────────── */}
                <div className="hidden lg:flex h-screen overflow-hidden w-full">

                    {/* Left Sidebar */}
                    <div className="w-[340px] flex-shrink-0 h-screen flex flex-col border-r border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900">

                        <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                            <BreadCrumb />
                            <div className="flex items-center justify-between mt-3">
                                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                    Watermark Editor
                                </h1>
                                {images.length > 0 && (
                                    <button
                                        onClick={removeAllImages}
                                        title="Remove all images"
                                        className="flex items-center justify-center w-7 h-7 bg-red-100 dark:bg-red-900/30 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all duration-200"
                                    >
                                        <MdDelete className="text-sm" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mx-4 mt-3 px-3 py-2 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-snug">
                                <strong>100% Client-Side.</strong> Your images never leave your device.
                            </p>
                        </div>

                        {/* Desktop Tab Bar */}
                        <div className="flex mt-3 mx-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
                            {TABS.map(({ id, label, icon: Icon, count, countColor }) => {
                                const isActive = activeTab === id;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive
                                            ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                            }`}
                                    >
                                        <div className="relative">
                                            <Icon className="w-4 h-4 mb-0.5" />
                                            {count !== undefined && count > 0 && (
                                                <span className={`absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${countColor}`}>
                                                    {count > 99 ? "99+" : count}
                                                </span>
                                            )}
                                        </div>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            {renderTabContent()}
                        </div>

                        {images.length > 0 && (
                            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                                <button
                                    onClick={undo}
                                    disabled={!canUndo}
                                    title="Undo (Ctrl+Z)"
                                    className="flex items-center gap-1.5 flex-1 justify-center py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-200"
                                >
                                    <Undo2 className="w-3.5 h-3.5" />
                                    Undo
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={!canRedo}
                                    title="Redo (Ctrl+Shift+Z)"
                                    className="flex items-center gap-1.5 flex-1 justify-center py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-200"
                                >
                                    Redo
                                    <Redo2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel */}
                    <div className="flex-1 overflow-auto h-screen">
                        <PreviewArea />
                    </div>
                </div>

                {/* ── MOBILE: Full-width preview + bottom sheet (< lg) ─────────────── */}
                <div className="lg:hidden flex flex-col min-h-screen">

                    {/* Mobile top bar */}
                    <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3
                        bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
                        border-b border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="min-w-0">
                                <h1 className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">
                                    Watermark Editor
                                </h1>
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                    🔒 100% Client-Side
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Undo / Redo on mobile */}
                            {images.length > 0 && (
                                <>
                                    <button
                                        onClick={undo}
                                        disabled={!canUndo}
                                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-200"
                                    >
                                        <Undo2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={redo}
                                        disabled={!canRedo}
                                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-200"
                                    >
                                        <Redo2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={removeAllImages}
                                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500"
                                    >
                                        <MdDelete className="text-base" />
                                    </button>
                                </>
                            )}

                            {/* Open panel button */}
                            <button
                                onClick={() => { setSheetOpen(true); }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                            >
                                <PanelLeftOpen className="w-4 h-4" />
                                Tools
                            </button>
                        </div>
                    </div>

                    {/* Preview area — full width, padded bottom for tab bar */}
                    <div className="flex-1 pb-20">
                        <PreviewArea />
                    </div>

                    {/* Bottom Sheet */}
                    <BottomSheet
                        open={sheetOpen}
                        onClose={() => setSheetOpen(false)}
                        snapPoints={[48, 88]}
                    >
                        {/* Tab switcher inside sheet */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 flex-shrink-0">
                            {TABS.map(({ id, label, icon: Icon, count, countColor }) => {
                                const isActive = activeTab === id;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive
                                            ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-gray-500 dark:text-gray-400"
                                            }`}
                                    >
                                        <div className="relative">
                                            <Icon className="w-4 h-4 mb-0.5" />
                                            {count !== undefined && count > 0 && (
                                                <span className={`absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${countColor}`}>
                                                    {count > 99 ? "99+" : count}
                                                </span>
                                            )}
                                        </div>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab content */}
                        {renderTabContent()}
                    </BottomSheet>

                    {/* Fixed Mobile Tab Bar */}
                    <MobileTabBar
                        tabs={TABS}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onOpen={() => setSheetOpen(true)}
                        panelOpen={sheetOpen}
                    />
                </div>
            </div>
        );
}

function WatermarkPage() {
    return (
        <ImageEditorProvider>
            <WatermarkPageContent />
        </ImageEditorProvider>
    );
}

export default WatermarkPage;