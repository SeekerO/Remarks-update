"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as XLSX from "xlsx";
import {
  IoCloudUploadOutline,
  IoChevronBack,
  IoSettingsSharp,
} from "react-icons/io5";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import stringSimilarity from "string-similarity";
import { MdDelete } from "react-icons/md";
import Link from "next/link";
import moment from "moment";

const Checker = () => {
  const [dataSet, setDataSet] = useState<any[]>([]);
  const [dataSetEvaluated, setDataSetEvaluated] = useState<any[]>([]);
  const [matchedData, setMatchedData] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [threshholdValue, setThresholdValue] = useState<number>(7);
  const [openSettings, setOpenSettings] = useState<boolean>(false);
  const [dataNotmatched, setDataNotMatched] = useState<any>([]);

  const [searchDataSet, setSearchDataSet] = useState<string>("");
  const [searchDataSetEvaluated, setSearchDataSetEvaluated] =
    useState<string>("");
  const [searchResult, setSearchResult] = useState<string>("");

  useLayoutEffect(() => {
    try {
      const dataSetSession = JSON.parse(
        sessionStorage.getItem("data_set") || "[]"
      );
      const dataSetEvaluatedSession = JSON.parse(
        sessionStorage.getItem("clc_data") || "[]"
      );
      const matchedDataSession = JSON.parse(
        sessionStorage.getItem("matched_data") || "[]"
      );
      const listSession = JSON.parse(
        sessionStorage.getItem("list_data") || "[]"
      );

      setDataSet(dataSetSession);
      setDataSetEvaluated(dataSetEvaluatedSession);
      setMatchedData(matchedDataSession);
      setList(listSession);
    } catch (error) {
      console.error("Error parsing session storage data:", error);
    }
  }, []);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "data_set" | "clc_data"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return alert("Please select a file.");

    const reader = new FileReader();

    reader.onloadend = (e) => {
      const result = e.target?.result;
      if (!result) return alert("Error reading file.");

      try {
        const workbook = XLSX.read(result as ArrayBuffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (jsonData.length === 0) return alert("Uploaded file is empty.");

        const storageKey = type === "data_set" ? "data_set" : "clc_data";
        const setDataFunction =
          type === "data_set" ? setDataSet : setDataSetEvaluated;

        setDataFunction(jsonData);
        sessionStorage.setItem(storageKey, JSON.stringify(jsonData));
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Error processing file. Please try again.");
      }
    };

    reader.onerror = () => alert("Error reading file. Please try again.");
    reader.readAsArrayBuffer(file);
  };

  const matchNames = () => {
    if (!dataSet?.length || !dataSetEvaluated?.length)
      return alert("Please upload both datasets.");

    const normalizedDataSet = dataSet.map((entry) => ({
      name: entry.FULLNAME,
      region: entry.REGION,
      normalizedName: normalizeName(entry.FULLNAME),
    }));

    const matches: any = [];
    const notMatched: any = [];
    const thresh = threshholdValue * 100;

    dataSetEvaluated.forEach((evalEntry) => {
      const { FULLNAME: nameA, REGION: regionA } = evalEntry;
      const normalizedA = normalizeName(nameA);

      const bestMatch = normalizedDataSet.reduce(
        (best, clcEntry) => {
          const score = stringSimilarity.compareTwoStrings(
            normalizedA,
            clcEntry.normalizedName
          );
          return score > best.score ? { ...clcEntry, score } : best;
        },
        { name: "", region: "", score: 0 }
      );

      if (bestMatch.score * 100 > thresh) {
        matches.push({
          nameA,
          regionA,
          nameB: bestMatch.name,
          regionB: bestMatch.region,
          similarity: bestMatch.score.toFixed(2),
        });
      } else {
        notMatched.push({ nameA, regionA });
      }
    });

    // FIX NOT GIVING DATA THAT IS MATCHED
    setMatchedData(matches);

    sessionStorage.setItem("matched_data", JSON.stringify(matches));

    setDataNotMatched(notMatched);
    sessionStorage.setItem("not_matched_data", JSON.stringify(notMatched));

    const differentRegions = new Set();
    matches.forEach(({ regionA, regionB }: any) => {
      if (regionA !== regionB) differentRegions.add(regionB);
    });

    const regionList = Array.from(differentRegions);
    setList(regionList);
    sessionStorage.setItem("list_data", JSON.stringify(regionList));
  };

  const filteredDataSet = dataSet.filter((row: any) =>
    Object.values(row).some((value) =>
      value?.toString().toLowerCase().includes(searchDataSet.toLowerCase())
    )
  );
  const filteredDataEval = dataSetEvaluated.filter((row: any) =>
    Object.values(row).some((value) =>
      value
        ?.toString()
        .toLowerCase()
        .includes(searchDataSetEvaluated.toLowerCase())
    )
  );
  const filteredDataMatch = matchedData.filter((row: any) =>
    Object.values(row).some((value) =>
      value?.toString().toLowerCase().includes(searchResult.toLowerCase())
    )
  );

  const removeFunction = (type: "all_data" | "data_set" | "clc_data") => {
    console.log(`Removing ${type}...`);

    // Helper function to clear state & sessionStorage
    const clearData = (
      stateSetter: React.Dispatch<React.SetStateAction<any[]>>,
      key: string
    ) => {
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

  const convertExcelTimestamp = (serial: number): string => {
    if (!serial || isNaN(serial)) return "Invalid Date";
    return moment("1899-12-30").add(serial, "days").format("YYYY-MM-DD");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-800 overflow-hidden">
      <div className="w-full mt-4 mb-4 px-2">
        <Link
          href="/"
          className="text-slate-100 flex gap-1 items-center font-semibold hover:text-blue-700"
        >
          <IoChevronBack className="text-[2rem]" />
          BACK
        </Link>
      </div>
      <div className="px-10 shadow-lg">
        <div className="bg-slate-100 flex flex-col w-full h-[100px] px-5 pt-2 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h1 className="text-[1.7rem] font-semibold tracking-widest text-slate-800">
              CHECKER
            </h1>
            <div className="text-[1.7rem] font-semibold tracking-widest flex gap-5 text-white">
              <button
                onClick={() => removeFunction("data_set")}
                className="flex items-center text-[1rem] bg-red-500 px-2 py-1 rounded-md gap-1 hover:scale-110 duration-300 hover:bg-red-800"
              >
                <MdDelete className="text-[1.2rem]" /> Delete Data Set
              </button>
              <button
                onClick={() => removeFunction("clc_data")}
                className="flex items-center text-[1rem] bg-red-500 px-2 py-1 rounded-md gap-1 hover:scale-110 duration-300 hover:bg-red-800"
              >
                <MdDelete className="text-[1.2rem]" /> Delete Data CLC
              </button>
              <button
                onClick={() => removeFunction("all_data")}
                className="flex items-center text-[1rem] bg-red-500 px-2 py-1 rounded-md gap-1 hover:scale-110 duration-300 hover:bg-red-800"
              >
                <MdDelete className="text-[1.2rem]" /> Delete All
              </button>
            </div>
          </div>
          <div className="flex gap-2 items-center italic font-semibold w-full justify-center text-blue-600 pt-4">
            <div>HOW TO USE: </div>
            <div>UPLOAD EVALUATED NAMES</div>
            <MdKeyboardDoubleArrowRight className="text-[1.5rem]" />
            <div>UPLOAD CLC NAMES</div>
            <MdKeyboardDoubleArrowRight className="text-[1.5rem]" />
            <div>RUN CHECKING</div>
          </div>
        </div>

        <div className="bg-slate-100 flex w-full h-[75vh] px-2 pb-2 rounded-b-xl gap-2">
          <div className="grid grid-cols-1 shrink-0 gap-2 h-full">
            {/* Upload Box for Evaluated Data */}
            <div className="shrink-0 flex flex-col w-[50vh] h-[37vh] bg-slate-800 text-white rounded-lg overflow-x-hidden overflow-y-auto">
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
                    <label className="italic font-thin tracking-widest">
                      Upload Evaluated Names Here
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-2 pt-2">
                    <SearchBar
                      searchText={searchDataSet}
                      searchSetter={setSearchDataSet}
                    />
                  </div>
                  {filteredDataSet.map((value, index) => (
                    <div
                      key={index}
                      className="text-[0.9rem] items-center flex p-2 gap-2 border-b border-slate-300 justify-between"
                    >
                      <div className="font-semibold">{value.FULLNAME}</div>
                      <div className="w-[100px] bg-slate-100 text-black shrink-0 font-semibold flex items-center justify-center py-1 rounded-md shadow-md">
                        {value.REGION > 4000
                          ? convertExcelTimestamp(value.REGION)
                          : value.REGION}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Upload Box for CLC Data */}
            <div className="shrink-0 flex flex-col w-[50vh] h-[37vh] bg-slate-500 text-black rounded-lg overflow-x-hidden overflow-y-auto">
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
                    <label className="italic font-thin tracking-widest">
                      Upload CLC Names Here
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-2 pt-2">
                    <SearchBar
                      searchText={searchDataSetEvaluated}
                      searchSetter={setSearchDataSetEvaluated}
                    />
                  </div>
                  {filteredDataEval.map((value, index) => (
                    <div
                      key={index}
                      className="text-[0.9rem] items-center flex p-2 gap-2 border-b text-slate-900 border-slate-900 justify-between"
                    >
                      <div className="font-semibold">{value.FULLNAME}</div>
                      <div className="w-[100px] bg-slate-100 text-black shrink-0 font-semibold flex items-center justify-center py-1 rounded-md shadow-md">
                        {value.REGION}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="w-full h-full flex flex-col bg-slate-800 p-4 rounded-lg">
            <div className="flex flex-col border-b-[1px] w-full border-slate-500 mb-2 py-2 gap-2 items-center justify-between">
              <div className="w-full flex items-center justify-between">
                <button
                  onClick={matchNames}
                  className="bg-gray-100 text-gray-800 py-1 px-4 h-fit rounded-md hover:bg-blue-500 duration-300"
                >
                  Check
                </button>
                <div>
                  <button
                    onClick={() => setOpenSettings(!openSettings)}
                    className="bg-gray-100 p-2 rounded-md relative"
                  >
                    <IoSettingsSharp />
                  </button>
                  <CheckerSettings
                    open={openSettings}
                    setOpen={setOpenSettings}
                    settings={threshholdValue}
                    setSettings={setThresholdValue}
                  />
                </div>

                <div className="w-[50vh]">
                  <SearchBar
                    searchText={searchResult}
                    searchSetter={setSearchResult}
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 w-full">
                {list.map((value) => (
                  <a
                    onClick={() => setSearchResult(value)}
                    key={value}
                    className="text-white border-[1px]  border-gray-100 px-2 rounded-md text-sm duration-300 hover:border-blue-500 hover:text-blue-500 cursor-pointer"
                  >
                    {value}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 h-full w-full overflow-hidden">
              <div className="w-full text-center text-gray-100 font-semibold tracking-widest py-1">
                MATCHED DATA
              </div>
              <div className="h-[100%] overflow-auto">
                {filteredDataMatch.map((match, index) => (
                  <div
                    key={index}
                    className="border-b py-1 text-white flex justify-between"
                  >
                    <label>
                      {match.nameA} ({match.regionA}) ⇄ {match.nameB}{" "}
                      <span
                        className={`font-semibold ${
                          match.similarity * 100 >= 90
                            ? "text-green-500"
                            : match.similarity * 100 < 50
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      >
                        ({match.regionB})
                      </span>
                    </label>
                    <div
                      className={`${
                        match.similarity * 100 >= 90
                          ? "bg-green-500"
                          : match.similarity * 100 < 50
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      } text-[0.7rem] border-[1px] border-white h-10 w-10 flex items-center justify-center p-2 rounded-full ml-10`}
                    >
                      {match.similarity * 100}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

const SearchBar = ({
  searchText,
  searchSetter,
}: {
  searchText: string;
  searchSetter: React.Dispatch<React.SetStateAction<string>>;
}) => {
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

const CheckerSettings = ({
  open,
  setOpen,
  settings,
  setSettings,
}: {
  open: boolean;
  setOpen: React.Dispatch<SetStateAction<boolean>>;
  settings: number;
  setSettings: React.Dispatch<SetStateAction<number>>;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className="absolute py-2 px-1 w-[200px] bg-gray-200 mt-1 rounded-md flex flex-col gap-2"
    >
      <h1 className="w-full text-center px-1 font-semibold">SETTINGS</h1>
      <div className="flex px-1 gap-2 items-center">
        <label>THRESHOLD:</label>
        <input
          value={settings}
          onChange={(e) => setSettings(Number(e.target.value))}
          type="number"
          className="w-14 rounded-md text-center"
        />
      </div>
    </div>
  );
};
