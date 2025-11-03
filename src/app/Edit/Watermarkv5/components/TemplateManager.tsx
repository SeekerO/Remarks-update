'use client';

import React, { useState, useEffect } from 'react';
import { useImageEditor } from './ImageEditorContext';
import { Template } from '../lib/types/watermark';
import { Save, FolderOpen, Trash2 } from 'lucide-react';

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
        setGlobalShadowTarget
    } = useImageEditor();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => {
        const saved = localStorage.getItem('watermarkTemplates');
        if (saved) {
            setTemplates(JSON.parse(saved));
        }
    };

    const saveTemplate = () => {
        if (!templateName.trim()) return;

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
        };

        const updated = [...templates, newTemplate];
        setTemplates(updated);
        localStorage.setItem('watermarkTemplates', JSON.stringify(updated));

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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Templates</h3>
                <button
                    onClick={() => setShowSaveDialog(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                    <Save className="w-4 h-4" />
                    Save Current
                </button>
            </div>

            {showSaveDialog && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <input
                        type="text"
                        placeholder="Template name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full px-3 py-2 mb-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500"
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        className="w-full px-3 py-2 mb-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 resize-none"
                        rows={2}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={saveTemplate}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setShowSaveDialog(false)}
                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
                {templates.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No templates saved</p>
                ) : (
                    templates.map((template) => (
                        <div
                            key={template.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-800 dark:text-gray-100">{template.name}</h4>
                                {template.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => loadTemplate(template)}
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg"
                                    title="Load template"
                                >
                                    <FolderOpen className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteTemplate(template.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                                    title="Delete template"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}