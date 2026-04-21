'use client';

import React, { useState, useEffect } from 'react';
import { useImageEditor } from './ImageEditorContext';
import { Template } from '../lib/types/watermark';
import { generateThumbnail } from '../lib/utils/export';
import { Save, FolderOpen, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function TemplateManager() {
    const {
        logo,
        footer,
        globalLogoSettings,
        globalFooterSettings,
        globalShadowSettings,
        globalShadowTarget,
        setLogo,
        setFooter,
        setGlobalLogoSettings,
        setGlobalFooterSettings,
        setGlobalShadowSettings,
        setGlobalShadowTarget,
        images,
    } = useImageEditor();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showTemplates, setShowTemplates] = useState(true);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [isCapturing, setIsCapturing] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => {
        const saved = localStorage.getItem('watermarkTemplates');
        if (saved) setTemplates(JSON.parse(saved));
    };

    // Grab a thumbnail from the first available canvas on the page
    const captureThumbnail = async (): Promise<string> => {
        const canvas = document.querySelector<HTMLCanvasElement>('canvas[id^="canvas-"]');
        if (!canvas) return '';
        return generateThumbnail(canvas, 240, 160);
    };

    const saveTemplate = async () => {
        if (!templateName.trim()) return;
        setIsCapturing(true);

        const thumbnail = await captureThumbnail();

        const newTemplate: Template = {
            id: Date.now().toString(),
            name: templateName,
            description: templateDescription,
            logo,
            footer,
            logoSettings: globalLogoSettings,
            footerSettings: globalFooterSettings,
            shadowSettings: globalShadowSettings,
            shadowTarget: globalShadowTarget,
            createdAt: new Date(),
            thumbnail,
        };

        const updated = [...templates, newTemplate];
        setTemplates(updated);
        localStorage.setItem('watermarkTemplates', JSON.stringify(updated));

        setIsCapturing(false);
        setShowSaveDialog(false);
        setTemplateName('');
        setTemplateDescription('');
    };

    const loadTemplate = (template: Template) => {
        setLogo(template.logo);
        setFooter(template.footer);
        setGlobalLogoSettings(template.logoSettings);
        setGlobalFooterSettings(template.footerSettings);
        setGlobalShadowSettings(template.shadowSettings);
        setGlobalShadowTarget(template.shadowTarget);
    };

    const deleteTemplate = (id: string) => {
        const updated = templates.filter(t => t.id !== id);
        setTemplates(updated);
        localStorage.setItem('watermarkTemplates', JSON.stringify(updated));
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <button
                    onClick={() => setShowTemplates(v => !v)}
                    className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    {showTemplates
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    Templates
                    {templates.length > 0 && (
                        <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            {templates.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setShowSaveDialog(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                    <Save className="w-3.5 h-3.5" />
                    Save Current
                </button>
            </div>

            {/* Save dialog */}
            {showSaveDialog && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20 space-y-3">
                    {images.length > 0 && (
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                            📸 A thumbnail will be captured from your first image.
                        </p>
                    )}
                    <input
                        type="text"
                        placeholder="Template name *"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows={2}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={saveTemplate}
                            disabled={!templateName.trim() || isCapturing}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            {isCapturing ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Capturing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    Save
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setShowSaveDialog(false)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Template list */}
            {showTemplates && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
                    {templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                                <Save className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                No templates saved yet
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Save your current watermark settings to reuse them later.
                            </p>
                        </div>
                    ) : (
                        templates.map((template) => (
                            <div
                                key={template.id}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                            >
                                {/* Thumbnail */}
                                <div className="flex-shrink-0 w-16 h-11 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                    {template.thumbnail ? (
                                        <img
                                            src={template.thumbnail}
                                            alt={template.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-[10px] text-gray-400 text-center px-1">
                                                No preview
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                        {template.name}
                                    </p>
                                    {template.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {template.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-[10px] text-gray-400">
                                            {formatDate(template.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => loadTemplate(template)}
                                        title="Load template"
                                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                    >
                                        <FolderOpen className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteTemplate(template.id)}
                                        title="Delete template"
                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}