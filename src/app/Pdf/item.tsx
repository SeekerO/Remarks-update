/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import {
    FileText, X, Check,
    Loader2, Download,
} from 'lucide-react';


const ConversionItem = ({ files, clearAll, downloadFile, removeFile, converting }:
    {
        files: any,
        clearAll: () => void,
        downloadFile: (file: any) => void,
        removeFile: (file: any) => void,
        converting: any
    }
) => {
    return <div className=" rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-700">
                Files ({files.length})
            </h3>
            <button
                onClick={clearAll}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
                Clear All
            </button>
        </div>
        <div className="space-y-2">
            {files.map((file: any) => (
                <div
                    key={file.id}
                    className="flex items-center justify-between p-4  rounded-lg border border-slate-200"
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">{file.size}</p>
                            {file.error && <p className="text-xs text-red-500 mt-1">{file.error}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {file.status === 'ready' && (
                            <span className="text-xs text-slate-500">Ready</span>
                        )}
                        {file.status === 'processing' && (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {file.status === 'complete' && (
                            <>
                                <Check className="w-5 h-5 text-green-500" />
                                {file.downloadUrl && (
                                    <button
                                        onClick={() => downloadFile(file)}
                                        title={`Download ${file.outputName}`}
                                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                        {file.status === 'error' && (
                            <X className="w-5 h-5 text-red-500" />
                        )}
                        {file.status === 'ready' && (
                            <button
                                onClick={() => removeFile(file.id)}
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                                disabled={converting}
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>;
};

export default ConversionItem;
