"use client"

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
    FileUp, FileDown, FileText, FileSpreadsheet, Combine,
    Loader2, Image as ImageIcon, FileType, Download, CheckCircle2, X, Trash2,
    AlertCircle, Shield
} from 'lucide-react';
import { GiCardExchange } from "react-icons/gi";
import { wordToPDF, pdfToWord, excelToPDF, pdfToExcel, htmlToPDF, combinePDFs, imagesToPDF } from './conversion_function';
import Image from 'next/image';
import Logo from "@/../public/Avexi.png"

type ConversionMode =
    'pdf-to-word' | 'pdf-to-excel' | 'word-to-pdf' | 'excel-to-pdf' |
    'combine-pdf' | 'image-to-pdf' | 'html-to-pdf';

export interface FileItem {
    id: string;
    file: File;
    name: string;
    size: string;
    status: 'ready' | 'processing' | 'complete' | 'error';
    downloadUrl?: string;
    outputName?: string;
    error?: string;
}

export interface ModeConfig {
    id: ConversionMode;
    label: string;
    icon: React.ElementType;
    accept: string;
    outputExt: string;
    multiple?: boolean;
    description: string;
    color: string;
}

// ── Nexus Logo Mark ───────────────────────────────────────────────────────────
function NexusLogoMark({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#6366f1" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3.5" fill="#818cf8" />
            <circle cx="12" cy="12" r="1.5" fill="#0d0d1a" />
        </svg>
    );
}

const PDFConverter: React.FC = () => {
    const [mode, setMode] = useState<ConversionMode>('word-to-pdf');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [converting, setConverting] = useState(false);
    const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        script.onload = () => {
            if ((window as any).pdfjsLib) {
                (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                setPdfJsLoaded(true);
            }
        };
        document.body.appendChild(script);
        return () => { if (document.body.contains(script)) document.body.removeChild(script); };
    }, []);

    const allModes: ModeConfig[] = useMemo(() => [
        { id: 'word-to-pdf', label: 'Word → PDF', icon: FileText, accept: '.doc,.docx', outputExt: '.pdf', description: 'Convert Word documents', color: 'text-blue-400' },
        { id: 'pdf-to-word', label: 'PDF → Word', icon: FileDown, accept: '.pdf', outputExt: '.txt', description: 'Extract text from PDF', color: 'text-indigo-400' },
        { id: 'excel-to-pdf', label: 'Excel → PDF', icon: FileSpreadsheet, accept: '.xls,.xlsx,.csv', outputExt: '.pdf', description: 'Convert spreadsheets', color: 'text-green-400' },
        { id: 'pdf-to-excel', label: 'PDF → Excel', icon: FileUp, accept: '.pdf', outputExt: '.xlsx', description: 'Extract data to Excel', color: 'text-emerald-400' },
        { id: 'image-to-pdf', label: 'Images → PDF', icon: ImageIcon, accept: 'image/jpeg,image/png', outputExt: '.pdf', multiple: true, description: 'Combine images into PDF', color: 'text-violet-400' },
        { id: 'html-to-pdf', label: 'HTML → PDF', icon: FileType, accept: '.html', outputExt: '.pdf', description: 'Render HTML as PDF', color: 'text-amber-400' },
        { id: 'combine-pdf', label: 'Combine PDFs', icon: Combine, accept: '.pdf', outputExt: '.pdf', multiple: true, description: 'Merge multiple PDFs', color: 'text-pink-400' },
    ], []);

    const currentMode = allModes.find(m => m.id === mode);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const generateOutputName = (inputName: string, newExtension: string): string =>
        inputName.replace(/\.[^/.]+$/, '') + newExtension;

    const processFiles = (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) return;
        const newFiles: FileItem[] = selectedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file, name: file.name,
            size: formatFileSize(file.size),
            status: 'ready'
        }));
        if (currentMode?.multiple) {
            setFiles(prev => [...prev, ...newFiles]);
        } else {
            setFiles(newFiles.slice(0, 1));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) =>
        processFiles(Array.from(e.target.files || []));

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        processFiles(Array.from(e.dataTransfer.files));
    };

    const removeFile = (id: string) => setFiles(files.filter(f => f.id !== id));

    const clearAll = () => {
        files.forEach(f => { if (f.downloadUrl) URL.revokeObjectURL(f.downloadUrl); });
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadFile = (file: FileItem) => {
        if (!file.downloadUrl || !file.outputName) return;
        const a = document.createElement('a');
        a.href = file.downloadUrl;
        a.download = file.outputName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const downloadAllFiles = () =>
        files.forEach(file => { if (file.status === 'complete' && file.downloadUrl) downloadFile(file); });

    const handleConvert = async () => {
        if (files.length === 0 || !currentMode) return;
        if ((mode === 'pdf-to-word' || mode === 'pdf-to-excel') && !pdfJsLoaded) {
            alert('PDF extraction library still loading. Please wait.');
            return;
        }
        setConverting(true);

        if (currentMode.multiple) {
            setFiles(files.map(f => ({ ...f, status: 'processing' })));
            try {
                let blob: Blob;
                if (mode === 'combine-pdf') blob = await combinePDFs(files);
                else blob = await imagesToPDF(files);
                const url = URL.createObjectURL(blob);
                const outputName = mode === 'combine-pdf' ? 'combined.pdf' : 'images.pdf';
                setFiles([{
                    id: 'combined-result', file: new File([blob], outputName),
                    name: 'Combined File', size: formatFileSize(blob.size),
                    status: 'complete', downloadUrl: url, outputName,
                }]);
            } catch (error) {
                setFiles(files.map(f => ({
                    ...f, status: 'error',
                    error: error instanceof Error ? error.message : 'Conversion failed'
                })));
            }
        } else {
            const updatedFiles = [...files];
            for (let i = 0; i < updatedFiles.length; i++) {
                updatedFiles[i] = { ...updatedFiles[i], status: 'processing' };
                setFiles([...updatedFiles]);
                try {
                    let blob: Blob;
                    switch (mode) {
                        case 'word-to-pdf': blob = await wordToPDF(updatedFiles[i]); break;
                        case 'pdf-to-word': blob = await pdfToWord(updatedFiles[i]); break;
                        case 'excel-to-pdf': blob = await excelToPDF(updatedFiles[i]); break;
                        case 'pdf-to-excel': blob = await pdfToExcel(updatedFiles[i]); break;
                        case 'html-to-pdf': blob = await htmlToPDF(updatedFiles[i]); break;
                        default: throw new Error('Invalid conversion mode');
                    }
                    const url = URL.createObjectURL(blob);
                    updatedFiles[i] = {
                        ...updatedFiles[i], status: 'complete',
                        downloadUrl: url,
                        outputName: generateOutputName(updatedFiles[i].name, currentMode.outputExt)
                    };
                } catch (error: any) {
                    updatedFiles[i] = { ...updatedFiles[i], status: 'error', error: error.message || 'Failed' };
                }
                setFiles([...updatedFiles]);
            }
        }
        setConverting(false);
    };

    const hasCompletedFiles = files.some(f => f.status === 'complete');
    const CurrentIcon = currentMode?.icon || FileText;

    return (
        <div className="min-h-screen w-full overflow-y-auto bg-[#070710]">

            {/* Background glows */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-15"
                    style={{ background: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.5) 0%, transparent 60%)" }} />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle at 0% 100%, rgba(20,184,166,0.3) 0%, transparent 60%)" }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 pb-16">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                            <GiCardExchange className="w-4 h-4 text-indigo-400" />
                        </div>

                        <h1 className="text-2xl font-extrabold text-white tracking-tight">File Converter</h1>
                    </div>
                    <p className="text-sm text-white/30">Convert documents securely in your browser</p>

                    {/* Status bar */}
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${pdfJsLoaded ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                        <span className="text-xs text-white/30">
                            {pdfJsLoaded ? 'All engines ready' : 'Loading PDF engine…'}
                        </span>
                        <span className="text-white/10">·</span>
                        <Shield className="w-3 h-3 text-indigo-400" />
                        <span className="text-xs text-indigo-400/70">Client-side only</span>
                    </div>
                </div>

                {/* Mode selector */}
                <div className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-5 mb-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-4">
                        Conversion Type
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {allModes.map(m => {
                            const Icon = m.icon;
                            const isActive = mode === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => { setMode(m.id); clearAll(); }}
                                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all text-center
                                        ${isActive
                                            ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_16px_rgba(99,102,241,0.15)]'
                                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.05]'
                                        }`}
                                >
                                    <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-300' : m.color + ' opacity-60'}`} />
                                    <span className={`text-[11px] font-bold leading-tight ${isActive ? 'text-indigo-200' : 'text-white/40'}`}>
                                        {m.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Drop zone */}
                <div className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-5 mb-5">
                    <div
                        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300
                            ${dragActive
                                ? 'border-indigo-500/60 bg-indigo-500/[0.06] scale-[1.01]'
                                : 'border-white/[0.08] hover:border-white/[0.15]'
                            }`}
                        onDragEnter={handleDrag} onDragLeave={handleDrag}
                        onDragOver={handleDrag} onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple={currentMode?.multiple === true}
                            accept={currentMode?.accept}
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-colors
                                ${dragActive
                                    ? 'bg-indigo-500/20 border-indigo-500/40'
                                    : 'bg-white/[0.04] border-white/[0.08]'
                                }`}>
                                <CurrentIcon className={`w-8 h-8 ${dragActive ? 'text-indigo-300' : 'text-white/20'}`} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white/60 mb-1">
                                    {currentMode?.multiple ? 'Drop files or click to browse' : 'Drop file or click to browse'}
                                </p>
                                <p className="text-xs text-white/20">
                                    {currentMode?.description} · {currentMode?.accept}
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* File list */}
                {files.length > 0 && (
                    <div className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-5 mb-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                                Files ({files.length})
                            </p>
                            <button onClick={clearAll}
                                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Clear All
                            </button>
                        </div>
                        <div className="space-y-2">
                            {files.map((file) => (
                                <div key={file.id}
                                    className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                    <FileText className="w-4 h-4 text-white/20 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white/70 truncate font-medium">{file.name}</p>
                                        <p className="text-xs text-white/30">{file.size}</p>
                                        {file.error && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <AlertCircle className="w-3 h-3 text-red-400" />
                                                <p className="text-xs text-red-400">{file.error}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {file.status === 'ready' && (
                                            <span className="text-[10px] font-medium text-white/20 bg-white/[0.04]
                                                border border-white/[0.06] px-2 py-0.5 rounded-full">Ready</span>
                                        )}
                                        {file.status === 'processing' && (
                                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                        )}
                                        {file.status === 'complete' && (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                {file.downloadUrl && (
                                                    <button onClick={() => downloadFile(file)}
                                                        className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20
                                                            text-indigo-400 hover:bg-indigo-500/20 transition-all">
                                                        <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {file.status === 'error' && <X className="w-4 h-4 text-red-400" />}
                                        {file.status === 'ready' && (
                                            <button onClick={() => removeFile(file.id)} disabled={converting}
                                                className="p-1.5 rounded-lg text-white/20 hover:text-red-400
                                                    hover:bg-red-500/10 transition-all">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Convert button */}
                {files.length > 0 && files.every(f => f.status === 'ready') && (
                    <div className="mb-5">
                        <button
                            onClick={handleConvert}
                            disabled={converting}
                            className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-sm
                                flex items-center justify-center gap-2.5 transition-all
                                ${converting
                                    ? 'bg-white/[0.06] border border-white/[0.08] cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
                                }`}
                        >
                            {converting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Converting…
                                </>
                            ) : (
                                <>
                                    <CurrentIcon className="w-4 h-4" />
                                    Convert {files.length} {files.length === 1 ? 'File' : 'Files'}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Success state */}
                {hasCompletedFiles && (
                    <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-2xl p-5
                        flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                                flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-300">Conversion Complete</p>
                                <p className="text-xs text-emerald-400/60 mt-0.5">Files are ready to download</p>
                            </div>
                        </div>
                        <button onClick={downloadAllFiles}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                                bg-emerald-500/20 border border-emerald-500/30 text-emerald-300
                                text-sm font-semibold hover:bg-emerald-500/30 transition-all">
                            <Download className="w-4 h-4" /> Download All
                        </button>
                    </div>
                )}

                {/* Footer note */}
                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Image src={Logo} alt="Dosmos" width={17} />
                        <span className="text-[10px] text-white/20 tracking-wider">Avexi · File Converter</span>
                    </div>
                    <p className="text-[10px] text-white/15">
                        Powered by pdf-lib · jsPDF · PDF.js · SheetJS · Mammoth
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PDFConverter;