"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, useState } from "react";

import Image from "next/image";
import kkk from "../../lib/image/KKK.png"; // Assuming this is intentional and not a watermark
import BreadCrumb from "../component/breadcrumb";
import { compareExcelFilesFuzzy } from "@/lib/util/compare";

import SideMenu from "./component/sidemenu";

import { IoSearch } from "react-icons/io5"; // Replaced with a more modern search icon from Matter recognition

// For a more modern feel, let's use icons from react-icons/md or /fa for consistency.
// Example: import { MdUploadFile, MdSearch, MdPlayArrow, MdPeopleAlt, MdDelete } from 'react-icons/md';
// Or if sticking to existing:
import { MdUploadFile, MdPeopleAlt, MdPlayArrow, MdDelete } from 'react-icons/md';


const Matcher = () => {
  const [dataset1, setDataSet1] = useState<File | null>(null);
  const [dataset2, setDataSet2] = useState<File | null>(null);
  const [res, setRes] = useState<any>([]);

  const [inputSearch1, setInputSearch1] = useState<string>("");
  const [threshold, SetThreshold] = useState<number>(85);

  const handleMatchingMethod = async () => {
    if (!dataset1 || !dataset2) return;

    // Add loading state feedback for better UX
    // setLoading(true);
    try {
      const file1Buffer = await dataset1.arrayBuffer();
      const file2Buffer = await dataset2.arrayBuffer();

      const nodeBuffer1 = Buffer.from(file1Buffer);
      const nodeBuffer2 = Buffer.from(file2Buffer);

      const result = await compareExcelFilesFuzzy(
        nodeBuffer1,
        nodeBuffer2,
        threshold
      );
      console.log(result);
      setRes(result);
    } catch (error) {
      console.error("Error during matching:", error);
      // Handle error, show user feedback
    } finally {
      // setLoading(false);
    }
  };

  const filterNames = (data: []) => {
    return data?.filter((item: string[]) =>
      item.some((value) => value.toLowerCase().includes(inputSearch1.toLowerCase())) // Use toLowerCase for case-insensitive search
    );
  };

  const filteredData1 = filterNames(res?.data1);
  const filteredData2 = filterNames(res?.data2);
  const filteredResults = res?.matched?.filter((item: any) =>
    item?.row1[0].toLowerCase().includes(inputSearch1.toLowerCase()) // Use toLowerCase for case-insensitive search
  );

  const handleDeleteData = () => {
    setDataSet1(null);
    setDataSet2(null);
    setRes(null);
    setInputSearch1(""); // Clear search on delete
    // Reset threshold if desired: SetThreshold(85);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col gap-4 bg-gray-100 dark:bg-gray-900 font-sans antialiased">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <BreadCrumb />
        <Image src={kkk} alt="Application Logo" width={70} height={40} className="object-contain" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col lg:flex-row gap-4 p-4 lg:p-6 transition-colors duration-200">

        {/* Left Side: Data Set Panels */}
        <section className="flex flex-col w-full lg:w-1/2 gap-4">
          {/* Dataset 1 Panel */}
          <DataSetPanel
            title="DATA SET 1"
            data={res?.data1}
            filteredData={filteredData1}
            inputSearch={inputSearch1}
            setInputSearch={setInputSearch1}
            setDataSet={setDataSet1}
          />

          {/* Dataset 2 Panel */}
          <DataSetPanel
            title="DATA SET 2"
            data={res?.data2}
            filteredData={filteredData2}
            inputSearch={inputSearch1} // Re-using the same search input for both datasets
            setInputSearch={setInputSearch1}
            setDataSet={setDataSet2}
          />
        </section>

        {/* Right Side: Results & Controls */}
        <section className="flex flex-col w-full lg:w-1/2 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            {dataset1 && dataset2 && (
              <div className="flex items-center gap-3">
                {/* Play Button */}
                <button
                  onClick={handleMatchingMethod}
                  className="flex items-center justify-center px-5 py-2 text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 shadow-md"
                >
                  <MdPlayArrow className="text-xl mr-2" />
                  Run Match
                </button>

                {/* Total Matches Count (repositioning this as it was on Dataset 2, but applies to results) */}
                {res?.matched?.length > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                    <MdPeopleAlt className="text-lg" />
                    <span>Matched: {res?.matched.length}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 sm:ml-auto">
              {/* Delete Data Button */}
              {res && (
                <button
                  onClick={handleDeleteData}
                  className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Clear All Data"
                >
                  <MdDelete className="text-2xl" />
                </button>
              )}
              {/* Side Menu (assuming it contains threshold controls) */}
              <SideMenu
                res={res}
                threshold={threshold}
                SetThreshold={SetThreshold}
              />
            </div>
          </div>

          {/* Results Display Area */}
          <div className="flex-1 w-full flex flex-col gap-2 overflow-y-auto custom-scrollbar p-1">
            {res?.matched && res.matched.length > 0 ? (
              filteredResults.map((value: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg shadow-sm transition-all duration-200
                    ${value.score > 90 ? "bg-green-50 dark:bg-green-900/20 border border-green-500" :
                      value.score > 85 ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500" :
                        "bg-red-50 dark:bg-red-900/20 border border-red-500"}
                    text-gray-800 dark:text-gray-100`}
                >
                  <div className="flex flex-col flex-grow min-w-0">
                    <span
                      title={value.row1[1]}
                      className="font-semibold text-lg truncate mb-1"
                    >
                      {value.row1[0]}
                    </span>
                    <span
                      title={value.bestMatch[1]}
                      className="text-sm text-gray-600 dark:text-gray-300 italic truncate"
                    >
                      Matched with: {value.bestMatch[0]}
                    </span>
                  </div>
                  <div
                    className={`flex-none w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border-2 ml-4
                      ${value.score > 90 ? "border-green-600 text-green-700 dark:text-green-300" :
                        value.score > 85 ? "border-yellow-600 text-yellow-700 dark:text-yellow-300" :
                          "border-red-600 text-red-700 dark:text-red-300"}`}
                  >
                    {value.score}
                  </div>
                </div>
              ))
            ) : (
              <NoBasis />
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Matcher;

// --- Reusable Components for Modern Look ---

// DataSetPanel Component
const DataSetPanel = ({ title, data, filteredData, inputSearch, setInputSearch, setDataSet }: {
  title: string;
  data: any[];
  filteredData: any[];
  inputSearch: string;
  setInputSearch: React.Dispatch<React.SetStateAction<string>>;
  setDataSet: React.Dispatch<React.SetStateAction<File | null>>;
}) => {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 transition-colors duration-200">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        {data?.length > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
            <MdPeopleAlt className="text-lg" />
            <span>{data.length} entries</span>
          </div>
        )}
      </div>

      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IoSearch className="text-gray-400 dark:text-gray-400 text-xl" />
        </div>
        <input
          type="text"
          placeholder="Search entries..."
          value={inputSearch}
          onChange={(e) => setInputSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-100 dark:bg-gray-800 rounded-md p-3 transition-colors duration-200">
        {data ? (
          filteredData.length > 0 ? (
            filteredData.map((value: string[], index: number) => (
              value.length > 0 && (
                <div
                  key={index}
                  className="flex justify-between items-center px-3 py-2 my-1 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm hover:shadow-md transition-shadow duration-200"
                >
                  <span className="font-medium truncate">{value[0]}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">{value[1]}</span>
                </div>
              )
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center">
              No matching entries found.
            </div>
          )
        ) : (
          <UploadButton set={setDataSet} />
        )}
      </div>
    </div>
  );
};


// Upload button component
const UploadButton = ({
  set,
}: {
  set: React.Dispatch<React.SetStateAction<File | null>>;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      set(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200">
      <input
        type="file"
        accept=".xlsx,.xls,.csv" // Added .csv as a common spreadsheet format
        ref={fileInputRef}
        className="hidden" // Keep input hidden for custom styling
        onChange={handleFileChange}
      />
      <button
        onClick={handleButtonClick}
        className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 focus:outline-none"
      >
        <MdUploadFile className="text-5xl mb-2" />
        {fileName ? (
          <span className="text-base font-medium">
            Selected: <strong className="text-gray-800 dark:text-white">{fileName}</strong>
          </span>
        ) : (
          <span className="text-lg font-medium">Upload Spreadsheet</span>
        )}
        <span className="text-sm mt-1 text-gray-400 dark:text-gray-500">(.xlsx, .xls, .csv)</span>
      </button>
    </div>
  );
};

// No Basis message
const NoBasis = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 p-4">
      <IoSearch className="text-5xl mb-3" />
      <p className="text-lg font-semibold">No Results Yet</p>
      <p className="text-sm">Upload both datasets and click {"'Run Match'"} to see the fuzzy matching results here.</p>
    </div>
  );
};

// Custom Scrollbar CSS (add this to your global CSS or a styled-component/emotion setup)
/*
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e0; // gray-300
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a0aec0; // gray-400
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #2d3748; // gray-800
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4a5568; // gray-700
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #64748b; // gray-600
}
*/