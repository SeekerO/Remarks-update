import React from 'react';
import { FileText, Loader2, X, Download, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { FileItem } from './page';

interface ConversionItemProps {
    files: FileItem[];
    clearAll: () => void;
    downloadFile: (file: FileItem) => void;
    removeFile: (id: string) => void;
    converting: boolean;
}

const ConversionItem: React.FC<ConversionItemProps> = ({
    files,
    clearAll,
    downloadFile,
    removeFile,
    converting
}) => {
    return (
        <div className="bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-6 mb-6 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
                    Queue ({files.length})
                </p>
                <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 dark:text-white/20 dark:hover:text-red-400 transition-colors uppercase tracking-wider"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
            </div>

            <div className="space-y-3">
                {files.map((file) => (
                    <div
                        key={file.id}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] transition-all hover:border-slate-300 dark:hover:border-white/[0.12]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-slate-400 dark:text-white/20" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 dark:text-white/70 truncate font-bold">{file.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase font-black">{file.size}</p>
                                {file.error && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-slate-200 dark:text-white/10">•</span>
                                        <AlertCircle className="w-3 h-3 text-red-500 dark:text-red-400" />
                                        <p className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase">{file.error}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {file.status === 'ready' && (
                                <span className="text-[9px] font-black text-slate-400 dark:text-white/20 bg-slate-200/50 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.06] px-2.5 py-1 rounded-lg uppercase tracking-widest">
                                    Pending
                                </span>
                            )}

                            {file.status === 'processing' && (
                                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            )}

                            {file.status === 'complete' && (
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    {file.downloadUrl && (
                                        <button
                                            onClick={() => downloadFile(file)}
                                            className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {file.status === 'error' && <X className="w-5 h-5 text-red-500" />}

                            {file.status === 'ready' && (
                                <button
                                    onClick={() => removeFile(file.id)}
                                    disabled={converting}
                                    className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-white/20 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all active:scale-90"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConversionItem;