"use client";

import React, { useRef, useState } from "react";
import { compareExcelFilesFuzzy } from "@/lib/util/compare";
import SideMenu from "./components/sidemenu";
import { useAuth } from "../../lib/auth/AuthContext";
import { IoAnalytics } from "react-icons/io5";
import { MdPlayArrow, MdDelete } from 'react-icons/md';
import { NoResults, LoadingState, UploadButton, DataSetPanel, ResultItem } from "./components/supporting"
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
            setRes(result);
        } catch (err: any) {
            setError("An error occurred during matching. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const filterData = (data: any[]) => {
        if (!inputSearch) return data;
        return data?.filter((item: string[]) =>
            item.some(value => value.toString().toLowerCase().includes(inputSearch.toLowerCase()))
        );
    };

    const filteredData1 = filterData(res?.data1);
    const filteredData2 = filterData(res?.data2);
    const filteredResults = res?.matched?.filter((item: any) =>
        item?.row1[0].toLowerCase().includes(inputSearch.toLowerCase())
    );

    const handleDeleteData = () => {
        setDataSet1(null);
        setDataSet2(null);
        setRes(null);
        setInputSearch("");
    };

    if (!user && !(user as any)?.canChat) return null;

    return (
        <div className="h-screen w-screen bg-[#0b0e14] text-slate-200 font-sans antialiased flex flex-col p-4 lg:p-6 overflow-hidden">

            {/* Main Content Area */}
            <main className="flex-1 w-full flex flex-col lg:flex-row gap-6 min-h-0">

                {/* Left Side: Data Set Panels */}
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

                {/* Right Side: Results & Controls */}
                <section className="flex flex-col w-full lg:w-[60%] bg-[#11161d] border border-slate-800/60 rounded-2xl shadow-2xl p-6 h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <IoAnalytics size={20} />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-white">Comparison Analysis</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            {dataset1 && dataset2 && !res && (
                                <button
                                    onClick={handleMatchingMethod}
                                    disabled={loading}
                                    className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? "Processing..." : <><MdPlayArrow className="mr-2 text-xl" /> Run Match</>}
                                </button>
                            )}
                            {res && (
                                <button onClick={handleDeleteData} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                                    <MdDelete size={22} />
                                </button>
                            )}
                            <SideMenu res={res} threshold={threshold} SetThreshold={SetThreshold} />
                        </div>
                    </div>

                    {/* Results Display Area */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {error ? (
                            <div className="h-full flex items-center justify-center text-red-400 bg-red-400/5 rounded-xl border border-red-400/20">{error}</div>
                        ) : loading ? (
                            <LoadingState />
                        ) : res?.matched?.length > 0 ? (
                            filteredResults.map((value: any, index: number) => <ResultItem key={index} value={value} />)
                        ) : (
                            <NoResults message="Upload your spreadsheets and click 'Run Match' to begin analysis." />
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Matcher;

// Sub-components (ResultItem, DataSetPanel, etc.) would follow here or in separate files.
