import { useState, useRef } from "react";
import { MdOutlineAutoGraph, MdUploadFile } from "react-icons/md";
import { IoSearch } from "react-icons/io5";

const ResultItem = ({ value }: { value: any }) => {
    const score = value.score;
    const color = score > 90 ? "emerald" : score > 85 ? "indigo" : "rose";

    return (
        <div className="group relative p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22]/50 hover:bg-slate-50 dark:hover:bg-[#161b22] transition-all duration-300 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col min-w-0">
                    <span className="text-slate-900 dark:text-white font-semibold truncate tracking-tight text-base">
                        {value.row1[0]}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">Best Match</span>
                        <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium truncate italic">
                            {value.bestMatch[0]}
                        </span>
                    </div>
                </div>
                <div className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl border border-${color}-200 dark:border-${color}-500/30 bg-${color}-50 dark:bg-${color}-500/10`}>
                    <span className={`text-lg font-bold text-${color}-600 dark:text-${color}-400`}>{score}</span>
                    <span className="text-[8px] uppercase font-black text-slate-400 dark:text-slate-500">%</span>
                </div>
            </div>
            {(value.row1[1] || value.bestMatch[1]) && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 grid grid-cols-2 gap-4">
                    <span className="text-xs text-slate-500 truncate">{value.row1[1] || "—"}</span>
                    <span className="text-xs text-indigo-500 dark:text-indigo-500/70 truncate">{value.bestMatch[1] || "—"}</span>
                </div>
            )}
        </div>
    );
};

const DataSetPanel = ({ title, data, filteredData, inputSearch, setInputSearch, setDataSet }: any) => {
    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-[#11161d] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 overflow-hidden transition-all shadow-sm dark:shadow-none">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{title}</h3>
                {data?.length > 0 && (
                    <div className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {data.length} Entries
                    </div>
                )}
            </div>
            {data && (
                <div className="relative mb-4">
                    <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search dataset..."
                        value={inputSearch}
                        onChange={(e) => setInputSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                </div>
            )}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {data ? (
                    filteredData.length > 0 ? (
                        filteredData.map((value: string[], index: number) => (
                            <div key={index} className="group p-3 mb-2 bg-slate-50/50 dark:bg-[#161b22]/40 border border-slate-100 dark:border-slate-800/40 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{value[0]}</p>
                                {value[1] && <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5 truncate uppercase tracking-wider">{value[1]}</p>}
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-400 dark:text-slate-600 text-sm mt-10">No results found.</p>
                    )
                ) : (
                    <UploadButton set={setDataSet} />
                )}
            </div>
        </div>
    );
};

const UploadButton = ({ set }: { set: any }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState("");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            set(file);
        }
    };

    return (
        <div
            onClick={() => fileInputRef.current?.click()}
            className="h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 hover:border-indigo-300 dark:hover:border-indigo-500/40 cursor-pointer transition-all group"
        >
            <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <MdUploadFile className="text-4xl text-slate-400 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </div>
            <button className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 mb-2 hover:bg-indigo-700 transition-colors">
                {fileName ? "Change File" : "+ Add Files"}
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {fileName ? fileName : "Large files will be auto-optimized"}
            </p>
        </div>
    );
};

const LoadingState = () => (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Analyzing Datasets...</p>
    </div>
);

const NoResults = ({ message }: { message: string }) => (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60 dark:opacity-40">
        <MdOutlineAutoGraph size={64} className="mb-4 text-slate-300 dark:text-slate-600" />
        <p className="text-lg font-bold text-slate-700 dark:text-slate-400">Analysis Engine Idle</p>
        <p className="text-sm text-slate-500 max-w-xs">{message}</p>
    </div>
);

export { NoResults, LoadingState, UploadButton, DataSetPanel, ResultItem };