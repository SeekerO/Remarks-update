"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useImageEditor } from "./ImageEditorContext";
import ModalPreview from "./ModalPreview";
import { MdDelete } from "react-icons/md";
import { FiDownload, FiMaximize2 } from "react-icons/fi";
import { useTemplateActions } from "./hooks/useTemplateActions";
import { applyPhotoAdjustments } from '../lib/utils/canvasFilters';
import { ExportOptions } from '../lib/types/watermark';
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { applyTextWatermark } from '../lib/utils/metadata';

interface SingleImageEditorProps {
    metadata: any;
    image: any;
    index: number;
    onCanvasReady: (index: number, getBlob: () => Promise<Blob | null>, canvas: HTMLCanvasElement) => void;
    exportOptions?: ExportOptions;
}

const calculatePosition = (
    position: string,
    imgWidth: number,
    imgHeight: number,
    logoWidth: number,
    logoHeight: number,
    paddingX: number,
    paddingY: number
): [number, number] => {
    switch (position) {
        case "top-left": return [paddingX, paddingY];
        case "top-center": return [(imgWidth - logoWidth) / 2, paddingY];
        case "top-right": return [imgWidth - logoWidth - paddingX, paddingY];
        case "bottom-left": return [paddingX, imgHeight - logoHeight - paddingY];
        case "bottom-center": return [(imgWidth - logoWidth) / 2, imgHeight - logoHeight - paddingY];
        case "bottom-right": return [imgWidth - logoWidth - paddingX, imgHeight - logoHeight - paddingY];
        default: return [paddingX, paddingY];
    }
};

const checkEdgeWarnings = (logos: any[]): boolean => {
    return logos.some(logo => {
        const { paddingX = 20, paddingY = 20 } = logo.settings || {};
        return paddingX <= 10 || paddingY <= 10;
    });
};

// ── Image cache ───────────────────────────────────────────────────────────────
const imageCache = new Map<string, HTMLImageElement>();

function loadImageCached(src: string): Promise<HTMLImageElement> {
    if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { imageCache.set(src, img); resolve(img); };
        img.onerror = reject;
        img.src = src;
    });
}

// ── Auto-fit footer calculation ───────────────────────────────────────────────
// Scales the footer so its width = 25% of the canvas width,
// then centers it horizontally and pins it flush to the bottom edge.
// The settings' offsetX / offsetY act as fine-tune nudges on top.
function calcAutoFitFooter(
    footerNaturalWidth: number,
    footerNaturalHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    settings: any
): { x: number; y: number; w: number; h: number } {
    // fitScale stored as 0–100 (percent), default 25
    const pct = (settings.fitScale ?? 25) / 100;
    const TARGET_WIDTH = canvasWidth * pct;
    const aspectRatio = footerNaturalHeight / footerNaturalWidth;
    const w = TARGET_WIDTH;
    const h = TARGET_WIDTH * aspectRatio;

    // Center horizontally, flush to bottom — then apply nudge offsets
    const offsetX = settings.offsetX ?? 0;
    const offsetY = settings.offsetY ?? 0;
    const x = (canvasWidth - w) / 2 + offsetX;
    const y = canvasHeight - h + offsetY;

    return { x, y, w, h };
}

export default function SingleImageEditor({
    image,
    index,
    onCanvasReady,
    exportOptions,
    metadata
}: SingleImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isRendering, setIsRendering] = useState(false);

    const renderLockRef = useRef(false);
    const pendingRedrawRef = useRef(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const drawAbortRef = useRef<AbortController | null>(null);

    const {
        globalShadowSettings,
        globalShadowTarget,
        images,
        setImages,
        selectedImageIndex,
        setSelectedImageIndex,
        globalLogos,
        globalFooters,
        globalPhotoAdjustments,
    } = useImageEditor();

    const [openPreview, setOpenPreview] = useState(false);
    const currentImage = images[index];
    const { saveTemplate } = useTemplateActions();

    const isSelected = selectedImageIndex === index;

    const photoAdjustmentsToUse = currentImage.useGlobalSettings
        ? globalPhotoAdjustments
        : (currentImage.photoAdjustments || globalPhotoAdjustments);

    const logosToRender = currentImage.useGlobalSettings
        ? globalLogos
        : (currentImage.individualLogos || []);

    const footersToRender = currentImage.useGlobalSettings
        ? globalFooters
        : (currentImage.individualFooters || []);

    const shadowSettingsToUse = currentImage.useGlobalSettings
        ? globalShadowSettings
        : currentImage.individualShadowSettings;

    const shadowTargetToUse = currentImage.useGlobalSettings
        ? globalShadowTarget
        : (currentImage.individualShadowSettings ? "whole-image" : "none");

    const hasEdgeWarning = checkEdgeWarnings(logosToRender);
    const isIndividualMode = !currentImage.useGlobalSettings;

    // ── Draw helpers ──────────────────────────────────────────────────────────

    const drawLogo = useCallback(async (
        ctx: CanvasRenderingContext2D,
        logoUrl: string,
        imgWidth: number,
        imgHeight: number,
        settings: any,
        signal: AbortSignal
    ) => {
        const logoImg = await loadImageCached(logoUrl);
        if (signal.aborted) return;
        const { position, width, height, paddingX, paddingY, opacity = 1, rotation = 0 } = settings;
        const [x, y] = calculatePosition(position, imgWidth, imgHeight, width, height, paddingX, paddingY);
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        ctx.save();
        ctx.globalAlpha = opacity;
        if (rotation !== 0) {
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }
        ctx.drawImage(logoImg, x, y, width, height);
        ctx.restore();
    }, []);

    const drawFooter = useCallback(async (
        ctx: CanvasRenderingContext2D,
        footerUrl: string,
        imgWidth: number,
        imgHeight: number,
        settings: any,
        shadowSettings: typeof globalShadowSettings | undefined,
        shadowTarget: "none" | "footer" | "whole-image",
        signal: AbortSignal
    ) => {
        const footerImg = await loadImageCached(footerUrl);
        if (signal.aborted) return;

        const { opacity = 1, rotation = 0, autoFit = true } = settings;

        let x: number, y: number, w: number, h: number;

        if (autoFit) {
            // ── Auto-fit: 25% canvas width, centered, bottom-pinned ──────────
            ({ x, y, w, h } = calcAutoFitFooter(
                footerImg.naturalWidth || footerImg.width,
                footerImg.naturalHeight || footerImg.height,
                imgWidth,
                imgHeight,
                settings
            ));
        } else {
            // ── Manual mode: legacy scale / offsetX / offsetY behaviour ──────
            const { scale = 1, offsetX = 0, offsetY = 0 } = settings;
            w = footerImg.width * scale;
            h = footerImg.height * scale;
            x = (imgWidth - w) / 2 + offsetX;
            y = imgHeight - h + offsetY;
        }

        if (w <= 0 || h <= 0) return;

        const centerX = x + w / 2;
        const centerY = y + h / 2;

        ctx.save();
        ctx.globalAlpha = opacity;
        if (rotation !== 0) {
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }
        if (shadowTarget === "footer" && shadowSettings) {
            ctx.shadowColor = shadowSettings.color;
            ctx.shadowBlur = shadowSettings.blur;
            ctx.shadowOffsetX = shadowSettings.offsetX;
            ctx.shadowOffsetY = shadowSettings.offsetY;
        }
        ctx.drawImage(footerImg, x, y, w, h);
        ctx.restore();
    }, []);

    const drawShadow = useCallback((
        ctx: CanvasRenderingContext2D,
        targetWidth: number,
        targetHeight: number,
        settings: typeof globalShadowSettings
    ) => {
        const { color, opacity, offsetX, offsetY, blur } = settings;
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = offsetX;
        ctx.shadowOffsetY = offsetY;
        ctx.globalAlpha = opacity;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.restore();
    }, []);

    // ── Core draw (abortable) ─────────────────────────────────────────────────

    const executeDraw = useCallback(async (signal: AbortSignal) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const baseImg = await loadImageCached(image.url).catch(() => null);
        if (!baseImg || signal.aborted) return;

        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (shadowTargetToUse === "whole-image" && shadowSettingsToUse) {
            drawShadow(ctx, canvas.width, canvas.height, shadowSettingsToUse);
        }
        ctx.drawImage(baseImg, 0, 0);
        if (signal.aborted) return;

        const imgWidth = baseImg.width;
        const imgHeight = baseImg.height;

        for (const l of logosToRender) {
            if (signal.aborted) return;
            await drawLogo(ctx, l.url, imgWidth, imgHeight, l.settings, signal);
        }

        for (const f of footersToRender) {
            if (signal.aborted) return;
            await drawFooter(ctx, f.url, imgWidth, imgHeight, f.settings, shadowSettingsToUse, shadowTargetToUse, signal);
        }

        

        if (signal.aborted) return;
        applyPhotoAdjustments(canvas, photoAdjustmentsToUse);

        if (signal.aborted) return;
          applyTextWatermark(canvas, metadata);
        onCanvasReady(
            index,
            async () => new Promise(resolve => canvas.toBlob(resolve, 'image/png')),
            canvas
        );
    }, [
        image.url, index,
        logosToRender, footersToRender,
        shadowSettingsToUse, shadowTargetToUse,
        photoAdjustmentsToUse,
        onCanvasReady, drawLogo, drawFooter, drawShadow,
    ]);

    // ── Render scheduler: debounce → lock → draw ──────────────────────────────

    const scheduleDraw = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            if (renderLockRef.current) {
                pendingRedrawRef.current = true;
                return;
            }

            const runDraw = async () => {
                drawAbortRef.current?.abort();
                const abortCtrl = new AbortController();
                drawAbortRef.current = abortCtrl;

                renderLockRef.current = true;
                setIsRendering(true);

                try {
                    await executeDraw(abortCtrl.signal);
                } finally {
                    renderLockRef.current = false;
                    if (pendingRedrawRef.current) {
                        pendingRedrawRef.current = false;
                        await runDraw();
                    } else {
                        setTimeout(() => setIsRendering(false), 120);
                    }
                }
            };

            await runDraw();
        }, 40);
    }, [executeDraw]);

    useEffect(() => {
        scheduleDraw();
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [scheduleDraw]);

    useEffect(() => {
        return () => {
            drawAbortRef.current?.abort();
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    if (!currentImage) return null;

    const downloadImage = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        saveTemplate();
        const link = document.createElement('a');
        link.download = `watermarked_${image.file.name}`;
        link.href = canvas.toDataURL(image.file.type);
        link.click();
    };

    const removeImage = () => {
        setImages((prevImages: any[]) => {
            const newImages = prevImages.filter((_, i) => i !== index);
            URL.revokeObjectURL(image.url);
            if (image.individualLogo) URL.revokeObjectURL(image.individualLogo);
            if (image.individualFooter) URL.revokeObjectURL(image.individualFooter);
            image.individualLogos?.forEach((l: any) => URL.revokeObjectURL(l.url));
            image.individualFooters?.forEach((f: any) => URL.revokeObjectURL(f.url));
            if (selectedImageIndex === index) setSelectedImageIndex(null);
            else if (selectedImageIndex !== null && index < selectedImageIndex) {
                setSelectedImageIndex(selectedImageIndex - 1);
            }
            return newImages;
        });
    };

    return (
        <div className={`relative group rounded-xl overflow-hidden transition-all duration-200
            ${isSelected
                ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-xl"
                : "ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-indigo-300 dark:hover:ring-indigo-700 shadow-md hover:shadow-lg"
            }`}
        >
            {/* Canvas */}
            <canvas ref={canvasRef} className="w-full h-auto block" />

            {/* Blur overlay during re-render */}
            <div
                className="absolute inset-0 z-10 rounded-xl pointer-events-none transition-all duration-150"
                style={{
                    backdropFilter: isRendering ? "blur(6px)" : "blur(0px)",
                    WebkitBackdropFilter: isRendering ? "blur(6px)" : "blur(0px)",
                    opacity: isRendering ? 1 : 0,
                }}
            />

            {isSelected && (
                <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
                    <div className="flex items-center gap-1">
                        <kbd className="flex items-center justify-center w-5 h-5 rounded bg-black/50 backdrop-blur-sm border border-white/20 text-white text-[9px] font-bold">←</kbd>
                        <kbd className="flex items-center justify-center w-5 h-5 rounded bg-black/50 backdrop-blur-sm border border-white/20 text-white text-[9px] font-bold">→</kbd>
                        <span className="text-[9px] text-white/60 ml-0.5 font-medium">navigate</span>
                    </div>
                </div>
            )}

            {/* Top-left status badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-20 pointer-events-none">
                {isSelected && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-md">
                        <CheckCircle2 className="w-3 h-3" />
                        Selected {index + 1}
                    </span>
                )}
                {isIndividualMode && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-md">
                        Individual
                    </span>
                )}
                {logosToRender.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 shadow-sm backdrop-blur-sm">
                        {logosToRender.length} Logo{logosToRender.length !== 1 ? 's' : ''}
                    </span>
                )}
                {footersToRender.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 shadow-sm backdrop-blur-sm">
                        {footersToRender.length} Footer{footersToRender.length !== 1 ? 's' : ''}
                        {footersToRender.some((f: any) => f.settings?.autoFit !== false) && (
                            <span className="ml-1 opacity-60">· auto</span>
                        )}
                    </span>
                )}
            </div>

            {/* Edge warning */}
            {hasEdgeWarning && (
                <div className="absolute top-2 right-2 z-20 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-md">
                        <AlertTriangle className="w-3 h-3" />
                        Edge
                    </span>
                </div>
            )}

            {/* Action buttons */}
            <div className={`absolute bottom-2 right-2 flex gap-1.5 z-10 transition-all duration-200
                ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); downloadImage(); }}
                    title="Download"
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all hover:scale-105"
                >
                    <FiDownload className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    title="Delete"
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-all hover:scale-105"
                >
                    <MdDelete className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setOpenPreview(true); }}
                    title="Preview"
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all hover:scale-105"
                >
                    <FiMaximize2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Selected footer strip */}
            {isSelected && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-indigo-400 via-indigo-600 to-purple-500 z-20" />
            )}

            <ModalPreview
                canvasRef={canvasRef}
                open={openPreview}
                onClose={setOpenPreview}
                modalCanvasId={`modal-canvas-${index}`}
                imageIndex={index}
            />
        </div>
    );
}