'use client';

import React from 'react';
import { ExportOptions } from '../lib/types/watermark';
import { ImageDown, ChevronDown } from 'lucide-react';

interface ExportOptionsPanelProps {
    options: ExportOptions;
    onChange: (options: ExportOptions) => void;
}

const FORMAT_INFO: Record<ExportOptions['format'], { label: string; description: string; color: string }> = {
    png: {
        label: 'PNG',
        description: 'Lossless · Best for logos & transparency',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    jpg: {
        label: 'JPG',
        description: 'Smallest file · Best for photos',
        color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    },
    webp: {
        label: 'WebP',
        description: 'Modern · Best quality/size ratio',
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    },
};

const COMPRESSION_LABELS: Record<ExportOptions['compression'], string> = {
    none: 'None',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
};

export const defaultExportOptions: ExportOptions = {
    format: 'png',
    quality: 92,
    scale: 1,
    includeMetadata: false,
    compression: 'none',
};

export default function ExportOptionsPanel({ options, onChange }: ExportOptionsPanelProps) {
    const update = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
        onChange({ ...options, [key]: value });
    };

    const currentFormat = FORMAT_INFO[options.format];
    const showQuality = options.format !== 'png';

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <ImageDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Export Settings
                </span>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${currentFormat.color}`}>
                    {currentFormat.label}
                </span>
            </div>

            <div className="p-4 space-y-5">
                {/* Format Selector */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.entries(FORMAT_INFO) as [ExportOptions['format'], (typeof FORMAT_INFO)[ExportOptions['format']]][]).map(([fmt, info]) => (
                            <button
                                key={fmt}
                                onClick={() => {
                                    const qualityMap: Record<ExportOptions['format'], number> = {
                                        png: 100,
                                        jpg: 85,
                                        webp: 90,
                                    };
                                    onChange({ ...options, format: fmt, quality: qualityMap[fmt] });
                                }}
                                className={`flex flex-col items-center py-2.5 px-1 rounded-lg border-2 transition-all text-center ${options.format === fmt
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700'
                                    }`}
                            >
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                    {info.label}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                                    {fmt === 'png' ? 'Lossless' : fmt === 'jpg' ? 'Smallest' : 'Modern'}
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {currentFormat.description}
                    </p>
                </div>

                {/* Quality Slider — hidden for PNG */}
                {showQuality && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Quality
                            </label>
                            <span className={`text-sm font-bold ${options.quality >= 80
                                ? 'text-green-600 dark:text-green-400'
                                : options.quality >= 60
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-500 dark:text-red-400'
                                }`}>
                                {options.quality}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={100}
                            step={1}
                            value={options.quality}
                            onChange={(e) => update('quality', parseInt(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                            style={{
                                background: `linear-gradient(to right,
                                    rgb(99, 102, 241) 0%,
                                    rgb(99, 102, 241) ${options.quality}%,
                                    rgb(229, 231, 235) ${options.quality}%,
                                    rgb(229, 231, 235) 100%)`
                            }}
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-400">Smaller file</span>
                            <span className="text-[10px] text-gray-400">Higher quality</span>
                        </div>
                    </div>
                )}

                {/* Scale Selector */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Output Scale
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {[0.5, 1, 1.5, 2].map((scale) => (
                            <button
                                key={scale}
                                onClick={() => update('scale', scale)}
                                className={`py-2 text-xs font-bold rounded-lg border-2 transition-all ${options.scale === scale
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
                                    }`}
                            >
                                {scale}×
                            </button>
                        ))}
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {options.scale === 0.5 && 'Half resolution — smaller file size'}
                        {options.scale === 1 && 'Original resolution'}
                        {options.scale === 1.5 && '1.5× — good for print'}
                        {options.scale === 2 && '2× — high DPI / retina'}
                    </p>
                </div>

                {/* Compression */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        ZIP Compression
                    </label>
                    <div className="relative">
                        <select
                            value={options.compression}
                            onChange={(e) => update('compression', e.target.value as ExportOptions['compression'])}
                            className="w-full appearance-none pl-3 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            {(Object.entries(COMPRESSION_LABELS) as [ExportOptions['compression'], string][]).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Metadata toggle */}
                <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            Include Metadata
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Embed original filename in output
                        </p>
                    </div>
                    <button
                        onClick={() => update('includeMetadata', !options.includeMetadata)}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${options.includeMetadata
                            ? 'bg-indigo-600'
                            : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${options.includeMetadata ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                    </button>
                </div>

            </div>
        </div>
    );
}