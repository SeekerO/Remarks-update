"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, useState } from "react";
import BreadCrumb from "../component/breadcrumb";
import { compareExcelFilesFuzzy } from "@/lib/util/compare";
import SideMenu from "./component/sidemenu";
import { useAuth } from "../Chat/AuthContext";
import { IoSearch } from "react-icons/io5";
import { MdUploadFile, MdPeopleAlt, MdPlayArrow, MdDelete } from 'react-icons/md';

// Matcher Main Component
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

      const nodeBuffer1 = Buffer.from(file1Buffer);
      const nodeBuffer2 = Buffer.from(file2Buffer);

      const result = await compareExcelFilesFuzzy(
        nodeBuffer1,
        nodeBuffer2,
        threshold
      );
      setRes(result);
    } catch (err: any) {
      console.error("Error during matching:", err);
      setError("An error occurred during matching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterData = (data: any[]) => {
    if (!inputSearch) return data;
    return data?.filter((item: string[]) =>
      item.some(value => value.toLowerCase().includes(inputSearch.toLowerCase()))
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
    setError(null);
  };



  if (user || (user as any)?.canChat === true)

    return (
      <div className="overflow-hidden h-screen w-screen flex flex-col gap-4 font-sans antialiased">
        {/* Header */}
        <header className="flex justify-between items-center px-4 py-5  rounded-lg shadow-md">
          <BreadCrumb />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full h-[90%] rounded-lg shadow-xl flex flex-col lg:flex-row gap-4 p-4 lg:p-6 transition-colors duration-200">
          {/* Left Side: Data Set Panels */}
          <section className="flex flex-col w-full lg:w-1/2 gap-4 h-full ">
            <DataSetPanel
              title="DATA SET 1"
              data={res?.data1}
              filteredData={filteredData1}
              inputSearch={inputSearch}
              setInputSearch={setInputSearch}
              setDataSet={setDataSet1}
            />
            <DataSetPanel
              title="DATA SET 2"
              data={res?.data2}
              filteredData={filteredData2}
              inputSearch={inputSearch}
              setInputSearch={setInputSearch}
              setDataSet={setDataSet2}
            />
          </section>

          {/* Right Side: Results & Controls */}
          <section className="flex flex-col w-full lg:w-1/2 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner p-4 h-full transition-colors duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              {dataset1 && dataset2 && (
                <button
                  onClick={handleMatchingMethod}
                  className={`flex items-center justify-center px-5 py-2 text-base font-medium rounded-full text-white transition-all duration-300 transform hover:scale-105 shadow-md
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Matching...
                    </>
                  ) : (
                    <>
                      <MdPlayArrow className="text-xl mr-2" />
                      Run Match
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center gap-3 sm:ml-auto">
                {res && res.matched && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                    <MdPeopleAlt className="text-lg" />
                    <span>Matches: {res.matched.length}</span>
                  </div>
                )}
                {res && (
                  <button
                    onClick={handleDeleteData}
                    className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Clear All Data"
                  >
                    <MdDelete className="text-2xl" />
                  </button>
                )}
                <SideMenu
                  res={res}
                  threshold={threshold}
                  SetThreshold={SetThreshold}
                />
              </div>
            </div>

            {/* Results Display Area */}
            <div className=" flex-1 w-full flex flex-col gap-2 overflow-y-auto custom-scrollbar p-1 h-full overflow-hidden">
              {error ? (
                <div className="flex items-center justify-center h-full text-red-500 dark:text-red-400 text-center">
                  <p>{error}</p>
                </div>
              ) : loading ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-4">
                  <svg className="animate-spin h-10 w-10 text-gray-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-lg font-semibold">Matching in progress...</p>
                  <p className="text-sm">This may take a moment depending on the file size.</p>
                </div>
              ) : res && res.matched && res.matched.length > 0 ? (
                filteredResults.length > 0 ? (
                  filteredResults.map((value: any, index: number) => (
                    <ResultItem key={index} value={value} />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center">
                    <p>No results found for your search.</p>
                  </div>
                )
              ) : (
                <NoResults message={"Upload both datasets and click 'Run Match' to see the results here."} />
              )}
            </div>
          </section>
        </main>
      </div>
    );
};

export default Matcher;

// ResultItem Component for clean display
const ResultItem = ({ value }: { value: any }) => {
  const score = value.score;
  const colorClass = score > 90 ? "green" : score > 85 ? "yellow" : "red";

  return (
    <div
      className={`flex flex-col items-start p-3 rounded-lg shadow-sm transition-all duration-200
      bg-${colorClass}-50 dark:bg-${colorClass}-900/20 border border-${colorClass}-500
      text-gray-800 dark:text-gray-100`}
    >
      <div className="flex w-full items-center justify-between mb-1">
        <span title={value.row1[0]} className="font-semibold text-lg truncate">
          {value.row1[0]}
        </span>
        <div
          className={`flex-none w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border-2 ml-4
          border-${colorClass}-600 text-${colorClass}-700 dark:text-${colorClass}-300 shrink-0`}
        >
          {score}
        </div>
      </div>
      <span title={value.bestMatch[0]} className="text-sm text-gray-600 dark:text-gray-300 italic truncate w-full">
        Matched with: {value.bestMatch[0]}
      </span>
      {value.row1[1] && (
        <span title={value.row1[1]} className="text-xs text-gray-500 dark:text-gray-400 truncate w-full mt-1">
          {value.row1[1]}
        </span>
      )}
      {value.bestMatch[1] && (
        <span title={value.bestMatch[1]} className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
          {value.bestMatch[1]}
        </span>
      )}
    </div>
  );
};


const DataSetPanel = ({ title, data, filteredData, inputSearch, setInputSearch, setDataSet }: {
  title: string;
  data: any[];
  filteredData: any[];
  inputSearch: string;
  setInputSearch: React.Dispatch<React.SetStateAction<string>>;
  setDataSet: React.Dispatch<React.SetStateAction<File | null>>;
}) => {
  return (
    <div className="h-[45%] flex flex-col flex-1 bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 transition-colors duration-200">
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

      <div className=" flex-1 overflow-y-auto custom-scrollbar bg-gray-100 dark:bg-gray-800 rounded-md p-3 transition-colors duration-200">
        {data ? (
          filteredData.length > 0 ? (
            filteredData.map((value: string[], index: number) => (
              value.length > 0 && (
                <div
                  key={index}
                  className="flex flex-col items-start px-3 py-2 my-1 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm hover:shadow-md transition-shadow duration-200"
                >
                  <span className="font-medium truncate w-full">{value[0]}</span>
                  {value.length > 1 && (
                    <span className="text-gray-500 dark:text-gray-400 text-xs mt-1 truncate w-full">{value[1]}</span>
                  )}
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
const UploadButton = ({ set }: { set: React.Dispatch<React.SetStateAction<File | null>>; }) => {
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
        accept=".xlsx,.xls,.csv"
        ref={fileInputRef}
        className="hidden"
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

// No Results message
const NoResults = ({ message }: { message: string }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 p-4">
      <IoSearch className="text-5xl mb-3" />
      <p className="text-lg font-semibold">No Results Yet</p>
      <p className="text-sm">{message}</p>
    </div>
  );
};