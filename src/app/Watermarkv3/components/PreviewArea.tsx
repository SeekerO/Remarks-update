// app/components/PreviewArea.tsx
"use client";

import React from "react";
import JSZip from "jszip"; // Import JSZip
import { saveAs } from 'file-saver'; // For saving the generated zip file
import { useImageEditor } from "./ImageEditorContext";
import SingleImageEditor from "./SingleImageEditor";

// Component to display uploaded images and manage global download.
export default function PreviewArea() {
    // Destructure necessary values from the image editor context.
    const { images, selectedImageIndex, setSelectedImageIndex } = useImageEditor();

    // Function to download all processed images as a ZIP file.
    const downloadAll = async () => {
        if (images.length === 0) return; // Prevent download if no images

        const zip = new JSZip();
        const folder = zip.folder("watermarked_images"); // Create a folder inside the zip

        for (const [index, image] of images.entries()) {
            const canvas = document.getElementById(`canvas-${index}`) as HTMLCanvasElement;
            if (canvas) {
                // Get image data as a Blob
                const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                if (blob) {
                    folder?.file(`watermarked_image_${index + 1}.png`, blob); // Add to zip folder
                }
            }
        }

        // Generate the zip file and trigger download
        zip.generateAsync({ type: "blob" })
            .then(function (content) {
                saveAs(content, "watermarked_images.zip");
            })
            .catch(error => {
                console.error("Error generating zip file:", error);
            });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Image Previews</h2>
                <button
                    onClick={downloadAll}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    disabled={images.length === 0}
                >
                    Download All as ZIP
                </button>
            </div>

            {images.length === 0 ? (
                <p className="text-gray-500 text-lg text-center bg-white p-6 rounded-lg shadow-inner">
                    No images uploaded yet. Please use the uploader on the left.
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((image: any, index: number) => (
                        <div
                            key={index}
                            className={`relative border-4 rounded-lg overflow-hidden transition-all duration-200 ease-in-out ${selectedImageIndex === index
                                ? "border-blue-500 shadow-xl scale-102"
                                : "border-gray-200 hover:border-gray-400 cursor-pointer shadow-md"
                                }`}
                            onClick={() => setSelectedImageIndex(index)}
                        >
                            <SingleImageEditor image={image} index={index} />
                            {selectedImageIndex === index && (
                                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center text-white font-bold text-2xl pointer-events-none rounded-lg">
                                    SELECTED
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}