// app/components/SingleImageEditor.tsx
"use client";

import React, { useEffect, useRef } from "react";
// Corrected import path for ImageEditorContext
import { useImageEditor } from "./ImageEditorContext";

interface Props {
    image: any; // Image data for the specific editor.
    index: number; // Index of the image in the global images array.
}

// Component to display and handle individual image editing on a canvas.
export default function SingleImageEditor({ image, index }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { logo, footer, setImages, setSelectedImageIndex, globalLogoSettings, globalFooterSettings } = useImageEditor();

    // Determine which settings to use for rendering
    const activeLogoSettings = image.useGlobalSettings ? globalLogoSettings : image.individualLogoSettings;
    const activeFooterSettings = image.useGlobalSettings ? globalFooterSettings : image.individualFooterSettings;

    // useEffect hook to draw the image, logo, and footer on the canvas.
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        if (!canvas || !ctx) {
            console.error("Canvas or 2D context not available.");
            return;
        }

        const img = new Image();
        img.src = image.url;
        img.crossOrigin = "anonymous"; // Essential for loading cross-origin images without tainting the canvas

        img.onload = () => {
            // Set canvas dimensions to match the original image.
            canvas.width = img.width;
            canvas.height = img.height;

            // Clear canvas and draw the main image.
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Draw logo if available and settings are defined.
            if (logo && activeLogoSettings) {
                const logoImg = new Image();
                logoImg.src = logo;
                logoImg.crossOrigin = "anonymous";
                logoImg.onload = () => {
                    const { width, height, position, paddingX, paddingY } = activeLogoSettings;
                    // Calculate logo position based on settings, including padding.
                    const [x, y] = calculatePosition(position, img.width, img.height, width, height, paddingX, paddingY);
                    ctx.drawImage(logoImg, x, y, width, height);
                };
                logoImg.onerror = () => console.error("Error loading logo image.");
            }

            // Draw footer if available and settings are defined.
            if (footer && activeFooterSettings) {
                const footerImg = new Image();
                footerImg.src = footer;
                footerImg.crossOrigin = "anonymous";
                footerImg.onload = () => {
                    const scale = activeFooterSettings.scale;
                    const offsetX = activeFooterSettings.offsetX;
                    const opacity = activeFooterSettings.opacity;

                    // Calculate footer dimensions and position.
                    const fWidth = footerImg.naturalWidth * scale; // Use naturalWidth for calculation
                    const fHeight = footerImg.naturalHeight * scale; // Use naturalHeight for calculation
                    const y = img.height - fHeight;
                    const x = offsetX; // Use offsetX directly from settings

                    // Apply opacity before drawing footer.
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(footerImg, x, y, fWidth, fHeight);
                    ctx.globalAlpha = 1; // Reset global alpha for subsequent drawings.
                };
                footerImg.onerror = () => console.error("Error loading footer image.");
            }
        };
        img.onerror = () => console.error("Error loading main image.");
    }, [image, logo, footer, activeLogoSettings, activeFooterSettings]); // Redraw whenever relevant data changes.

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

    // Function to download the current processed image.
    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error("Canvas not found for download.");
            return;
        }
        const link = document.createElement("a");
        link.download = `watermarked_image_${index + 1}.png`;
        link.href = canvas.toDataURL(); // Get data URL of the canvas content.
        link.click();
    };

    // Function to delete the current image from the list.
    const deleteImage = () => {
        setImages(prev => prev.filter((_, i) => i !== index)); // Filter out the image by its index.
        setSelectedImageIndex(null); // Deselect the image after deletion
    };

    return (
        <div className="bg-white rounded-lg p-4 flex flex-col items-center">
            {/* Canvas for image rendering */}
            <canvas ref={canvasRef} id={`canvas-${index}`} className="w-full h-auto border border-gray-300 rounded-md mb-4 shadow-sm" />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-center w-full">
                <button
                    onClick={downloadImage}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Download
                </button>
                <button
                    onClick={deleteImage}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

