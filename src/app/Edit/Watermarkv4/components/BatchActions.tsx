
'use client';

import React from 'react';
import { useImageEditor } from './ImageEditorContext';
import { CheckSquare, Square, Trash2, Download } from 'lucide-react';

export default function BatchActions() {
    const { images, selectedImages, selectAllImages, deselectAllImages, removeSelectedImages } = useImageEditor();

    const allSelected = selectedImages.length === images.length && images.length > 0;
    const someSelected = selectedImages.length > 0 && selectedImages.length < images.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            deselectAllImages();
        } else {
            selectAllImages();
        }
    };

    if (images.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {allSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : someSelected ? (
                            <Square className="w-5 h-5 text-blue-400" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                        <span className="font-medium">
                            {allSelected ? 'Deselect All' : 'Select All'}
                        </span>
                    </button>

                    {selectedImages.length > 0 && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedImages.length} of {images.length} selected
                        </span>
                    )}
                </div>

                {selectedImages.length > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={removeSelectedImages}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download Selected
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}