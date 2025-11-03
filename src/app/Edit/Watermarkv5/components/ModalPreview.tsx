"use client";

import React, { SetStateAction, useLayoutEffect, useRef, useEffect } from "react";

interface ModalPreviewProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    open: boolean;
    onClose: React.Dispatch<SetStateAction<boolean>>;
    modalCanvasId: string;
}


const ModalPreview = ({
    canvasRef,
    open,
    onClose,
    modalCanvasId,
}: ModalPreviewProps): React.JSX.Element | null => {

    // Ref for the canvas element rendered inside the modal.
    const modalCanvasRef = useRef<HTMLCanvasElement>(null);
    // Ref for the modal's content area to detect outside clicks.
    const modalContentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const originalCanvas = canvasRef.current;
        const modalCanvas = modalCanvasRef.current;

        if (originalCanvas && modalCanvas) {
            const ctx = modalCanvas.getContext("2d");
            if (ctx) {
                modalCanvas.width = originalCanvas.width;
                modalCanvas.height = originalCanvas.height;
                ctx.drawImage(originalCanvas, 0, 0);
            }
        }
    }, [open, canvasRef]); // Re-run effect when 'open' or 'canvasRef' changes.

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent): void => {
            if (
                modalContentRef.current &&
                !modalContentRef.current.contains(event.target as Node)
            ) {
                onClose(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                onClose(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => onClose(false)} // Close modal if background is clicked
        >
            <div
                ref={modalContentRef}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative max-w-5xl w-full max-h-[97vh] overflow-auto"
                onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside its content
            >
                <canvas
                    ref={modalCanvasRef}
                    id={modalCanvasId}
                    className="w-full h-auto rounded-md mb-4 shadow-sm border border-gray-300 dark:border-gray-600"
                />
            </div>
        </div>
    );
};

export default ModalPreview;