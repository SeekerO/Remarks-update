// app/components/SingleImageEditor.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef, useState } from "react"; // Added useState for modal
// Corrected import path for ImageEditorContext
import { useImageEditor } from "./ImageEditorContext";
import ModalPreview from "./ModalPreview"
// Icons for download, delete, and maximize actions
import { MdDelete } from "react-icons/md";
import { FiDownload, FiMaximize2 } from "react-icons/fi";

interface SingleImageEditorProps {
    image: any;
    index: number;
}


// Helper function to calculate the position of the logo based on its settings.
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

// Main component for editing and displaying a single image.
export default function SingleImageEditor({ image, index }: SingleImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        logo,
        footer,
        globalLogoSettings,
        globalFooterSettings,
        globalShadowSettings, // NEW
        globalShadowTarget,   // NEW
        images,
        setImages,
        selectedImageIndex,
        setSelectedImageIndex,
    } = useImageEditor();

    const [openPreview, setOpenPreview] = useState<boolean>(false);

    // Get the specific image data from the context's images array
    const currentImage = images[index];
    const isSelected = selectedImageIndex === index;

    // Determine which settings and images to use based on useGlobalSettings flag
    const logoToUse = currentImage.useGlobalSettings ? logo : currentImage.individualLogo;
    const footerToUse = currentImage.useGlobalSettings ? footer : currentImage.individualFooter;

    const logoSettingsToUse = currentImage.useGlobalSettings
        ? globalLogoSettings
        : currentImage.individualLogoSettings;

    const footerSettingsToUse = currentImage.useGlobalSettings
        ? globalFooterSettings
        : currentImage.individualFooterSettings;

    const shadowSettingsToUse = currentImage.useGlobalSettings
        ? globalShadowSettings
        : currentImage.individualShadowSettings;

    const shadowTargetToUse = currentImage.useGlobalSettings
        ? globalShadowTarget
        : (currentImage.individualShadowSettings ? "whole-image" : "none"); // Simplified for individual shadow: assume whole-image if settings exist


    // Effect hook to draw the image, logo, and footer on the canvas.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.src = image.url;
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


            // Draw logo if available
            if (logoToUse && logoSettingsToUse) {
                drawWatermark(ctx, logoToUse, img.width, img.height, logoSettingsToUse);
            }

            // Draw footer if available
            if (footerToUse && footerSettingsToUse) {
                drawFooter(ctx, footerToUse, img.width, img.height, footerSettingsToUse, shadowSettingsToUse, shadowTargetToUse);
            }
        };
    }, [image.url, logoToUse, footerToUse, logoSettingsToUse, footerSettingsToUse, shadowSettingsToUse, shadowTargetToUse]);


    // Function to draw the logo (watermark) on the canvas.
    const drawWatermark = (
        ctx: CanvasRenderingContext2D,
        logoUrl: string,
        imgWidth: number,
        imgHeight: number,
        settings: typeof globalLogoSettings // Use the specific settings type
    ) => {
        const logoImg = new Image();
        logoImg.src = logoUrl;
        logoImg.onload = () => {
            const { position, width, height, paddingX, paddingY } = settings;
            const [x, y] = calculatePosition(
                position,
                imgWidth,
                imgHeight,
                width,
                height,
                paddingX,
                paddingY
            );
            ctx.drawImage(logoImg, x, y, width, height);
        };
    };

    // Function to draw the footer on the canvas.
    const drawFooter = (
        ctx: CanvasRenderingContext2D,
        footerUrl: string,
        imgWidth: number,
        imgHeight: number,
        settings: typeof globalFooterSettings, // Use the specific settings type
        shadowSettings: typeof globalShadowSettings | undefined,
        shadowTarget: "none" | "footer" | "whole-image"
    ) => {
        const footerImg = new Image();
        footerImg.src = footerUrl;
        footerImg.onload = () => {
            const { opacity, scale, offsetX, offsetY } = settings;

            // Calculate scaled dimensions
            const scaledWidth = footerImg.width * scale;
            const scaledHeight = footerImg.height * scale;

            // Calculate position to center the footer image, then apply offsets
            const x = (imgWidth - scaledWidth) / 2 + offsetX;
            const y = imgHeight - scaledHeight - 20 + offsetY; // 20px from bottom, adjust as needed

            ctx.save(); // Save the current canvas state
            ctx.globalAlpha = opacity; // Apply opacity

            // Apply shadow to the footer if specified
            if (shadowTarget === "footer" && shadowSettings) {
                drawShadow(ctx, scaledWidth, scaledHeight, shadowSettings, "footer", x, y);
            }

            ctx.drawImage(footerImg, x, y, scaledWidth, scaledHeight);
            ctx.restore(); // Restore the canvas state to remove opacity for subsequent drawings
        };
    };

    const drawShadow = (
        ctx: CanvasRenderingContext2D,
        targetWidth: number,
        targetHeight: number,
        settings: typeof globalShadowSettings, // Use the specific settings type
        targetType: "footer" | "whole-image",
        targetX: number = 0, // Used for footer shadow positioning
        targetY: number = 0  // Used for footer shadow positioning
    ) => {
        const { color, opacity, offsetX, offsetY, blur } = settings;

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = offsetX;
        ctx.shadowOffsetY = offsetY;
        ctx.globalAlpha = opacity;

        if (targetType === "whole-image") {
            // A small transparent rectangle covering the whole image area to cast shadow
            ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else if (targetType === "footer") {
            // For footer, apply shadow relative to its position
            ctx.fillRect(targetX, targetY, targetWidth, targetHeight);
        }

        ctx.restore();
    };


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
            // Revoke object URLs for the removed image to prevent memory leaks
            URL.revokeObjectURL(image.url);
            if (image.individualLogo) URL.revokeObjectURL(image.individualLogo);
            if (image.individualFooter) URL.revokeObjectURL(image.individualFooter);
            // If the selected image is removed, deselect it
            if (selectedImageIndex === index) {
                setSelectedImageIndex(null);
            }
            // Adjust selected index if an image before it was removed
            else if (selectedImageIndex !== null && index < selectedImageIndex) {
                setSelectedImageIndex(selectedImageIndex - 1);
            }
            return newImages;
        });
    };

    const modalCanvasId = `modal-canvas-${index}`;


    return (
        <div className="relative group">
            <canvas
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

            {/* Pass the new modalCanvasId to the ModalPreview */}
            <ModalPreview canvasRef={canvasRef} open={openPreview} onClose={setOpenPreview} modalCanvasId={modalCanvasId} />
        </div>
    );
}