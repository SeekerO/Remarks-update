// app/components/SingleImageEditor.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useImageEditor } from "./ImageEditorContext";
import ModalPreview from "./ModalPreview";
import { MdDelete } from "react-icons/md";
import { FiDownload, FiMaximize2 } from "react-icons/fi";

interface SingleImageEditorProps {
    image: any;
    index: number;
    // New prop: A callback function that the parent will provide
    // It will be called with the index and a function to get the canvas blob.
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

export default function SingleImageEditor({ image, index, onCanvasReady }: SingleImageEditorProps) { // Add onCanvasReady here
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        logo,
        footer,
        globalLogoSettings,
        globalFooterSettings,
        globalShadowSettings,
        globalShadowTarget,
        images,
        setImages,
        selectedImageIndex,
        setSelectedImageIndex,
    } = useImageEditor();

    const [openPreview, setOpenPreview] = useState<boolean>(false);
    const currentImage = images[index];

    const logoToUse = currentImage.useGlobalSettings ? logo : currentImage.individualLogo;
    const footerToUse = currentImage.useGlobalSettings ? footer : currentImage.individualFooter;
    const logoSettingsToUse = currentImage.useGlobalSettings ? globalLogoSettings : currentImage.individualLogoSettings;
    const footerSettingsToUse = currentImage.useGlobalSettings ? globalFooterSettings : currentImage.individualFooterSettings;
    const shadowSettingsToUse = currentImage.useGlobalSettings ? globalShadowSettings : currentImage.individualShadowSettings;
    const shadowTargetToUse = currentImage.useGlobalSettings
        ? globalShadowTarget
        : (currentImage.individualShadowSettings ? "whole-image" : "none");

    // Memoize the draw operations to avoid recreating them unnecessarily
    const drawWatermark = useCallback((
        ctx: CanvasRenderingContext2D,
        logoUrl: string,
        imgWidth: number,
        imgHeight: number,
        settings: typeof globalLogoSettings
    ) => {
        const logoImg = new Image();
        logoImg.src = logoUrl;
        return new Promise<void>(resolve => {
            logoImg.onload = () => {
                const { position, width, height, paddingX, paddingY } = settings;
                const [x, y] = calculatePosition(position, imgWidth, imgHeight, width, height, paddingX, paddingY);
                ctx.drawImage(logoImg, x, y, width, height);
                resolve();
            };
            logoImg.onerror = () => {
                console.error("Failed to load logo image:", logoUrl);
                resolve(); // Resolve even on error to not block main drawing
            };
        });
    }, []);

    const drawFooter = useCallback((
        ctx: CanvasRenderingContext2D,
        footerUrl: string,
        imgWidth: number,
        imgHeight: number,
        settings: typeof globalFooterSettings,
        shadowSettings: typeof globalShadowSettings | undefined,
        shadowTarget: "none" | "footer" | "whole-image"
    ) => {
        const footerImg = new Image();
        footerImg.src = footerUrl;
        return new Promise<void>(resolve => {
            footerImg.onload = () => {
                const { opacity, scale, offsetX, offsetY } = settings;
                const scaledWidth = footerImg.width * scale;
                const scaledHeight = footerImg.height * scale;
                const x = (imgWidth - scaledWidth) / 2 + offsetX;
                const y = imgHeight - scaledHeight - 20 + offsetY;

                ctx.save();
                ctx.globalAlpha = opacity;

                if (shadowTarget === "footer" && shadowSettings) {
                    drawShadow(ctx, scaledWidth, scaledHeight, shadowSettings, "footer", x, y);
                }

                ctx.drawImage(footerImg, x, y, scaledWidth, scaledHeight);
                ctx.restore();
                resolve();
            };
            footerImg.onerror = () => {
                console.error("Failed to load footer image:", footerUrl);
                resolve(); // Resolve even on error
            };
        });
    }, []);

    const drawShadow = useCallback((
        ctx: CanvasRenderingContext2D,
        targetWidth: number,
        targetHeight: number,
        settings: typeof globalShadowSettings,
        targetType: "footer" | "whole-image",
        targetX: number = 0,
        targetY: number = 0
    ) => {
        const { color, opacity, offsetX, offsetY, blur } = settings;
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = offsetX;
        ctx.shadowOffsetY = offsetY;
        ctx.globalAlpha = opacity;

        if (targetType === "whole-image") {
            ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else if (targetType === "footer") {
            ctx.fillRect(targetX, targetY, targetWidth, targetHeight);
        }
        ctx.restore();
    }, []);

    // Effect hook to draw the image, logo, and footer on the canvas.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.src = image.url;

        // Use a promise to track when all drawing operations are complete
        const drawImageAndWatermarks = async () => {
            await new Promise<void>(resolve => {
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
                    ctx.drawImage(img, 0, 0); // Draw base image

                    // Apply shadow to the whole image if specified
                    if (shadowTargetToUse === "whole-image" && shadowSettingsToUse) {
                        drawShadow(ctx, canvas.width, canvas.height, shadowSettingsToUse, "whole-image");
                        ctx.drawImage(img, 0, 0); // Redraw image over shadow
                    }
                    resolve();
                };
                img.onerror = () => {
                    console.error("Failed to load base image:", image.url);
                    resolve(); // Resolve even on error to allow subsequent operations
                };
            });

            // Draw logo if available
            if (logoToUse && logoSettingsToUse) {
                await drawWatermark(ctx, logoToUse, img.width, img.height, logoSettingsToUse);
            }

            // Draw footer if available
            if (footerToUse && footerSettingsToUse) {
                await drawFooter(ctx, footerToUse, img.width, img.height, footerSettingsToUse, shadowSettingsToUse, shadowTargetToUse);
            }

            // ALL drawing is now complete. Call the parent's callback.
            // Provide a function that gets the blob
            onCanvasReady(index, async () => {
                return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            });
        };

        drawImageAndWatermarks();

        // Cleanup function for the effect
        return () => {
            // Potentially revoke any object URLs if they are created here, but image.url is likely already handled.
            // Clean up timers or event listeners if any.
        };

    }, [image.url, index, logoToUse, footerToUse, logoSettingsToUse, footerSettingsToUse, shadowSettingsToUse, shadowTargetToUse, onCanvasReady, drawWatermark, drawFooter, drawShadow]); // Include useCallback dependencies

    const downloadImage = async () => {
        const canvas = canvasRef.current;
        if (canvas) {
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
                id={`canvas-${index}`} // Make sure the canvas has the ID for PreviewArea's direct access (though we're moving away from this)
                ref={canvasRef}
                className="w-full h-auto rounded-md shadow-sm border border-gray-300 dark:border-gray-600"
            />
            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={downloadImage}
                    className="relative group p-3 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
                    aria-label="Download Image"
                >
                    <FiDownload className="text-xl" />
                    <span className="absolute bottom-full mb-2 hidden group-hover:block px-3 py-1 bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Download
                    </span>
                </button>

                <button
                    onClick={removeImage}
                    className="relative group p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                    aria-label="Delete Image"
                >
                    <MdDelete className="text-xl" />
                    <span className="absolute bottom-full mb-2 hidden group-hover:block px-3 py-1 bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Delete
                    </span>
                </button>

                <button
                    onClick={() => setOpenPreview(true)}
                    className="relative group p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
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