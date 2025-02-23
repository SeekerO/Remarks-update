/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Link from "next/link";
import React, { useState } from "react";
import { IoSearchOutline, IoChevronBack, IoCloudUploadOutline } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Image from "next/image";
import * as XLSX from "xlsx";
import LZString from "lz-string"; // Import LZString for compression
import kkk from "../../lib/image/KKK.png";


interface EvaluationData {
    FULLNAME: string;
    POSITION: string;
    "MUNICIPALITY/REGION"?: string;
    STATUS: string;
    REMARKS?: string;
}

const ITEMS_PER_PAGE = 50; // Number of rows per page

const Evaluation = () => {
    const [data, setData] = useState<EvaluationData[]>([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false); // Spinner state

    const getStatusColor = (status: string) => {
        if (!status) return "text-gray-500";
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes("full")) return "text-green-700";
        if (lowerStatus.includes("non")) return "text-red-500";
        if (lowerStatus.includes("partial")) return "text-yellow-500";
        return "text-gray-600";
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const binaryString = e.target?.result;
            if (!binaryString) return;

            const workbook = XLSX.read(binaryString, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                console.error("Worksheet not found!");
                return;
            }
            const jsonData: any = XLSX.utils.sheet_to_json(worksheet, { defval: " " });

            setData(jsonData);
            setCurrentPage(1); // Reset to first page

            const compressedData = LZString.compress(JSON.stringify(jsonData));
            try {
                localStorage.setItem("evaluationData", compressedData);
            } catch (error) {
                console.error("LocalStorage quota exceeded, using sessionStorage instead.");
                sessionStorage.setItem("evaluationData", compressedData);
            }

            setLoading(false);
        };
        reader.readAsBinaryString(file);
    };

    const filteredData = data.filter((row: any) =>
        Object.values(row).some(
            (value) =>
                value &&
                value.toString().toLowerCase().includes(search.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="flex flex-col items-center py-5 bg-slate-300 h-screen text-slate-950">
            <div className="w-full mt-4 px-2">
                <Link href="/" className="text-slate-950 flex gap-1 items-center font-semibold hover:text-blue-700">
                    <IoChevronBack className="text-[2rem]" />BACK
                </Link>
            </div>

            <div className="font-semibold tracking-widest text-[2.5rem] flex items-center">
                <Image src={kkk} alt="Description of image" width={100} height={50} />
                <label className="">EVALUATION</label>
            </div>

            <div className="w-full flex text-slate-950 justify-between px-10 py-5">
                <div className="flex w-[400px] px-2 py-0.5 gap-2 items-center mx-2 border-[1px] border-slate-700 rounded-xl">
                    <label>
                        <IoSearchOutline className="text-[20px]" />
                    </label>
                    <div className="h-[50%] bg-slate-950 w-[1px]" />
                    <input
                        type="text"
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full outline-none px-3 py-2 bg-slate-300 "
                        placeholder="Search here.."
                    />
                </div>

                <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer">
                    <IoCloudUploadOutline className="text-[20px]" /> Upload
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                </label>
            </div>

            <div className="flex flex-col items-center w-full gap-3 px-10 overflow-auto">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
                        <AiOutlineLoading3Quarters className="text-slate-10 text-2xl animate-spin" />
                    </div>
                )}
                {filteredData.length > 0 && (
                    <>
                        <div className="w-full">
                            {/* Desktop View (Hidden on Small Screens) */}
                            <div className="hidden sm:block overflow">
                                <div className="w-full mt-4 border border-gray-950 min-w-max">
                                    <div className="border border-gray-950 shrink-0 w-full h-[80px] bg-slate-950 text-white uppercase flex items-center font-semibold">
                                        {Object.keys(filteredData[0]).map((key) => (
                                            <div key={key} className="border border-gray-950 px-4 py-2 text-center flex-1">
                                                {key}
                                            </div>
                                        ))}
                                    </div>
                                    {paginatedData.map((row: any, rowIndex: number) => (
                                        <div key={rowIndex} className="flex">
                                            {Object.values(row).map((cell, cellIndex) => {
                                                let textColor = "";
                                                const cellValue = cell ? cell.toString().trim().toLowerCase() : " ";
                                                if (cellIndex === 0) {
                                                    if (cellValue.includes("full")) textColor = "text-green-600";
                                                    else if (cellValue.includes("non")) textColor = "text-red-600";
                                                    else if (cellValue.includes("partial")) textColor = "text-yellow-600";
                                                }
                                                return (
                                                    <div key={cellIndex} className={`border border-gray-950 px-4 py-2 flex-1 flex items-center ${textColor}
                                                        ${cellIndex === 0 ? "font-semibold uppercase justify-center" : ""} 
                                                        ${cellIndex === 2 ? "justify-center" : ""} 
                                                        ${cellIndex === 3 ? "text-center font-semibold uppercase justify-center" : ""} `}
                                                    >
                                                        {cellValue || " "}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile View */}
                            <div className="sm:hidden w-full">
                                {paginatedData.map((row: any, rowIndex: number) => (
                                    <div key={rowIndex} className="border border-gray-950 p-4 mb-4 bg-white shadow-md">
                                        {Object.keys(row).map((key, cellIndex) => {
                                            let textColor = "";
                                            const cellValue = row[key] ? row[key].toString().trim().toLowerCase() : " ";
                                            if (cellIndex === 0) {
                                                if (cellValue.includes("full")) textColor = "text-green-600";
                                                else if (cellValue.includes("non")) textColor = "text-red-600";
                                                else if (cellValue.includes("partial")) textColor = "text-yellow-600";
                                            }
                                            return (
                                                <div key={cellIndex} className={`flex justify-between border-b border-gray-200 py-2 ${textColor}`}>
                                                    <span className="font-semibold uppercase">{key}:</span>
                                                    <span className="text-right">{cellValue || " "}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>


                        <div className="flex justify-center gap-2 mt-4">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-4 py-2 bg-gray-400 disabled:opacity-50 rounded-lg">
                                Previous
                            </button>
                            <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-4 py-2 bg-gray-400 disabled:opacity-50 rounded-lg">
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Evaluation;
