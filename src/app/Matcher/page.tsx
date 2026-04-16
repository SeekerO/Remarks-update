"use client";

import { useState } from "react";
import { compareExcelFilesFuzzy } from "@/lib/util/compare";
import SideMenu from "./components/sidemenu";
import { useAuth } from "../../lib/auth/AuthContext";
import { IoAnalytics } from "react-icons/io5";
import { MdDelete } from 'react-icons/md';
import { NoResults, LoadingState, DataSetPanel, ResultItem } from "./components/supporting";
import { logActivity } from "@/lib/firebase/firebase.actions.firestore/offlineLogger";

const Matcher = () => {
    const { user } = useAuth();
    const [dataset1, setDataSet1] = useState<File | null>(null);
    const [dataset2, setDataSet2] = useState<File | null>(null);
    const [res, setRes] = useState<any>(null);
    const [inputSearch, setInputSearch] = useState<string>("");
    const [threshold, SetThreshold] = useState<number>(85);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleMatchingMethod = async () => {
        if (!dataset1 || !dataset2) return;
        setLoading(true);
        setError(null);
        setRes(null);
        try {
            const file1Buffer = await dataset1.arrayBuffer();
            const file2Buffer = await dataset2.arrayBuffer();
            const result = await compareExcelFilesFuzzy(
                Buffer.from(file1Buffer),
                Buffer.from(file2Buffer),
                threshold
            );
            if (!user) return;

            await logActivity({
                userName: user.displayName ?? "Unknown",
                userEmail: user.email ?? "unknown@email.com",
                function: `process_comparison_analysis`,
                urlPath: "/Documents/Pdf",
            });
            setRes(result);
        } catch (err: any) {
            setError("An error occurred during matching. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to filter the side panels (Source Data)
    const filterData = (data: any[]) => {
        if (!inputSearch) return data;
        const search = inputSearch.toLowerCase();
        return data?.filter((item: string[]) =>
            item.some(value => value?.toString().toLowerCase().includes(search))
        );
    };

    const filteredData1 = filterData(res?.data1);
    const filteredData2 = filterData(res?.data2);

    // Core Fix: Implementation of search in the results (res)
    const filteredResults = res?.matched?.filter((item: any) => {
        const search = inputSearch.toLowerCase();
        // Checks first column of source and first column of the best match
        const sourceText = item?.row1?.[0]?.toString().toLowerCase() || "";
        const matchText = item?.bestMatch?.[0]?.toString().toLowerCase() || "";

        return sourceText.includes(search) || matchText.includes(search);
    });

    const handleDeleteData = () => {
        setDataSet1(null);
        setDataSet2(null);
        setRes(null);
        setInputSearch("");
    };

    if (!user && !(user as any)?.canChat) return null;

    return (
        <div className="h-screen w-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-600 dark:text-slate-200 font-sans antialiased flex flex-col p-4 lg:p-6 overflow-hidden transition-colors duration-300">
            <main className="flex-1 w-full flex flex-col lg:flex-row gap-6 min-h-0">

                {/* Side Panels */}
                <section className="flex flex-col w-full lg:w-[40%] gap-4 h-full">
                    <DataSetPanel
                        title="Data Set UNO"
                        data={res?.data1}
                        filteredData={filteredData1}
                        inputSearch={inputSearch}
                        setInputSearch={setInputSearch}
                        setDataSet={setDataSet1}
                    />
                    <DataSetPanel
                        title="Data Set DOS"
                        data={res?.data2}
                        filteredData={filteredData2}
                        inputSearch={inputSearch}
                        setInputSearch={setInputSearch}
                        setDataSet={setDataSet2}
                    />
                </section>

                {/* Results Panel */}
                <section className="flex flex-col w-full lg:w-[60%] bg-white dark:bg-[#11161d] border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-xl p-6 h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <IoAnalytics size={20} />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Comparison Analysis</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            {dataset1 && dataset2 && !res && (
                                <button
                                    onClick={handleMatchingMethod}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? "Processing..." : "Run Match"}
                                </button>
                            )}
                            {res && (
                                <button onClick={handleDeleteData} className="p-2.5 rounded-xl bg-rose-50 dark:bg-red-500/10 text-rose-600 dark:text-red-400 hover:bg-rose-100 transition-colors">
                                    <MdDelete size={22} />
                                </button>
                            )}
                            <SideMenu res={res} threshold={threshold} SetThreshold={SetThreshold} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {error ? (
                            <div className="h-full flex items-center justify-center text-red-600 bg-red-50 rounded-xl border border-red-200">{error}</div>
                        ) : loading ? (
                            <LoadingState />
                        ) : filteredResults?.length > 0 ? (
                            filteredResults.map((value: any, index: number) => <ResultItem key={index} value={value} />)
                        ) : (
                            <NoResults message={res ? "No matches found for your search." : "Upload datasets to begin."} />
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Matcher;