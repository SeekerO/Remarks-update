"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useLayoutEffect, useState } from "react";
import * as XLSX from "xlsx";
import { IoCloudUploadOutline, IoChevronBack } from "react-icons/io5";
import stringSimilarity from "string-similarity";
import { MdDelete } from "react-icons/md";
import Link from "next/link";

const Checker = () => {
    const [dataSet, setDataSet] = useState<any[]>([]);
    const [dataSetEvaluated, setDataSetEvaluated] = useState<any[]>([]);
    const [matchedData, setMatchedData] = useState<any[]>([]);
    const [list, setList] = useState<any[]>([])

    const [searchDataSet, setSearchDataSet] = useState<string>("")
    const [searchDataSetEvaluated, setSearchDataSetEvaluated] = useState<string>("")
    const [searchResult, setSearchResult] = useState<string>("")


    useLayoutEffect(() => {
        try {
            const dataSetSession = JSON.parse(sessionStorage.getItem("data_set") || "[]");
            const dataSetEvaluatedSession = JSON.parse(sessionStorage.getItem("clc_data") || "[]");
            const matchedDataSession = JSON.parse(sessionStorage.getItem("matched_data") || "[]");
            const listSession = JSON.parse(sessionStorage.getItem("list_data") || "[]");

            setDataSet(dataSetSession);
            setDataSetEvaluated(dataSetEvaluatedSession);
            setMatchedData(matchedDataSession);
            setList(listSession);
        } catch (error) {
            console.error("Error parsing session storage data:", error);
        }
    }, []);




    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: "data_set" | "clc_data") => {
        const file = event.target.files?.[0];
        if (!file) {
            alert("Please select a file.");
            return;
        }

        const reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = (e) => {
            if (!e.target?.result) {
                alert("Error reading file.");
                return;
            }

            const bufferArray = e.target.result as ArrayBuffer;
            const workbook = XLSX.read(bufferArray, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            let jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            // Filter out empty rows
            jsonData = jsonData.filter((row) => Object.values(row)[0] !== "");

            if (type === "data_set") {
                setDataSet(jsonData);
                sessionStorage.setItem("data_set", JSON.stringify(jsonData));

            } else if (type === "clc_data") {
                setDataSetEvaluated(jsonData);
                sessionStorage.setItem("clc_data", JSON.stringify(jsonData));
            }
        };

        reader.onerror = (error) => {
            console.error("File reading error:", error);
            alert("Error reading file. Please try again.");
        };
    };

    const matchNames = () => {
        if (!dataSet.length || !dataSetEvaluated.length) {
            alert("Please upload both datasets.");
            return;
        }

        const matches: any[] = [];

        dataSetEvaluated.forEach((evalEntry) => {
            const { FULLNAME: nameA, REGION: regionA } = evalEntry;
            const normalizedA = normalizeName(nameA);

            const bestMatch = dataSet
                .map((clcEntry) => ({
                    name: clcEntry.FULLNAME,
                    region: clcEntry.REGION,
                    score: stringSimilarity.compareTwoStrings(normalizedA, normalizeName(clcEntry.FULLNAME)),
                }))
                .sort((a, b) => b.score - a.score)[0]; // Get the best match

            if (bestMatch && bestMatch.score > 0.7) { // Threshold for similarity
                matches.push({
                    nameA,
                    regionA,
                    nameB: bestMatch.name,
                    regionB: bestMatch.region,
                    similarity: bestMatch.score.toFixed(2),
                });
            }
        });

        setMatchedData(matches);


        // Step 2: Extract distinct different regions
        const differentRegions = Array.from(
            new Set(
                matches
                    .filter(({ regionA, regionB }) => regionA !== regionB) // Only keep different regions
                    .map(({ regionB }) => regionB) // Extract regionB
            )
        );

        setList(differentRegions);

        sessionStorage.setItem("matched_data", JSON.stringify(matches));
        sessionStorage.setItem("list_data", JSON.stringify(differentRegions));
    };

    const filteredDataSet = dataSet.filter((row: any) => Object.values(row).some((value) => value?.toString().toLowerCase().includes(searchDataSet.toLowerCase())))
    const filteredDataEval = dataSetEvaluated.filter((row: any) => Object.values(row).some((value) => value?.toString().toLowerCase().includes(searchDataSetEvaluated.toLowerCase())))
    const filteredDataMatch = matchedData.filter((row: any) => Object.values(row).some((value) => value?.toString().toLowerCase().includes(searchResult.toLowerCase())))


    const removeFunction = (type: "all_data" | "data_set" | "clc_data") => {
        console.log(`Removing ${type}...`);

        // Helper function to clear state & sessionStorage
        const clearData = (stateSetter: React.Dispatch<React.SetStateAction<any[]>>, key: string) => {
            stateSetter([]);
            sessionStorage.removeItem(key);
        };

        switch (type) {
            case "data_set":
                clearData(setDataSet, "data_set");
                break;
            case "clc_data":
                clearData(setDataSetEvaluated, "clc_data");
                break;
            case "all_data":
                clearData(setDataSet, "data_set");
                clearData(setDataSetEvaluated, "clc_data");
                break;
        }

        clearData(setMatchedData, "matched_data");
        clearData(setList, "list_data");

        console.log(`${type} removed successfully.`);
    };


    return (
        <div className="h-screen w-screen flex flex-col bg-gray-800 overflow-hidden">
            <div className="w-full mt-4 mb-4 px-2">
                <Link
                    href="/"
                    className="text-slate-100 flex gap-1 items-center font-semibold hover:text-blue-700"
                >
                    <IoChevronBack className="text-[2rem]" />
                    BACK
                </Link>
            </div>
            <div className="px-10">
                <div className="flex flex-col w-full h-[100px] px-5 py-2 bg-gray-100 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <h1 className="text-[1.7rem] font-semibold tracking-widest">CHECKER</h1>
                        <div className="text-[1.7rem] font-semibold tracking-widest flex gap-5 text-white">
                            <button onClick={() => removeFunction("data_set")}
                                className="flex items-center text-[1rem] bg-red-500 px-2 py-1 rounded-md gap-1 hover:scale-110 duration-300 hover:bg-red-800"><MdDelete className="text-[1.2rem]" /> Delete Data Set</button>
                            <button onClick={() => removeFunction("clc_data")}
                                className="flex items-center text-[1rem] bg-red-500 px-2 py-1 rounded-md gap-1 hover:scale-110 duration-300 hover:bg-red-800"><MdDelete className="text-[1.2rem]" /> Delete Data CLC</button>
                            <button onClick={() => removeFunction("all_data")}
                                className="flex items-center text-[1rem] bg-red-500 px-2 py-1 rounded-md gap-1 hover:scale-110 duration-300 hover:bg-red-800"><MdDelete className="text-[1.2rem]" /> Delete All</button>
                        </div>
                    </div>
                    <div>Step</div>
                </div>

                <div className="flex w-full h-[75vh] bg-slate-100 p-5 rounded-b-xl gap-2">
                    {/* Upload Box for Evaluated Data */}
                    <div className="flex flex-col w-[50vh] h-full shrink-0 bg-gray-800 text-white rounded-lg overflow-x-hidden overflow-y-auto">

                        {dataSet.length === 0 ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <div className="flex flex-col">
                                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg cursor-pointer hover:scale-110 duration-300">
                                        <IoCloudUploadOutline className="text-[20px]" /> Upload
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls, .csv"
                                            onChange={(e) => handleFileUpload(e, "data_set")}
                                            className="hidden"
                                        />
                                    </label>
                                    <label className="italic font-thin tracking-widest">Upload Evaluated Names Here</label>
                                </div>
                            </div>
                        ) : <div>
                            <div className="px-2 pt-2">
                                <SearchBar searchText={searchDataSet} searchSetter={setSearchDataSet} />
                            </div>
                            {
                                filteredDataSet.map((value, index) => (
                                    <div key={index} className="text-[0.9rem] items-center flex p-2 gap-2 border-b border-slate-300 justify-between">
                                        <div className="font-semibold">{value.FULLNAME}</div>
                                        <div className="w-[100px] bg-slate-100 text-black shrink-0 font-semibold flex items-center justify-center py-1 rounded-md shadow-md">
                                            {value.REGION}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>}
                    </div>

                    {/* Results Section */}
                    <div className="w-full h-full flex flex-col bg-gray-800 p-4 rounded-lg">
                        <div className="flex flex-col border-b-[1px] w-full border-slate-500 mb-2 py-2 gap-2 items-center justify-between">
                            <div className="w-full flex items-center justify-between">
                                {dataSetEvaluated.length !== 0 && dataSet.length !== 0 && <button
                                    onClick={matchNames}
                                    className="bg-gray-100 text-gray-800 py-1 px-4 h-fit rounded-md hover:bg-blue-500 duration-300"
                                >
                                    Check
                                </button>}

                                <div className="w-[50vh]">
                                    <SearchBar searchText={searchResult} searchSetter={setSearchResult} />
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 w-full">
                                {list.map(value => (<a onClick={() => setSearchResult(value)} key={value} className="text-white border-[1px] border-gray-100 px-2 rounded-md text-sm">{value}</a>))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 h-full w-full overflow-hidden">
                            <div className="w-full text-center text-gray-100 font-semibold tracking-widest py-1">MATCHED DATA</div>
                            <div className="h-[100%] overflow-auto">
                                {filteredDataMatch.map((match, index) => (
                                    <div key={index} className="border-b py-1 text-white flex justify-between">
                                        <label>
                                            {match.nameA} ({match.regionA}) ⇄ {match.nameB} <span className={`font-semibold ${(match.similarity * 100) >= 90 ? "text-green-500" : (match.similarity * 100) < 50 ? "text-red-500" : "text-yellow-500"}`}>({match.regionB})</span>
                                        </label>
                                        <div className={`${(match.similarity * 100) >= 90 ? "bg-green-500" : (match.similarity * 100) < 50 ? "bg-red-500" : "bg-yellow-500"} text-[0.7rem] border-[1px] border-white h-10 w-10 flex items-center justify-center p-2 rounded-full ml-10`}>{match.similarity * 100}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Upload Box for CLC Data */}
                    <div className="flex flex-col w-[50vh] h-full shrink-0 bg-slate-400 text-black rounded-lg overflow-x-hidden overflow-y-auto">
                        {dataSetEvaluated.length === 0 ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <div className="flex flex-col">
                                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg cursor-pointer hover:scale-110 duration-300">
                                        <IoCloudUploadOutline className="text-[20px]" /> Upload
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls, .csv"
                                            onChange={(e) => handleFileUpload(e, "clc_data")}
                                            className="hidden"
                                        />
                                    </label>
                                    <label className="italic font-thin tracking-widest">Upload CLC Names Here</label>
                                </div>
                            </div>
                        ) : <>
                            <div className="px-2 pt-2">
                                <SearchBar searchText={searchDataSetEvaluated} searchSetter={setSearchDataSetEvaluated} />
                            </div>
                            {filteredDataEval.map((value, index) => (
                                <div key={index} className="text-[0.9rem] items-center flex p-2 gap-2 border-b border-slate-900 justify-between">
                                    <div className="font-semibold">{value.FULLNAME}</div>
                                </div>
                            ))}
                        </>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checker;

const normalizeName = (name: string) => {
    return name
        .replace(/[^a-zA-Z0-9 ]/g, "") // Remove special characters
        .replace(/\b(Jr|Sr|II|III|IV|V)\b/gi, "") // Remove suffixes
        .toLowerCase()
        .trim();
};

const SearchBar = ({ searchText, searchSetter }: { searchText: string, searchSetter: React.Dispatch<React.SetStateAction<string>> }) => {
    return (
        <div className="h-[30px] w-full bg-slate-100 rounded-md">
            <input
                type="text"
                value={searchText}
                onChange={(e) => searchSetter(e.target.value)}
                placeholder="Search"
                className="w-full h-full bg-transparent px-2 text-black outline-none"
            />
        </div>
    );
};


