"use client"

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
    FileUp, FileDown, FileText, FileSpreadsheet, Combine,
    Loader2, Image as ImageIcon, FileType, Download, CheckCircle2, X, Trash2,
    AlertCircle, Shield, Moon, Sun
} from 'lucide-react';
import { GiCardExchange } from "react-icons/gi";
import { wordToPDF, pdfToWord, excelToPDF, pdfToExcel, htmlToPDF, combinePDFs, imagesToPDF } from './conversion_function';
import Image from 'next/image';
import Logo from "@/../public/Avexi.png";
import ConversionItem from './item';
import { useAuth } from '@/lib/auth/AuthContext';
import { logActivity } from "@/lib/firebase/firebase.actions.firestore/offlineLogger";

export type ConversionMode =
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

const PDFConverter: React.FC = () => {
    const [mode, setMode] = useState<ConversionMode>('word-to-pdf');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [converting, setConverting] = useState(false);
    const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth()

    // Dark Mode Toggle Logic
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

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
        { id: 'word-to-pdf', label: 'Word → PDF', icon: FileText, accept: '.doc,.docx', outputExt: '.pdf', description: 'Convert Word documents', color: 'text-blue-500' },
        { id: 'pdf-to-word', label: 'PDF → Word', icon: FileDown, accept: '.pdf', outputExt: '.txt', description: 'Extract text from PDF', color: 'text-indigo-500' },
        { id: 'excel-to-pdf', label: 'Excel → PDF', icon: FileSpreadsheet, accept: '.xls,.xlsx,.csv', outputExt: '.pdf', description: 'Convert spreadsheets', color: 'text-green-500' },
        { id: 'pdf-to-excel', label: 'PDF → Excel', icon: FileUp, accept: '.pdf', outputExt: '.xlsx', description: 'Extract data to Excel', color: 'text-emerald-500' },
        { id: 'image-to-pdf', label: 'Images → PDF', icon: ImageIcon, accept: 'image/jpeg,image/png', outputExt: '.pdf', multiple: true, description: 'Combine images into PDF', color: 'text-violet-500' },
        { id: 'html-to-pdf', label: 'HTML → PDF', icon: FileType, accept: '.html', outputExt: '.pdf', description: 'Render HTML as PDF', color: 'text-amber-500' },
        { id: 'combine-pdf', label: 'Combine PDFs', icon: Combine, accept: '.pdf', outputExt: '.pdf', multiple: true, description: 'Merge multiple PDFs', color: 'text-pink-500' },
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

                    if (!user) return;

                    await logActivity({
                        userName: user.displayName ?? "Unknown",
                        userEmail: user.email ?? "unknown@email.com",
                        function: `"download_by_${mode}`,
                        urlPath: "/Documents/Pdf",
                    });

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
        <div className="min-h-screen w-full overflow-y-auto transition-colors duration-500 bg-slate-50 dark:bg-[#070710]">

            {/* Background glows */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 dark:opacity-15 blur-[100px]"
                    style={{ background: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.5) 0%, transparent 70%)" }} />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-5 dark:opacity-10 blur-[80px]"
                    style={{ background: "radial-gradient(circle at 0% 100%, rgba(20,184,166,0.3) 0%, transparent 70%)" }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 pb-24">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                            <GiCardExchange className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <h1 className="font-syne text-3xl font-extrabold tracking-tight text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-slate-400">
                            File Converter
                        </h1>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-white/30">Professional client-side document processing</p>

                    <div className="flex items-center justify-center gap-3 mt-4">
                        <div className={`w-2 h-2 rounded-full ${pdfJsLoaded ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/20">
                            {pdfJsLoaded ? 'Engines Ready' : 'Initializing…'}
                        </span>
                        <span className="text-slate-200 dark:text-white/10">|</span>
                        <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider">Secure & Local</span>
                    </div>
                </div>

                {/* Mode selector */}
                <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-6 mb-6 shadow-sm dark:shadow-none">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mb-5">
                        Select Mode
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {allModes.map(m => {
                            const Icon = m.icon;
                            const isActive = mode === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => { setMode(m.id); clearAll(); }}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all 
                                        ${isActive
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-500/50 shadow-md dark:shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                                            : 'border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02] hover:border-slate-200 dark:hover:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                                        }`}
                                >
                                    <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-600 dark:text-indigo-300' : m.color + ' opacity-50 dark:opacity-40'}`} />
                                    <span className={`text-[11px] font-bold leading-tight ${isActive ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-500 dark:text-white/30'}`}>
                                        {m.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Drop zone */}
                <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-6 mb-6 shadow-sm dark:shadow-none">
                    <div
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
                            ${dragActive
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/[0.06] scale-[1.01]'
                                : 'border-slate-200 dark:border-white/[0.08] hover:border-indigo-300 dark:hover:border-white/[0.15]'
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
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-5">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border transition-all
                                ${dragActive
                                    ? 'bg-indigo-100 border-indigo-400 dark:bg-indigo-500/20 dark:border-indigo-500/40'
                                    : 'bg-slate-50 border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.08]'
                                }`}>
                                <CurrentIcon className={`w-10 h-10 ${dragActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-300 dark:text-white/10'}`} />
                            </div>
                            <div>
                                <p className="text-base font-bold text-slate-700 dark:text-white/60 mb-1">
                                    {currentMode?.multiple ? 'Drop files or click to browse' : 'Drop file or click to browse'}
                                </p>
                                <p className="text-xs font-medium text-slate-400 dark:text-white/20">
                                    {currentMode?.description} · {currentMode?.accept}
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* File list component */}
                {files.length > 0 && (
                    <ConversionItem
                        files={files}
                        clearAll={clearAll}
                        downloadFile={downloadFile}
                        removeFile={removeFile}
                        converting={converting}
                    />
                )}

                {/* Convert button */}
                {files.length > 0 && files.every(f => f.status === 'ready') && (
                    <div className="mb-6">
                        <button
                            onClick={handleConvert}
                            disabled={converting}
                            className={`w-full py-5 px-8 rounded-2xl font-bold text-white text-sm uppercase tracking-widest
                                flex items-center justify-center gap-3 transition-all
                                ${converting
                                    ? 'bg-slate-200 dark:bg-white/[0.06] text-slate-400 dark:text-white/20 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-[0.98]'
                                }`}
                        >
                            {converting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" />Processing…</>
                            ) : (
                                <><CurrentIcon className="w-5 h-5" />Convert {files.length} {files.length === 1 ? 'File' : 'Files'}</>
                            )}
                        </button>
                    </div>
                )}

                {/* Success state */}
                {hasCompletedFiles && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200 dark:border-emerald-500/20 rounded-3xl p-6
                        flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20
                                flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">Ready for Download</p>
                                <p className="text-xs font-medium text-emerald-600/60 dark:text-emerald-400/60">Success! Your files are processed localy.</p>
                            </div>
                        </div>
                        <button onClick={downloadAllFiles}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl
                                bg-emerald-600 border border-emerald-500 text-white
                                text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20">
                            <Download className="w-4 h-4" /> Download All
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Image src={Logo} alt="Avexi" width={18} className="opacity-50 grayscale dark:grayscale-0 dark:opacity-100" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/20 tracking-[0.3em] uppercase">Avexi Studio</span>
                    </div>
                    <p className="text-[10px] text-slate-300 dark:text-white/10 font-medium">
                        Powered by pdf-lib · SheetJS · PDF.js · Web Workers
                    </p>
                </div>
            </div>
        </div >
    );
};

export default PDFConverter;