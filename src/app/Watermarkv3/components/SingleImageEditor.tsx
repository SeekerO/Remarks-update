// app/components/SingleImageEditor.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef } from "react";
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
            // Default to top-left if position is not recognized
            x = paddingX;
            y = paddingY;
    }
    return [x, y];
};

export default function SingleImageEditor({ image, index }: SingleImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { logo, footer, setImages, setSelectedImageIndex, globalLogoSettings, globalFooterSettings } = useImageEditor();
    const [openPreview, setOpenPreview] = React.useState(false);

    const activeLogoSettings = image?.useGlobalSettings ? globalLogoSettings : image.individualLogoSettings;
    const activeFooterSettings = image?.useGlobalSettings ? globalFooterSettings : image.individualFooterSettings;

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        if (!canvas || !ctx) {
            console.error("Canvas or 2D context not available.");
            return;
        }

        const img = new Image();
        img.src = image.url;
        img.crossOrigin = "anonymous";

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            if (logo && activeLogoSettings) {
                const logoImg = new Image();
                logoImg.src = logo;
                logoImg.crossOrigin = "anonymous";
                logoImg.onload = () => {
                    const { width, height, position, paddingX, paddingY } = activeLogoSettings;
                    const [x, y] = calculatePosition(position, img.width, img.height, width, height, paddingX, paddingY);
                    ctx.drawImage(logoImg, x, y, width, height);
                };
                logoImg.onerror = () => console.error("Error loading logo image.");
            }

            if (footer && activeFooterSettings) {
                const footerImg = new Image();
                footerImg.src = footer;
                footerImg.crossOrigin = "anonymous";
                footerImg.onload = () => {
                    const scale = activeFooterSettings.scale;
                    const offsetX = activeFooterSettings.offsetX;
                    const opacity = activeFooterSettings.opacity;

                    const fWidth = footerImg.naturalWidth * scale;
                    const fHeight = footerImg.naturalHeight * scale;
                    const y = img.height - fHeight;
                    const x = offsetX;

                    ctx.globalAlpha = opacity;
                    ctx.drawImage(footerImg, x, y, fWidth, fHeight);
                    ctx.globalAlpha = 1;
                };
                footerImg.onerror = () => console.error("Error loading footer image.");
            }
        };
        img.onerror = () => console.error("Error loading main image.");
    }, [image, logo, footer, activeLogoSettings, activeFooterSettings]);

    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error("Canvas not found for download.");
            return;
        }
        const link = document.createElement("a");
        link.download = `watermarked_image_${index + 1}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const deleteImage = () => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setSelectedImageIndex(null);
    };

    // Use a unique ID for the canvas element inside the modal
    const modalCanvasId = `modal-canvas-${index}`;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 flex flex-col items-center shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out">
            {/* Canvas for image display */}
            <canvas ref={canvasRef} id={`canvas-${index}`} className="w-full h-auto rounded-lg mb-5 shadow-md border border-gray-200 dark:border-gray-700" />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center w-full">
                <button
                    onClick={downloadImage}
                    className="relative group p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
                    aria-label="Download Image"
                >
                    <FiDownload className="text-xl" />
                    <span className="absolute bottom-full mb-2 hidden group-hover:block px-3 py-1 bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Download
                    </span>
                </button>

                <button
                    onClick={deleteImage}
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

