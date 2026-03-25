/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { RiCloseFill, RiSettings4Fill } from "react-icons/ri";
import { MdOutlineTune } from "react-icons/md";
import UnmatchedList from "./unmatchedlist_modal";

const SideMenu = ({
    res,
    threshold,
    SetThreshold,
}: {
    res: any;
    threshold: number;
    SetThreshold: React.Dispatch<React.SetStateAction<number>>;
}) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [side, setSide] = useState<boolean>(false);
    const [openUnmatchedList, setOpenUnmatchedList] = useState<boolean>(false);

    const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            setSide(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <button
                onClick={() => setSide(!side)}
                className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 border shadow-lg ${side
                    ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/50 text-rose-600 dark:text-rose-500"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-200 dark:hover:border-slate-500"
                    }`}
            >
                {!side ? <MdOutlineTune size={22} /> : <RiCloseFill size={24} />}
            </button>

            <UnmatchedList data={res?.unmatched} open={openUnmatchedList} set={setOpenUnmatchedList} />

            <div
                ref={ref}
                className={`absolute top-24 right-6 lg:right-10 w-72 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 flex flex-col gap-6 transition-all duration-500 transform z-50
                ${side ? "opacity-100 translate-y-0 scale-100 visible" : "opacity-0 -translate-y-4 scale-95 invisible"}`}
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <RiSettings4Fill size={16} />
                        <label htmlFor="threshold" className="text-[10px] font-black uppercase tracking-[0.15em]">Fuzzy Match Sensitivity</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            id="threshold"
                            type="number"
                            className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                            value={threshold}
                            onChange={(e) => SetThreshold(Number(e.target.value))}
                        />
                        <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Lower results in broader matches. Recommended: 85%.</p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
                    {res?.unmatched?.length > 0 ? (
                        <button
                            onClick={() => { setOpenUnmatchedList(true); setSide(false); }}
                            className="w-full py-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                        >
                            View Unmatched List ({res.unmatched.length})
                        </button>
                    ) : (
                        <div className="w-full text-center py-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-600 tracking-widest">All data matched</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SideMenu;