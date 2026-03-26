"use client";

import React, { useState, useRef, useEffect } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageControls from "./components/ImageControls";
import PreviewArea from "./components/PreviewArea";
import BreadCrumb from "../../component/not_using_breadcrumb";
import { ImageEditorProvider, useImageEditor } from "./components/ImageEditorContext";
import { MdDelete } from "react-icons/md";
import { useAuth } from "../../../lib/auth/AuthContext";
import Image from "next/image";
import Logo from "@/../public/Avexi.png"
import {
    Info, Upload, Layers, SlidersHorizontal,
    Undo2, Redo2, ChevronDown, X, Droplets,
    Sparkles, Shield
} from "lucide-react";
import PhotoAdjustments from "./components/PhotoAdjustments";
import { useKeyboardShortcuts } from "./components/hooks/useKeyboardShortcuts";

type TabId = "upload" | "watermark" | "adjust";

// ── Drag handle ───────────────────────────────────────────────────────────────
function DragHandle() {
    return (
        <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
        </div>
    );
}

// ── Mobile Bottom Sheet ───────────────────────────────────────────────────────
interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    snapPoints?: number[];
}

function BottomSheet({ open, onClose, children, snapPoints = [45, 100] }: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const [snapIndex, setSnapIndex] = useState(0);
    const [dragging, setDragging] = useState(false);
    const dragStartY = useRef(0);

    const currentHeight = snapPoints[snapIndex];

    const onTouchStart = (e: React.TouchEvent) => {
        setDragging(true);
        dragStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!dragging || !sheetRef.current) return;
        const dy = e.touches[0].clientY - dragStartY.current;
        const viewH = window.innerHeight;
        const newPct = currentHeight - (dy / viewH) * 100;
        sheetRef.current.style.height = `${Math.max(10, Math.min(95, newPct))}%`;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        setDragging(false);
        if (!sheetRef.current) return;
        const viewH = window.innerHeight;
        const dy = e.changedTouches[0].clientY - dragStartY.current;
        const movedPct = (dy / viewH) * 100;

        if (movedPct > 20) {
            if (snapIndex === 0) {
                onClose();
                sheetRef.current.style.height = `${snapPoints[0]}%`;
            } else {
                setSnapIndex(snapIndex - 1);
                sheetRef.current.style.height = `${snapPoints[snapIndex - 1]}%`;
            }
        } else if (movedPct < -15) {
            const nextSnap = Math.min(snapIndex + 1, snapPoints.length - 1);
            setSnapIndex(nextSnap);
            sheetRef.current.style.height = `${snapPoints[nextSnap]}%`;
        } else {
            sheetRef.current.style.height = `${snapPoints[snapIndex]}%`;
        }
    };

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
                className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Sheet */}
            <div
                ref={sheetRef}
                className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl shadow-2xl
                    bg-white dark:bg-[#0d0d1a]
                    border-t border-indigo-200 dark:border-indigo-500/20"
                style={{
                    height: `${currentHeight}%`,
                    transition: dragging ? "none" : "height 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <DragHandle />

                {/* Sheet header */}
                <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-xs font-semibold text-gray-400 dark:text-white/60 uppercase tracking-wider">
                            Editor Panel
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const next = (snapIndex + 1) % snapPoints.length;
                                setSnapIndex(next);
                                if (sheetRef.current) sheetRef.current.style.height = `${snapPoints[next]}%`;
                            }}
                            className="p-1.5 rounded-lg
                                bg-gray-100 border border-gray-200 text-gray-400 hover:text-gray-700
                                dark:bg-white/5 dark:border-white/10 dark:text-white/50 dark:hover:text-white/80
                                transition-colors"
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform ${snapIndex === snapPoints.length - 1 ? '' : 'rotate-180'}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg
                                bg-gray-100 border border-gray-200 text-gray-400 hover:text-red-500
                                dark:bg-white/5 dark:border-white/10 dark:text-white/50 dark:hover:text-red-400
                                transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
                    {children}
                </div>
            </div>
        </>
    );
}

// ── Mobile Tab Bar ────────────────────────────────────────────────────────────
interface MobileTabBarProps {
    tabs: { id: TabId; label: string; icon: React.ElementType; count?: number; countColor?: string }[];
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    onOpen: () => void;
    panelOpen: boolean;
}

function MobileTabBar({ tabs, activeTab, onTabChange, onOpen, panelOpen }: MobileTabBarProps) {
    return (
        <div className="fixed bottom-14 w-full right-0 z-30
            bg-white/95 dark:bg-[#0d0d1a]/95 backdrop-blur-md
            border-t border-indigo-100 dark:border-indigo-500/20 safe-area-bottom">
            <div className="flex items-center h-16">
                {tabs.map(({ id, label, icon: Icon, count, countColor }) => {
                    const isActive = activeTab === id && panelOpen;
                    return (
                        <button
                            key={id}
                            onClick={() => { onTabChange(id); onOpen(); }}
                            className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors relative
                                ${isActive
                                    ? "text-indigo-500 dark:text-indigo-400"
                                    : "text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/70"
                                }`}
                        >
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
        </div>
    );
}

// ── Desktop Tab Button ────────────────────────────────────────────────────────
function DesktopTab({
    id, label, icon: Icon, count, countColor, active, onClick
}: {
    id: string; label: string; icon: React.ElementType;
    count?: number; countColor?: string; active: boolean; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-semibold transition-all duration-200
                ${active
                    ? "bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.1)] dark:shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                    : "text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/70 border border-transparent hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
        >
            <div className="relative mb-1">
                <Icon className="w-4 h-4" />
                {count !== undefined && count > 0 && (
                    <span className={`absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${countColor}`}>
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </div>
            {label}
            {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
            )}
        </button>
    );
}

// ── Privacy Badge ─────────────────────────────────────────────────────────────
function PrivacyBadge() {
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg
            bg-indigo-50 border border-indigo-200
            dark:bg-indigo-500/10 dark:border-indigo-500/20">
            <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300/80 leading-snug">
                <span className="font-semibold text-indigo-600 dark:text-indigo-300">100% client-side.</span>{" "}
                Your images never leave your device.
            </p>
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
    const [sheetOpen, setSheetOpen] = useState(false);

    useKeyboardShortcuts({ onUndo: undo, onRedo: redo });

    const uploadCount = images.length;
    const watermarkCount = globalLogos.length + globalFooters.length;

    const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;
    const activeAdjustments = selectedImage?.useGlobalSettings
        ? globalPhotoAdjustments
        : (selectedImage?.photoAdjustments || globalPhotoAdjustments);
    const adjustCount = Object.values(activeAdjustments).filter(v => v !== 0).length;

    const TABS: {
        id: TabId; label: string; icon: React.ElementType;
        count?: number; countColor?: string;
    }[] = [
            { id: "upload", label: "Upload", icon: Upload, count: uploadCount, countColor: "bg-indigo-500" },
            { id: "watermark", label: "Watermark", icon: Layers, count: watermarkCount || undefined, countColor: "bg-violet-500" },
            { id: "adjust", label: "Adjust", icon: SlidersHorizontal, count: adjustCount || undefined, countColor: "bg-amber-500" },
        ];

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
                        <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                                <Layers className="w-7 h-7 text-violet-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600 dark:text-white/70">No watermarks yet</p>
                            <p className="text-xs text-gray-400 dark:text-white/30 mt-1 max-w-[200px]">
                                Upload images first, then add logos and footers here.
                            </p>
                            <button
                                onClick={() => setActiveTab("upload")}
                                className="mt-5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                            >
                                Go to Upload
                            </button>
                        </div>
                    ) : watermarkCount === 0 && images.length > 0 ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-lg">
                                <p className="text-xs text-violet-700 dark:text-violet-300">
                                    💡 Switch to <strong>Upload</strong> to add logos and footers, then control them here.
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
                        <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                <SlidersHorizontal className="w-7 h-7 text-amber-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600 dark:text-white/70">No images to adjust</p>
                            <p className="text-xs text-gray-400 dark:text-white/30 mt-1 max-w-[200px]">
                                Upload images first to use photo adjustments.
                            </p>
                            <button
                                onClick={() => setActiveTab("upload")}
                                className="mt-5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
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

    return (
        <div className="min-h-full overflow-y-auto font-sans w-full bg-gray-50 dark:bg-gray-950">

            {/* ── DESKTOP layout (lg+) ─────────────────────────────────────────── */}
            <div className="hidden lg:flex h-screen overflow-hidden w-full">

                {/* ── Editor Sidebar ── */}
                <div className="w-[320px] flex-shrink-0 h-screen flex flex-col
                        bg-white dark:bg-[#0d0d1a]
                        border-r border-gray-200 dark:border-l dark:border-white/[0.06]
                        shadow-xl relative overflow-hidden">

                    {/* Radial glow — dark only */}
                    <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 rounded-full opacity-0 dark:opacity-30"
                        style={{ background: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.4) 0%, transparent 60%)" }} />
                    <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-0 dark:opacity-20"
                        style={{ background: "radial-gradient(circle at 0% 100%, rgba(99,102,241,0.3) 0%, transparent 60%)" }} />

                    {/* Header */}
                    <div className="px-5 pt-5 pb-4 border-b border-gray-200 dark:border-white/[0.06] relative z-10 flex-shrink-0">
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
                                    <Droplets className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h1 className="font-syne text-lg font-extrabold tracking-tight text-gray-900 dark:text-transparent dark:bg-clip-text">
                                        Watermark
                                    </h1>
                                    <p className="text-[10px] text-gray-400 dark:text-white/30 tracking-wider uppercase">Editor</p>
                                </div>
                            </div>
                            {images.length > 0 && (
                                <button
                                    onClick={removeAllImages}
                                    title="Remove all images"
                                    className="flex items-center justify-center w-7 h-7 rounded-lg
                                            bg-red-50 border border-red-200 hover:bg-red-100 text-red-500 hover:text-red-600
                                            dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20 dark:text-red-400 dark:hover:text-red-300
                                            transition-all"
                                >
                                    <MdDelete className="text-sm" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Privacy badge */}
                    <div className="px-4 pt-3 pb-0 flex-shrink-0 relative z-10">
                        <PrivacyBadge />
                    </div>

                    {/* Desktop Tab Bar */}
                    <div className="flex mt-3 mx-4
                            bg-gray-100 dark:bg-white/[0.04]
                            border border-gray-200 dark:border-white/[0.06]
                            rounded-xl p-1 gap-1 flex-shrink-0 relative z-10">
                        {TABS.map((tab) => (
                            <DesktopTab
                                key={tab.id}
                                id={tab.id}
                                label={tab.label}
                                icon={tab.icon}
                                count={tab.count}
                                countColor={tab.countColor}
                                active={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            />
                        ))}
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative z-10
                            [&::-webkit-scrollbar]:w-1
                            [&::-webkit-scrollbar-track]:bg-transparent
                            [&::-webkit-scrollbar-thumb]:bg-gray-200
                            dark:[&::-webkit-scrollbar-thumb]:bg-white/10
                            [&::-webkit-scrollbar-thumb]:rounded-full">
                        {renderTabContent()}
                    </div>

                    {/* Undo / Redo footer */}
                    {images.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-white/[0.06] flex items-center gap-2 flex-shrink-0 relative z-10">
                            <button
                                onClick={undo}
                                disabled={!canUndo}
                                title="Undo (Ctrl+Z)"
                                className="flex items-center gap-1.5 flex-1 justify-center py-2 text-xs font-semibold rounded-lg
                                        bg-gray-100 border border-gray-200 text-gray-500
                                        hover:bg-gray-200 hover:text-gray-800
                                        dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white/50
                                        dark:hover:bg-white/[0.08] dark:hover:text-white/80
                                        disabled:opacity-30 disabled:cursor-not-allowed
                                        transition-all duration-150"
                            >
                                <Undo2 className="w-3.5 h-3.5" />
                                Undo
                            </button>
                            <button
                                onClick={redo}
                                disabled={!canRedo}
                                title="Redo (Ctrl+Shift+Z)"
                                className="flex items-center gap-1.5 flex-1 justify-center py-2 text-xs font-semibold rounded-lg
                                        bg-gray-100 border border-gray-200 text-gray-500
                                        hover:bg-gray-200 hover:text-gray-800
                                        dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white/50
                                        dark:hover:bg-white/[0.08] dark:hover:text-white/80
                                        disabled:opacity-30 disabled:cursor-not-allowed
                                        transition-all duration-150"
                            >
                                Redo
                                <Redo2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Version */}
                    <div className="px-4 pb-3 flex items-center gap-1.5 relative z-10">
                        <Image src={Logo} alt="Avexi" width={14} />
                        <span className="text-[10px] text-gray-400 dark:text-white/20 tracking-wider">Avexi · Watermark v5</span>
                    </div>
                </div>

                {/* ── Right: Preview area ── */}
                <div className="flex-1 overflow-auto h-screen w-full bg-gray-50 dark:bg-[#0a0a12]">
                    <PreviewArea />
                </div>
            </div>

            {/* ── MOBILE layout (< lg) ─────────────────────────────────────────── */}
            <div className="lg:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0a0a12] w-full">

                {/* Mobile top bar */}
                <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3
                        bg-white/95 dark:bg-[#0d0d1a]/95 backdrop-blur-md
                        border-b border-indigo-100 dark:border-indigo-500/20 shadow-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg
                                bg-indigo-100 border border-indigo-200
                                dark:bg-indigo-600/20 dark:border-indigo-500/30
                                flex items-center justify-center flex-shrink-0">
                            <Droplets className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                                Watermark Editor
                            </h1>
                            <div className="flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400" />
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Client-Side</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {images.length > 0 && (
                            <>
                                <button
                                    onClick={undo}
                                    disabled={!canUndo}
                                    className="p-2 rounded-lg
                                            bg-gray-100 border border-gray-200 text-gray-400 disabled:opacity-30
                                            hover:text-gray-700 dark:bg-white/5 dark:border-white/10
                                            dark:text-white/50 dark:hover:text-white/80 transition-colors"
                                >
                                    <Undo2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={!canRedo}
                                    className="p-2 rounded-lg
                                            bg-gray-100 border border-gray-200 text-gray-400 disabled:opacity-30
                                            hover:text-gray-700 dark:bg-white/5 dark:border-white/10
                                            dark:text-white/50 dark:hover:text-white/80 transition-colors"
                                >
                                    <Redo2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={removeAllImages}
                                    className="p-2 rounded-lg
                                            bg-red-50 border border-red-200 text-red-500 hover:text-red-600
                                            dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 dark:hover:text-red-300
                                            transition-colors"
                                >
                                    <MdDelete className="text-base" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Preview — padded for tab bar */}
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
                    <div className="flex
                            bg-gray-100 dark:bg-white/[0.04]
                            border border-gray-200 dark:border-white/[0.06]
                            rounded-xl p-1 gap-1 flex-shrink-0">
                        {TABS.map((tab) => (
                            <DesktopTab
                                key={tab.id}
                                id={tab.id}
                                label={tab.label}
                                icon={tab.icon}
                                count={tab.count}
                                countColor={tab.countColor}
                                active={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            />
                        ))}
                    </div>
                    {renderTabContent()}
                </BottomSheet>

                {/* Mobile Tab Bar */}
                <div className="relative w-full">
                    <MobileTabBar
                        tabs={TABS}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onOpen={() => setSheetOpen(true)}
                        panelOpen={sheetOpen}
                    />
                </div>
            </div>

        </div >
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