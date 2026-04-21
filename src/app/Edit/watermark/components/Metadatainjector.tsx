'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Tag, User, Copyright, FileText, Hash,
    Globe, Camera, Building2, ChevronDown,
    RotateCcw, Info, Sparkles, Check, AlertCircle
} from 'lucide-react';

export interface ImageMetadata {
    title: string;
    author: string;
    copyright: string;
    description: string;
    keywords: string;
    software: string;
    organization: string;
    website: string;
    customField1Key: string;
    customField1Value: string;
    customField2Key: string;
    customField2Value: string;
    enabled: boolean;
    embedMode: 'comment' | 'watermark-text' | 'both';
    textWatermark: {
        enabled: boolean;
        position: 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-left' | 'top-right';
        text: string;
        fontSize: number;
        opacity: number;
        color: string;
        bgColor: string;
        bgOpacity: number;
    };
}

export const defaultMetadata: ImageMetadata = {
    title: '',
    author: '',
    copyright: '',
    description: '',
    keywords: '',
    software: 'Avexi',
    organization: '',
    website: 'avexi.digital',
    customField1Key: '',
    customField1Value: '',
    customField2Key: '',
    customField2Value: '',
    enabled: false,
    embedMode: 'comment',
    textWatermark: {
        enabled: false,
        position: 'bottom-right',
        text: '',
        fontSize: 14,
        opacity: 0.7,
        color: '#ffffff',
        bgColor: '#000000',
        bgOpacity: 0.5,
    },
};

interface FieldProps {
    label: string;
    icon: React.ElementType;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
    iconColor?: string;
}

function MetaField({ label, icon: Icon, value, onChange, placeholder, multiline, iconColor = 'text-indigo-400' }: FieldProps) {
    return (
        <div className="group">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-white/40 uppercase tracking-widest mb-1.5">
                <Icon className={`w-3 h-3 ${iconColor}`} />
                {label}
            </label>
            {multiline ? (
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg resize-none
                        bg-gray-50 dark:bg-white/[0.04]
                        border border-gray-200 dark:border-white/[0.08]
                        text-gray-800 dark:text-white/90
                        placeholder-gray-400 dark:placeholder-white/20
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400
                        transition-colors"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm rounded-lg
                        bg-gray-50 dark:bg-white/[0.04]
                        border border-gray-200 dark:border-white/[0.08]
                        text-gray-800 dark:text-white/90
                        placeholder-gray-400 dark:placeholder-white/20
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400
                        transition-colors"
                />
            )}
        </div>
    );
}

interface SectionProps {
    title: string;
    icon: React.ElementType;
    iconColor: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string;
    badgeColor?: string;
}

function Section({ title, icon: Icon, iconColor, children, defaultOpen = false, badge, badgeColor }: SectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3
                    bg-gray-50 dark:bg-white/[0.02]
                    hover:bg-gray-100 dark:hover:bg-white/[0.04]
                    transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/80">{title}</span>
                    {badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                            {badge}
                        </span>
                    )}
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-gray-400 dark:text-white/30" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="px-4 py-4 space-y-3 bg-white dark:bg-transparent border-t border-gray-100 dark:border-white/[0.04]">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface MetadataInjectorProps {
    metadata: ImageMetadata;
    onChange: (metadata: ImageMetadata) => void;
}

export default function MetadataInjector({ metadata, onChange }: MetadataInjectorProps) {
    const update = <K extends keyof ImageMetadata>(key: K, value: ImageMetadata[K]) => {
        onChange({ ...metadata, [key]: value });
    };

    const updateTextWatermark = (partial: Partial<ImageMetadata['textWatermark']>) => {
        onChange({ ...metadata, textWatermark: { ...metadata.textWatermark, ...partial } });
    };

    const resetAll = () => onChange({ ...defaultMetadata, enabled: metadata.enabled });

    const hasData = [
        metadata.title, metadata.author, metadata.copyright,
        metadata.description, metadata.keywords, metadata.organization,
        metadata.website,
    ].some(v => v.trim() !== '');

    const filledCount = [
        metadata.title, metadata.author, metadata.copyright,
        metadata.description, metadata.keywords, metadata.organization,
        metadata.website,
    ].filter(v => v.trim() !== '').length;

    return (
        <div className="space-y-4">
            {/* Master Toggle */}
            <div className={`rounded-xl border-2 p-4 transition-all duration-300 ${metadata.enabled
                ? 'border-indigo-400 dark:border-indigo-500/60 bg-indigo-50 dark:bg-indigo-500/10'
                : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${metadata.enabled
                            ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30'
                            : 'bg-gray-100 dark:bg-white/[0.06]'
                            }`}>
                            <Tag className={`w-4 h-4 ${metadata.enabled ? 'text-white' : 'text-gray-400 dark:text-white/40'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-white/90">Metadata Injector</p>
                            <p className="text-[11px] text-gray-500 dark:text-white/40">
                                {metadata.enabled
                                    ? filledCount > 0
                                        ? `${filledCount} field${filledCount !== 1 ? 's' : ''} configured`
                                        : 'Active · no fields filled yet'
                                    : 'Embed info into exported images'
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => update('enabled', !metadata.enabled)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${metadata.enabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-white/[0.12]'
                            }`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${metadata.enabled ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                    </button>
                </div>

                {metadata.enabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-500/20 flex items-center gap-2"
                    >
                        <div className="flex items-center gap-1.5">
                            <Info className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                            <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                                Metadata is embedded as PNG/JPEG comment chunks on export
                            </p>
                        </div>
                        {hasData && (
                            <button
                                onClick={resetAll}
                                className="ml-auto flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 dark:text-red-400 font-medium transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Fields — only visible when enabled */}
            <AnimatePresence>
                {metadata.enabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-3"
                    >
                        {/* Core Identity */}
                        <Section title="Identity" icon={User} iconColor="text-indigo-400" defaultOpen badge={filledCount > 0 ? `${filledCount}` : undefined} badgeColor="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                            <MetaField
                                label="Title"
                                icon={Tag}
                                value={metadata.title}
                                onChange={v => update('title', v)}
                                placeholder="e.g. Official Campaign Photo"
                            />
                            <MetaField
                                label="Author"
                                icon={User}
                                value={metadata.author}
                                onChange={v => update('author', v)}
                                placeholder="e.g. Juan dela Cruz"
                            />
                            <MetaField
                                label="Copyright"
                                icon={Copyright}
                                value={metadata.copyright}
                                onChange={v => update('copyright', v)}
                                placeholder={`e.g. © ${new Date().getFullYear()} COMELEC`}
                                iconColor="text-amber-400"
                            />
                        </Section>

                        {/* Description & Keywords */}
                        <Section title="Description & Keywords" icon={FileText} iconColor="text-emerald-400">
                            <MetaField
                                label="Description"
                                icon={FileText}
                                value={metadata.description}
                                onChange={v => update('description', v)}
                                placeholder="Brief description of the image..."
                                multiline
                                iconColor="text-emerald-400"
                            />
                            <MetaField
                                label="Keywords"
                                icon={Hash}
                                value={metadata.keywords}
                                onChange={v => update('keywords', v)}
                                placeholder="election, comelec, 2025 (comma-separated)"
                                iconColor="text-teal-400"
                            />
                        </Section>

                        {/* Organization */}
                        <Section title="Organization" icon={Building2} iconColor="text-violet-400">
                            <MetaField
                                label="Organization"
                                icon={Building2}
                                value={metadata.organization}
                                onChange={v => update('organization', v)}
                                placeholder="e.g. Commission on Elections"
                                iconColor="text-violet-400"
                            />
                            <MetaField
                                label="Website"
                                icon={Globe}
                                value={metadata.website}
                                onChange={v => update('website', v)}
                                placeholder="e.g. https://comelec.gov.ph"
                                iconColor="text-blue-400"
                            />
                            <MetaField
                                label="Software"
                                icon={Camera}
                                value={metadata.software}
                                onChange={v => update('software', v)}
                                placeholder="Tool used to create this image"
                                iconColor="text-gray-400"
                            />
                        </Section>

                        {/* Custom Fields */}
                        <Section title="Custom Fields" icon={Sparkles} iconColor="text-pink-400" badge="2 slots" badgeColor="bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300">
                            <div className="grid grid-cols-2 gap-2">
                                <MetaField
                                    label="Key 1"
                                    icon={Tag}
                                    value={metadata.customField1Key}
                                    onChange={v => update('customField1Key', v)}
                                    placeholder="Field name"
                                />
                                <MetaField
                                    label="Value 1"
                                    icon={Tag}
                                    value={metadata.customField1Value}
                                    onChange={v => update('customField1Value', v)}
                                    placeholder="Field value"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <MetaField
                                    label="Key 2"
                                    icon={Tag}
                                    value={metadata.customField2Key}
                                    onChange={v => update('customField2Key', v)}
                                    placeholder="Field name"
                                />
                                <MetaField
                                    label="Value 2"
                                    icon={Tag}
                                    value={metadata.customField2Value}
                                    onChange={v => update('customField2Value', v)}
                                    placeholder="Field value"
                                />
                            </div>
                        </Section>

                        {/* Text Watermark Overlay */}
                        <Section title="Text Watermark" icon={FileText} iconColor="text-orange-400" badge="Visual" badgeColor="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                            {/* Toggle */}
                            <div className="flex items-center justify-between py-1">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-white/80">Enable Text Overlay</p>
                                    <p className="text-[11px] text-gray-400 dark:text-white/30">Renders visible text on the image</p>
                                </div>
                                <button
                                    onClick={() => updateTextWatermark({ enabled: !metadata.textWatermark.enabled })}
                                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${metadata.textWatermark.enabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-white/[0.12]'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${metadata.textWatermark.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <AnimatePresence>
                                {metadata.textWatermark.enabled && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-3 overflow-hidden"
                                    >
                                        <MetaField
                                            label="Text"
                                            icon={FileText}
                                            value={metadata.textWatermark.text}
                                            onChange={v => updateTextWatermark({ text: v })}
                                            placeholder={`© ${new Date().getFullYear()} ${metadata.copyright || 'Your Name'}`}
                                            iconColor="text-orange-400"
                                        />

                                        {/* Position */}
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-500 dark:text-white/40 uppercase tracking-widest mb-1.5 block">
                                                Position
                                            </label>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {(['top-left', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map(pos => (
                                                    <button
                                                        key={pos}
                                                        onClick={() => updateTextWatermark({ position: pos })}
                                                        className={`py-1.5 text-[11px] font-semibold rounded-lg border-2 transition-all ${metadata.textWatermark.position === pos
                                                            ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300'
                                                            : 'border-gray-200 dark:border-white/[0.06] text-gray-500 dark:text-white/40 hover:border-orange-300'
                                                            }`}
                                                    >
                                                        {pos.replace('-', '\n')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Font size */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-[11px] font-semibold text-gray-500 dark:text-white/40 uppercase tracking-widest">Font Size</label>
                                                <span className="text-xs font-bold text-orange-500">{metadata.textWatermark.fontSize}px</span>
                                            </div>
                                            <input type="range" min={8} max={72} value={metadata.textWatermark.fontSize}
                                                onChange={e => updateTextWatermark({ fontSize: parseInt(e.target.value) })}
                                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                                style={{ background: `linear-gradient(to right, rgb(249,115,22) 0%, rgb(249,115,22) ${((metadata.textWatermark.fontSize - 8) / 64) * 100}%, rgb(229,231,235) ${((metadata.textWatermark.fontSize - 8) / 64) * 100}%, rgb(229,231,235) 100%)` }}
                                            />
                                        </div>

                                        {/* Opacity */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-[11px] font-semibold text-gray-500 dark:text-white/40 uppercase tracking-widest">Opacity</label>
                                                <span className="text-xs font-bold text-orange-500">{Math.round(metadata.textWatermark.opacity * 100)}%</span>
                                            </div>
                                            <input type="range" min={0} max={1} step={0.01} value={metadata.textWatermark.opacity}
                                                onChange={e => updateTextWatermark({ opacity: parseFloat(e.target.value) })}
                                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                                style={{ background: `linear-gradient(to right, rgb(249,115,22) 0%, rgb(249,115,22) ${metadata.textWatermark.opacity * 100}%, rgb(229,231,235) ${metadata.textWatermark.opacity * 100}%, rgb(229,231,235) 100%)` }}
                                            />
                                        </div>

                                        {/* Colors */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[11px] font-semibold text-gray-500 dark:text-white/40 uppercase tracking-widest mb-1.5 block">Text Color</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="color" value={metadata.textWatermark.color}
                                                        onChange={e => updateTextWatermark({ color: e.target.value })}
                                                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer"
                                                    />
                                                    <span className="text-xs font-mono text-gray-500 dark:text-white/40">{metadata.textWatermark.color}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-semibold text-gray-500 dark:text-white/40 uppercase tracking-widest mb-1.5 block">BG Color</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="color" value={metadata.textWatermark.bgColor}
                                                        onChange={e => updateTextWatermark({ bgColor: e.target.value })}
                                                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer"
                                                    />
                                                    <span className="text-xs font-mono text-gray-500 dark:text-white/40">{metadata.textWatermark.bgColor}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BG Opacity */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-[11px] font-semibold text-gray-500 dark:text-white/40 uppercase tracking-widest">BG Opacity</label>
                                                <span className="text-xs font-bold text-orange-500">{Math.round(metadata.textWatermark.bgOpacity * 100)}%</span>
                                            </div>
                                            <input type="range" min={0} max={1} step={0.01} value={metadata.textWatermark.bgOpacity}
                                                onChange={e => updateTextWatermark({ bgOpacity: parseFloat(e.target.value) })}
                                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                                style={{ background: `linear-gradient(to right, rgb(249,115,22) 0%, rgb(249,115,22) ${metadata.textWatermark.bgOpacity * 100}%, rgb(229,231,235) ${metadata.textWatermark.bgOpacity * 100}%, rgb(229,231,235) 100%)` }}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Section>

                        {/* Preview Card */}
                        {hasData && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Metadata Preview</p>
                                    <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400">Will be embedded on export</span>
                                </div>
                                <div className="space-y-1 font-mono text-[11px] text-emerald-900 dark:text-emerald-300/80">
                                    {metadata.title && <div><span className="opacity-50">Title:</span> {metadata.title}</div>}
                                    {metadata.author && <div><span className="opacity-50">Author:</span> {metadata.author}</div>}
                                    {metadata.copyright && <div><span className="opacity-50">Copyright:</span> {metadata.copyright}</div>}
                                    {metadata.organization && <div><span className="opacity-50">Org:</span> {metadata.organization}</div>}
                                    {metadata.keywords && <div><span className="opacity-50">Keywords:</span> {metadata.keywords}</div>}
                                    {metadata.customField1Key && metadata.customField1Value && (
                                        <div><span className="opacity-50">{metadata.customField1Key}:</span> {metadata.customField1Value}</div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Info note about PNG vs JPG */}
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                            <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-snug">
                                Metadata is embedded as image comments. Most photo viewers and EXIF readers will display it.{' '}
                                <strong>PNG</strong> uses tEXt chunks, <strong>JPG/WebP</strong> uses comment headers.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}