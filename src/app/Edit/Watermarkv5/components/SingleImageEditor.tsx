"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useImageEditor } from "./ImageEditorContext";
import ModalPreview from "./ModalPreview";
import { MdDelete } from "react-icons/md";
import { FiDownload, FiMaximize2 } from "react-icons/fi";
import { useTemplateActions } from "../components/hooks/useTemplateActions";
import { applyPhotoAdjustments } from '../lib/utils/canvasFilters';
import { ExportOptions } from '../lib/types/watermark';
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface SingleImageEditorProps {
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

// Check if any logo is dangerously close to an edge
const checkEdgeWarnings = (logos: any[]): boolean => {
    return logos.some(logo => {
        const { paddingX = 20, paddingY = 20 } = logo.settings || {};
        return paddingX <= 10 || paddingY <= 10;
    });
};

export default function SingleImageEditor({
    image,
    index,
    onCanvasReady,
    exportOptions,
}: SingleImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isRendering, setIsRendering] = useState(false);

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

    const drawLogo = useCallback((
        ctx: CanvasRenderingContext2D,
        logoUrl: string,
        imgWidth: number,
        imgHeight: number,
        settings: any
    ) => {
        const logoImg = new Image();
        logoImg.src = logoUrl;
        return new Promise<void>(resolve => {
            logoImg.onload = () => {
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
                resolve();
            };
            logoImg.onerror = () => resolve();
        });
    }, []);

    const drawFooter = useCallback((
        ctx: CanvasRenderingContext2D,
        footerUrl: string,
        imgWidth: number,
        imgHeight: number,
        settings: any,
        shadowSettings: typeof globalShadowSettings | undefined,
        shadowTarget: "none" | "footer" | "whole-image"
    ) => {
        const footerImg = new Image();
        footerImg.src = footerUrl;
        return new Promise<void>(resolve => {
            footerImg.onload = () => {
                const { opacity = 1, scale = 1, offsetX = 0, offsetY = 0, rotation = 0 } = settings;
                const scaledWidth = footerImg.width * scale;
                const scaledHeight = footerImg.height * scale;
                const x = (imgWidth - scaledWidth) / 2 + offsetX;
                const y = imgHeight - scaledHeight + offsetY;
                const centerX = x + scaledWidth / 2;
                const centerY = y + scaledHeight / 2;

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
                if (scaledWidth > 0 && scaledHeight > 0) {
                    ctx.drawImage(footerImg, x, y, scaledWidth, scaledHeight);
                }
                ctx.restore();
                resolve();
            };
            footerImg.onerror = () => resolve();
        });
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

    // ── Main render effect ────────────────────────────────────────────────────

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const baseImg = new Image();
        baseImg.src = image.url;

        const draw = async () => {
            setIsRendering(true);

            await new Promise<void>(resolve => {
                baseImg.onload = () => {
                    canvas.width = baseImg.width;
                    canvas.height = baseImg.height;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    if (shadowTargetToUse === "whole-image" && shadowSettingsToUse) {
                        drawShadow(ctx, canvas.width, canvas.height, shadowSettingsToUse);
                    }
                    ctx.drawImage(baseImg, 0, 0);
                    resolve();
                };
                baseImg.onerror = () => { setIsRendering(false); resolve(); };
            });

            if (baseImg.complete && baseImg.naturalWidth > 0) {
                const imgWidth = baseImg.width;
                const imgHeight = baseImg.height;

                await Promise.all(
                    logosToRender.map((l: any) =>
                        drawLogo(ctx, l.url, imgWidth, imgHeight, l.settings)
                    )
                );
                await Promise.all(
                    footersToRender.map((f: any) =>
                        drawFooter(ctx, f.url, imgWidth, imgHeight, f.settings, shadowSettingsToUse, shadowTargetToUse)
                    )
                );

                applyPhotoAdjustments(canvas, photoAdjustmentsToUse);
            }

            onCanvasReady(
                index,
                async () => new Promise(resolve => canvas.toBlob(resolve, 'image/png')),
                canvas
            );

            setTimeout(() => setIsRendering(false), 300);
        };

        draw();
    }, [
        image.url, index, logosToRender, footersToRender,
        shadowSettingsToUse, shadowTargetToUse, photoAdjustmentsToUse,
        onCanvasReady, drawLogo, drawFooter, drawShadow,
    ]);

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
            <canvas
                ref={canvasRef}
                className="w-full h-auto block"
            />

            {/* Rendering spinner */}
            {isRendering && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {isSelected && (
                <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
                    <div className="flex items-center gap-1">
                        <kbd className="flex items-center justify-center w-5 h-5 rounded bg-black/50 backdrop-blur-sm border border-white/20 text-white text-[9px] font-bold">
                            ←
                        </kbd>
                        <kbd className="flex items-center justify-center w-5 h-5 rounded bg-black/50 backdrop-blur-sm border border-white/20 text-white text-[9px] font-bold">
                            →
                        </kbd>
                        <span className="text-[9px] text-white/60 ml-0.5 font-medium">
                            navigate
                        </span>
                    </div>
                </div>
            )}

            {/* ── Top-left status badges ── */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-20 pointer-events-none">
                {/* Selected indicator */}



                {isSelected && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-md">
                        <CheckCircle2 className="w-3 h-3" />
                        Selected   {index + 1}
                    </span>
                )}

                {/* Individual mode indicator */}
                {isIndividualMode && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-md">
                        Individual
                    </span>
                )}

                {/* Logo count */}
                {logosToRender.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 shadow-sm backdrop-blur-sm">
                        {logosToRender.length} Logo{logosToRender.length !== 1 ? 's' : ''}
                    </span>
                )}

                {/* Footer count */}
                {footersToRender.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 shadow-sm backdrop-blur-sm">
                        {footersToRender.length} Footer{footersToRender.length !== 1 ? 's' : ''}
                    </span>
                )}

            </div>

            {/* ── Edge warning badge — top right, always visible ── */}
            {hasEdgeWarning && (
                <div className="absolute top-2 right-2 z-20 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-md">
                        <AlertTriangle className="w-3 h-3" />
                        Edge
                    </span>
                </div>
            )}

            {/* ── Action buttons — fade in on hover ── */}
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

            {/* ── Selected footer strip ── */}
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