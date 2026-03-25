/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useRef, useEffect, useState } from "react";
import { IoSearch } from "react-icons/io5";
import { RiCloseFill, RiFileWarningLine } from "react-icons/ri";

type Props = { data: any; open: boolean; set: React.Dispatch<React.SetStateAction<boolean>>; };

const UnmatchedList = ({ data, open, set }: Props) => {
    const [inputSearch, setInputSearch] = useState<string>("");
    const ref = useRef<HTMLDivElement | null>(null);

    const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) set(false);
    };

    const filteredItems = data?.filter((item: any) =>
        item[0]?.toString().toLowerCase().includes(inputSearch.toLowerCase())
    );

    useEffect(() => {
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "unset";
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] h-screen w-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-200/60 dark:bg-[#0b0e14]/80 backdrop-blur-md transition-colors" />
            <div
                ref={ref}
                className="relative flex flex-col w-full max-w-2xl h-[85vh] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden transition-colors"
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#161b22]/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-500">
                            <RiFileWarningLine size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Unmatched Records</h2>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mt-0.5">{data?.length || 0} items found</p>
                        </div>
                    </div>
                    <button onClick={() => set(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <RiCloseFill size={26} />
                    </button>
                </div>
                <div className="px-6 py-4 bg-white dark:bg-[#11161d]">
                    <div className="relative group">
                        <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            value={inputSearch}
                            onChange={(e) => setInputSearch(e.target.value)}
                            placeholder="Search through unmatched entries..."
                            className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-700/50 rounded-2xl py-3 pl-12 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar bg-white dark:bg-[#0d1117]">
                    {filteredItems && filteredItems.length > 0 ? (
                        filteredItems.map((value: any, index: number) => (
                            <div key={index} className="group flex items-center justify-between p-4 bg-slate-50/50 dark:bg-[#161b22]/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl transition-all">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{value[0]}</span>
                                    {value[1] && <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">REF: {value[1]}</span>}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase">Unresolved</span>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-20">
                            <IoSearch size={30} className="text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-bold">No results found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnmatchedList;