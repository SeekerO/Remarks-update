// app/components/SingleImageEditor.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useImageEditor } from "./ImageEditorContext";
import ModalPreview from "./ModalPreview";
import { MdDelete } from "react-icons/md";
import { FiDownload, FiMaximize2 } from "react-icons/fi";
import { useTemplateActions } from "../components/hooks/useTemplateActions";

interface SingleImageEditorProps {
    image: any;
    index: number;
    onCanvasReady: (index: number, getBlob: () => Promise<Blob | null>) => void;
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
    let x = 0;
    let y = 0;

    switch (position) {
        case "top-left":
            x = paddingX;
            y = paddingY;
            break;
        case "top-center":
            x = (imgWidth - logoWidth) / 2;
            y = paddingY;
            break;
        case "top-right":
            x = imgWidth - logoWidth - paddingX;
            y = paddingY;
            break;
        case "bottom-left":
            x = paddingX;
            y = imgHeight - logoHeight - paddingY;
            break;
        case "bottom-center":
            x = (imgWidth - logoWidth) / 2;
            y = imgHeight - logoHeight - paddingY;
            break;
        case "bottom-right":
            x = imgWidth - logoWidth - paddingX;
            y = imgHeight - logoHeight - paddingY;
            break;
        default:
            x = paddingX;
            y = paddingY;
    }
    return [x, y];
};

export default function SingleImageEditor({ image, index, onCanvasReady }: SingleImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        // Removed: footer, globalFooterSettings (now handled by globalFooters state)
        globalShadowSettings,
        globalShadowTarget,
        images,
        setImages,
        selectedImageIndex,
        setSelectedImageIndex,
        globalLogos,
        globalFooters,
    } = useImageEditor();

    const [openPreview, setOpenPreview] = useState<boolean>(false);
    const currentImage = images[index];
    const { saveTemplate } = useTemplateActions();

    // Safety check - if image doesn't exist, don't render
    if (!currentImage) {
        return null;
    }

    // Determine which logos to use
    const logosToRender = currentImage.useGlobalSettings
        ? globalLogos
        : (currentImage.individualLogos || []);

    // Determine which footers to use
    const footersToRender = currentImage.useGlobalSettings
        ? globalFooters
        : (currentImage.individualFooters || []);

    // Removed: footerToUse and footerSettingsToUse (now derived from footersToRender loop)
    const shadowSettingsToUse = currentImage.useGlobalSettings ? globalShadowSettings : currentImage.individualShadowSettings;
    const shadowTargetToUse = currentImage.useGlobalSettings
        ? globalShadowTarget
        : (currentImage.individualShadowSettings ? "whole-image" : "none");

    // Draw a single logo
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

                // Apply rotation
                if (rotation !== 0) {
                    ctx.translate(centerX, centerY);
                    ctx.rotate(rotation * Math.PI / 180);
                    ctx.translate(-centerX, -centerY);
                }

                ctx.drawImage(logoImg, x, y, width, height);
                ctx.restore();
                resolve();
            };
            logoImg.onerror = () => {
                console.error("Failed to load logo image:", logoUrl);
                resolve();
            };
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
                // FIX IS HERE: Added default values for opacity and scale
                const {
                    opacity = 1,
                    scale = 1, // <--- **CRITICAL FIX**: Default scale to 1 
                    offsetX,
                    offsetY,
                    rotation = 0
                } = settings;

                const scaledWidth = footerImg.width * scale;
                const scaledHeight = footerImg.height * scale;

                // Footer is correctly anchored to the bottom edge
                const x = (imgWidth - scaledWidth) / 2 + offsetX;
                const y = imgHeight - scaledHeight + offsetY;

                const centerX = x + scaledWidth / 2;
                const centerY = y + scaledHeight / 2;

                ctx.save();
                ctx.globalAlpha = opacity;

                // Apply rotation
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

                // If scaledWidth or scaledHeight is 0 or NaN, nothing is drawn.
                if (scaledWidth > 0 && scaledHeight > 0) {
                    ctx.drawImage(footerImg, x, y, scaledWidth, scaledHeight);
                } else {
                    console.warn("Footer image skipped due to zero or invalid dimensions (check scale setting).");
                }

                ctx.restore();
                resolve();
            };
            footerImg.onerror = () => {
                console.error("Failed to load footer image:", footerUrl);
                // Fallback for image loading failure
                resolve();
            };
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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const baseImg = new Image(); // Renamed to baseImg for clarity
        baseImg.src = image.url;

        const drawImageAndWatermarks = async () => {
            // STEP 1: Load and Draw the Base Image (Guaranteed first)
            await new Promise<void>((resolve, reject) => {
                baseImg.onload = () => {
                    canvas.width = baseImg.width;
                    canvas.height = baseImg.height;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Handle Shadow for WHOLE-IMAGE target FIRST
                    if (shadowTargetToUse === "whole-image" && shadowSettingsToUse) {
                        drawShadow(ctx, canvas.width, canvas.height, shadowSettingsToUse);
                    }

                    // Draw the base image (over the whole-image shadow if present)
                    ctx.drawImage(baseImg, 0, 0);

                    resolve();
                };
                baseImg.onerror = (e) => {
                    console.error("Failed to load base image:", image.url, e);
                    // Crucial: Resolve the promise even on error to unblock the rest of the drawing
                    resolve();
                };
            });

            // If base image failed to load, nothing else can be drawn, but the promise is resolved, so we proceed
            if (baseImg.complete && baseImg.naturalWidth > 0) {
                const imgWidth = baseImg.width;
                const imgHeight = baseImg.height;

                // STEP 2: Draw all Logos (Awaited concurrently)
                await Promise.all(
                    logosToRender.map((logoItem: any) =>
                        drawLogo(ctx, logoItem.url, imgWidth, imgHeight, logoItem.settings)
                    )
                );

                // STEP 3: Draw all Footers (Awaited concurrently)
                await Promise.all(
                    footersToRender.map((footerItem: any) =>
                        drawFooter(
                            ctx,
                            footerItem.url,
                            imgWidth,
                            imgHeight,
                            footerItem.settings,
                            shadowSettingsToUse,
                            shadowTargetToUse
                        )
                    )
                );
            }

            // STEP 4: Announce the canvas is ready
            onCanvasReady(index, async () => {
                return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            });
        };

        drawImageAndWatermarks();

    }, [
        image.url,
        index,
        logosToRender,
        footersToRender,
        shadowSettingsToUse,
        shadowTargetToUse,
        onCanvasReady,
        drawLogo,
        drawFooter,
        drawShadow
    ]);

    const downloadImage = async () => {
        const canvas = canvasRef.current;
        if (canvas) {
            saveTemplate();
            const link = document.createElement('a');
            link.download = `watermarked_${image.file.name}`;
            link.href = canvas.toDataURL(image.file.type);
            link.click();
        }
    };

    const removeImage = () => {
        setImages((prevImages: any[]) => {
            const newImages = prevImages.filter((_, i) => i !== index);
            URL.revokeObjectURL(image.url);
            if (image.individualLogo) URL.revokeObjectURL(image.individualLogo);
            if (image.individualFooter) URL.revokeObjectURL(image.individualFooter);
            image.individualLogos?.forEach((logo: any) => URL.revokeObjectURL(logo.url));
            image.individualFooters?.forEach((footer: any) => URL.revokeObjectURL(footer.url));

            if (selectedImageIndex === index) {
                setSelectedImageIndex(null);
            } else if (selectedImageIndex !== null && index < selectedImageIndex) {
                setSelectedImageIndex(selectedImageIndex - 1);
            }
            return newImages;
        });
    };

    const modalCanvasId = `modal-canvas-${index}`;

    return (
        <div className="relative group">
            <canvas
                id={`canvas-${index}`}
                ref={canvasRef}
                className="w-full h-auto rounded-md shadow-sm border border-gray-300 dark:border-gray-600"
            />

            {/* Logo and Footer count indicators */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
                {logosToRender.length > 0 && (
                    <div className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                        {logosToRender.length} Logo{logosToRender.length !== 1 ? 's' : ''}
                    </div>
                )}
                {footersToRender.length > 0 && (
                    <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                        {footersToRender.length} Footer{footersToRender.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={downloadImage}
                    className="relative group p-3 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-110"
                    aria-label="Download Image"
                >
                    <FiDownload className="text-xl" />
                    <span className="absolute bottom-full mb-2 hidden group-hover:block px-3 py-1 bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Download
                    </span>
                </button>

                <button
                    onClick={removeImage}
                    className="relative group p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-110"
                    aria-label="Delete Image"
                >
                    <MdDelete className="text-xl" />
                    <span className="absolute bottom-full mb-2 hidden group-hover:block px-3 py-1 bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Delete
                    </span>
                </button>

                <button
                    onClick={() => setOpenPreview(true)}
                    className="relative group p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-110"
                    aria-label="Preview Image"
                >
                    <FiMaximize2 className="text-xl" />
                    <span className="absolute bottom-full mb-2 hidden group-hover:block px-3 py-1 bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Preview
                    </span>
                </button>
            </div>

            <ModalPreview canvasRef={canvasRef} open={openPreview} onClose={setOpenPreview} modalCanvasId={modalCanvasId} />
        </div>
    );
}