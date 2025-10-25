'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Copy, Download, ExternalLink, Edit } from 'lucide-react';

interface Song {
    id: string;
    title: string;
    thumbnail: string;
    channel: string;
    views: string;
}

interface ValidationResult extends Song {
    isFormatValid: boolean;
    exists: boolean;
    status: 'valid' | 'not-found' | 'invalid-format';
    isEditing?: boolean;
    newUrl?: string;
}

const VideoIDValidatorAndFixer = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
    const [isValidating, setIsValidating] = useState(false);

    const isValidVideoIdFormat = (id: string): boolean => {
        return /^[a-zA-Z0-9_-]{11}$/.test(id);
    };

    const testVideoId = async (id: string): Promise<boolean> => {
        try {
            const response = await fetch(`https://img.youtube.com/vi/${id}/mqdefault.jpg`);
            return response.ok;
        } catch {
            return false;
        }
    };

    const extractVideoId = (url: string): string | null => {
        url = url.trim();

        // Direct ID
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }

        // Standard URL
        let match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        // Short URL
        match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        // Embed URL
        match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        return null;
    };

    const validateJSON = async () => {
        setIsValidating(true);
        setValidationResults([]);

        try {
            const songs: Song[] = JSON.parse(jsonInput);
            const results: ValidationResult[] = [];

            for (const song of songs) {
                const isFormatValid = isValidVideoIdFormat(song.id);
                const exists = isFormatValid ? await testVideoId(song.id) : false;

                results.push({
                    ...song,
                    isFormatValid,
                    exists,
                    status: exists ? 'valid' : (isFormatValid ? 'not-found' : 'invalid-format')
                });

                // Update UI progressively
                setValidationResults([...results]);

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (error) {
            alert('Invalid JSON format. Please check your input: ' + error);
        } finally {
            setIsValidating(false);
        }
    };

    const startEditing = (index: number) => {
        const updated = [...validationResults];
        updated[index].isEditing = true;
        updated[index].newUrl = '';
        setValidationResults(updated);
    };

    const cancelEditing = (index: number) => {
        const updated = [...validationResults];
        updated[index].isEditing = false;
        updated[index].newUrl = '';
        setValidationResults(updated);
    };

    const updateUrl = (index: number, url: string) => {
        const updated = [...validationResults];
        updated[index].newUrl = url;
        setValidationResults(updated);
    };

    const applyFix = async (index: number) => {
        const updated = [...validationResults];
        const newUrl = updated[index].newUrl || '';
        const newId = extractVideoId(newUrl);

        if (!newId) {
            alert('Invalid YouTube URL or Video ID. Please check the format.');
            return;
        }

        // Test if the new ID works
        const isValid = await testVideoId(newId);
        if (!isValid) {
            alert('This video ID does not exist on YouTube. Please check the URL.');
            return;
        }

        // Apply the fix
        updated[index].id = newId;
        updated[index].thumbnail = `https://img.youtube.com/vi/${newId}/mqdefault.jpg`;
        updated[index].status = 'valid';
        updated[index].exists = true;
        updated[index].isFormatValid = true;
        updated[index].isEditing = false;
        updated[index].newUrl = '';

        setValidationResults(updated);
    };

    const searchOnYouTube = (title: string, channel: string) => {
        const query = encodeURIComponent(`${title} ${channel}`);
        window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    };

    const exportResults = (onlyValid: boolean = false) => {
        const songsToExport = onlyValid
            ? validationResults.filter(r => r.status === 'valid')
            : validationResults;

        const cleanedSongs = songsToExport.map(({ ...song }) => song);

        return JSON.stringify(cleanedSongs, null, 2);
    };

    const copyResults = (onlyValid: boolean = false) => {
        navigator.clipboard.writeText(exportResults(onlyValid));
        const count = onlyValid
            ? validationResults.filter(r => r.status === 'valid').length
            : validationResults.length;
        alert(`Copied ${count} songs to clipboard!`);
    };

    const downloadResults = (onlyValid: boolean = false) => {
        const blob = new Blob([exportResults(onlyValid)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = onlyValid ? 'valid_songs.json' : 'all_songs_fixed.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const validCount = validationResults.filter(r => r.status === 'valid').length;
    const invalidCount = validationResults.filter(r => r.status !== 'valid').length;

    return (
        <div className="min-h-screen w-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    YouTube Video ID Validator & Manual Fixer
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Validate video IDs and manually fix broken ones by searching YouTube
                </p>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Step 1: Paste Your JSON
                    </h2>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='Paste your songs.json content here...'
                        className="w-full h-64 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none
                     font-mono text-sm"
                    />

                    <button
                        onClick={validateJSON}
                        disabled={isValidating || !jsonInput}
                        className="mt-4 px-6 py-3 bg-sky-500 text-white font-semibold rounded-lg
                     hover:bg-sky-600 transition-all duration-200 flex items-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isValidating ? 'Validating...' : 'Validate Video IDs'}
                    </button>
                </div>

                {validationResults.length > 0 && (
                    <>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Step 2: Review & Fix
                                </h2>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => copyResults(false)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                             transition-all duration-200 flex items-center gap-2"
                                    >
                                        <Copy size={16} />
                                        Copy All
                                    </button>
                                    <button
                                        onClick={() => copyResults(true)}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600
                             transition-all duration-200 flex items-center gap-2"
                                    >
                                        <Copy size={16} />
                                        Copy Valid Only
                                    </button>
                                    <button
                                        onClick={() => downloadResults(false)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700
                             transition-all duration-200 flex items-center gap-2"
                                    >
                                        <Download size={16} />
                                        Download Fixed JSON
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                        <CheckCircle size={20} />
                                        <span className="font-semibold">Valid</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-2">
                                        {validCount}
                                    </p>
                                </div>

                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                        <XCircle size={20} />
                                        <span className="font-semibold">Need Fixing</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-900 dark:text-red-300 mt-2">
                                        {invalidCount}
                                    </p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-400">
                                        <AlertCircle size={20} />
                                        <span className="font-semibold">Total</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-300 mt-2">
                                        {validationResults.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {validationResults.map((result, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border ${result.status === 'valid'
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {result.status === 'valid' ? (
                                                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                                            ) : (
                                                <XCircle className="text-red-600 dark:text-red-400" size={24} />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                        {result.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {result.channel}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                                                        Current ID: {result.id}
                                                    </p>

                                                    {result.status !== 'valid' && !result.isEditing && (
                                                        <div className="mt-3 flex gap-2">
                                                            <button
                                                                onClick={() => searchOnYouTube(result.title, result.channel)}
                                                                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600
                                         transition-all duration-200 flex items-center gap-2"
                                                            >
                                                                <ExternalLink size={16} />
                                                                Search on YouTube
                                                            </button>
                                                            <button
                                                                onClick={() => startEditing(index)}
                                                                className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600
                                         transition-all duration-200 flex items-center gap-2"
                                                            >
                                                                <Edit size={16} />
                                                                Fix Video ID
                                                            </button>
                                                        </div>
                                                    )}

                                                    {result.isEditing && (
                                                        <div className="mt-3 p-4 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-700">
                                                            <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">
                                                                Paste the correct YouTube URL or Video ID:
                                                            </p>
                                                            <input
                                                                type="text"
                                                                value={result.newUrl}
                                                                onChange={(e) => updateUrl(index, e.target.value)}
                                                                placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
                                                                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600
                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                                         focus:ring-2 focus:ring-purple-500 outline-none mb-3"
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => applyFix(index)}
                                                                    className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600
                                           transition-all duration-200"
                                                                >
                                                                    Apply Fix
                                                                </button>
                                                                <button
                                                                    onClick={() => cancelEditing(index)}
                                                                    className="px-4 py-2 bg-gray-400 text-white text-sm rounded hover:bg-gray-500
                                           transition-all duration-200"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {result.status !== 'valid' && !result.isEditing && (
                                                        <div className="mt-2 text-sm">
                                                            <span className="text-red-600 dark:text-red-400 font-medium">
                                                                {result.status === 'invalid-format'
                                                                    ? '❌ Invalid ID format'
                                                                    : '❌ Video not found or deleted'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {result.status === 'valid' && (
                                                    <img
                                                        src={result.thumbnail}
                                                        alt={result.title}
                                                        className="w-40 h-24 object-cover rounded shadow"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-6">
                            <h3 className="font-semibold text-sky-900 dark:text-sky-300 mb-2">
                                💡 How to Fix Broken Videos
                            </h3>
                            <ol className="text-sky-800 dark:text-sky-400 text-sm space-y-2 list-decimal list-inside">
                                <li>Click <strong>{`"Search on YouTube"`}</strong> to find the correct video</li>
                                <li>{`Copy the video URL from YouTube (the full link in the address bar)`}</li>
                                <li>Click <strong>{`"Fix Video ID"`}</strong> on the broken song</li>
                                <li>{`Paste the URL or just the video ID (11 characters after ?v=)`}</li>
                                <li>Click <strong>{`"Apply Fix"`}</strong> to update</li>
                                <li>When done, click <strong>{`"Download Fixed JSON"`}</strong> to save your corrected file</li>
                            </ol>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoIDValidatorAndFixer;