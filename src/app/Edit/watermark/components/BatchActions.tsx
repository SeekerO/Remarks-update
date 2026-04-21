'use client';

import React from 'react';
import { useImageEditor } from './ImageEditorContext';
import { CheckSquare, Square, Trash2, Download } from 'lucide-react';

interface BatchActionsProps {
    onDownloadSelected: () => void;
}

export default function BatchActions({ onDownloadSelected }: BatchActionsProps) {
    const {
        images,
        selectedImages,
        selectAllImages,
        deselectAllImages,
        removeSelectedImages,
    } = useImageEditor();

    const allSelected = selectedImages.length === images.length && images.length > 0;
    const someSelected = selectedImages.length > 0 && selectedImages.length < images.length;
    const noneSelected = selectedImages.length === 0;

    const toggleSelectAll = () => {
        if (allSelected) {
            deselectAllImages();
        } else {
            selectAllImages();
        }
    };

    if (images.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3 mb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">

                {/* Left — select all toggle + count */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            bg-gray-100 dark:bg-gray-700
                            hover:bg-gray-200 dark:hover:bg-gray-600
                            text-gray-700 dark:text-gray-200"
                    >
                        {allSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : someSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400 dark:text-indigo-500 opacity-60" />
                        ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                        )}
                        {allSelected ? 'Deselect All' : 'Select All'}
                    </button>

                    {!noneSelected && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                                {selectedImages.length}
                            </span>
                            {' '}of{' '}
                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                                {images.length}
                            </span>
                            {' '}selected
                        </span>
                    )}
                </div>

                {/* Right — actions (only shown when something is selected) */}
                {!noneSelected && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={removeSelectedImages}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors
                                bg-red-50 dark:bg-red-900/20
                                hover:bg-red-100 dark:hover:bg-red-900/40
                                border border-red-200 dark:border-red-800
                                text-red-600 dark:text-red-400"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selectedImages.length})
                        </button>

                        <button
                            onClick={onDownloadSelected}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors
                                bg-green-600 hover:bg-green-700
                                text-white shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Download ({selectedImages.length})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}