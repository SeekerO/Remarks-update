/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import {
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  IoChevronBack,
  IoSettingsSharp,
} from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

import stringSimilarity from "string-similarity";
import SideBarChecker from "./Sidebar/sidebar_component_checkerv2";

import SearchBar from "@/lib/components/searchbar";
import { Sling as Hamburger } from 'hamburger-react'

const CheckerV2 = () => {
  //    DATA SET
  const [dataSet, setDataSet] = useState<any[]>([]);
  const [dataSetEvaluated, setDataSetEvaluated] = useState<any[]>([]);

  //    RESULTS SETTER
  const [matchedData, setMatchedData] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);

  //    SETTINGS
  const [threshholdValue, setThresholdValue] = useState<number>(70);
  const [openSettings, setOpenSettings] = useState<boolean>(false);

  //    NOT MATCHED
  const [dataNotmatched, setDataNotMatched] = useState<any>([]);
  const [openNotMatched, setOpenNotMatched] = useState<boolean>(false);

  //    SEARCH PARAM
  const [searchResult, setSearchResult] = useState<string>("");

  //    SIDEBAR
  const [openSideBar, setOpenSideBar] = useState<boolean>(false);


  //    LOADING
  const [loading, setLoading] = useState<boolean>(false)

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
    const thresh = threshholdValue / 100;

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

      if (bestMatch.score > thresh) {
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

  return (
    <div className="bg-slate-100 w-screen h-screen p-2 flex-col flex">
      <div className="w-full h-full bg-slate-950 rounded-md flex flex-col ">
        <div className="text-white flex justify-between items-center">
          <div className="flex gap-2 font-semibold text-[2rem] w-fit px-3 tracking-widest text-center text-slate-950 bg-slate-100 rounded-br-2xl">
            <Link
              href="/"
              className=" flex gap-1 font-semibold text-slate-950 hover:text-blue-700 items-center"
            >
              <IoChevronBack />
            </Link>
            <label>MATCHER</label>
          </div>
          <div className="pr-5">
            <button
              onClick={() => setOpenSettings(!openSettings)}
              className=" rounded-md relative text-[1.2rem] hover:scale-125 duration-300"
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
        </div>

        <div className="h-full w-full flex p-2">
          <div className="bg-slate-100 h-full w-full rounded-md flex">
            {/* SIDEBAR */}
            <div className={`${openSideBar ? "w-[80%] lg:w-[30%] " : "w-[0%]"} duration-300 bg-slate-950 h-full rounded-md flex flex-col overflow-hidden absolute lg:relative`}>
              <SideBarChecker
                open={openSideBar}
                setOpen={setOpenSideBar}
                dataSetEvaluated={dataSetEvaluated}
                dataSet={dataSet}
                handleFileUpload={handleFileUpload}
                removeFunction={removeFunction}
              />
            </div>
            {/* END SIDEBAR */}

            {/* MAIN */}
            <div className=" w-full h-full flex flex-col overflow-auto py-2 px-2">
              <div className="flex gap-2 items-center w-full">
                <div className="z-0"><Hamburger toggled={openSideBar} toggle={setOpenSideBar} /></div>
                <div className="w-full rounded-md flex justify-between text-white items-center bg-slate-950 px-2 py-1">
                  <button
                    onClick={matchNames}
                    className="bg-slate-100 text-slate-950 w-[150px] py-1 rounded-md hover:bg-green-500 hover:w-[170px] duration-300 font-semibold"
                  >
                    RUN
                  </button>
                  <div className="flex gap-2 items-center">
                    <div className="p-2 rounded-md text-white">
                      {filteredDataMatch.length}
                    </div>
                    <SearchBar
                      searchText={searchResult}
                      searchSetter={setSearchResult}
                    />

                    <button
                      onClick={() => setOpenNotMatched(!openNotMatched)}
                      className="bg-gray-100 text-gray-800 py-0.5 px-4 h-fit rounded-md hover:bg-blue-500 hover:text-white duration-300 text-nowrap"
                    >
                      Not Matched
                    </button>

                    <ShowNotMatched
                      open={openNotMatched}
                      setOpen={setOpenNotMatched}
                      data={dataNotmatched}
                    />
                  </div>
                </div>
              </div>
              <div className=" flex flex-col h-[81vh] w-full overflow-auto pt-2">
                {filteredDataMatch.map((match, index) => (
                  <div
                    key={index}
                    className="border-b py-1 text-slate-950 flex justify-between"
                  >
                    <label>
                      {match.nameA} ({match.regionA}) ⇄ {match.nameB}{" "}
                      <span
                        className={`font-semibold ${match.similarity * 100 >= 90
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
                      className={`${match.similarity * 100 >= 90
                        ? "bg-green-500 text-green-700"
                        : match.similarity * 100 < 50
                          ? "bg-red-500 text-red-700"
                          : "bg-yellow-500 text-yellow-700"
                        } text-[0.7rem] border-[1px] font-boldborder-white h-10 w-10 flex items-center justify-center p-2 rounded-full ml-10`}
                    >
                      {match.similarity * 100}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* END MAIN */}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
                <AiOutlineLoading3Quarters className="text-slate-10 text-[2rem] animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckerV2;

// UTILS

const normalizeName = (name: string) => {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "") // Remove special characters
    .replace(/\b(Jr|Sr|II|III|IV|V)\b/gi, "") // Remove suffixes
    .toLowerCase()
    .trim();
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
      className="absolute right-5 py-2 px-1 w-[200px] bg-slate-700 mt-1 rounded-b-md rounded-l-md flex flex-col gap-2 text-slate-950"
    >
      <h1 className="w-full text-center px-1 font-bold">SETTINGS</h1>
      <div className="flex px-1 gap-2 items-center">
        <label className="font-semibold">THRESHOLD:</label>
        <input
          value={settings}
          onChange={(e) => setSettings(Number(e.target.value))}
          type="number"
          className="w-14 text-center bg-transparent border-b-[1px] outline-none"
        />
      </div>
    </div>
  );
};

const ShowNotMatched = ({
  open,
  setOpen,
  data,
}: {
  open: boolean;
  setOpen: React.Dispatch<SetStateAction<boolean>>;
  data: any;
}) => {
  const [search, setSearch] = useState<string>("");

  const filteredDataMatch = data.filter((row: any) =>
    Object.values(row).some((value) =>
      value?.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 top-0">
      <div
        ref={ref}
        className="bg-gray-800 w-[100vh] h-[90vh] rounded-md p-2 gap-y-2 overflow-hidden"
      >
        <div className="flex justify-center items-center text-[1.2rem] font-semibold">
          <h1 className="font-semibold text-white text-[2rem]">
            Not Matched Data
          </h1>
        </div>
        <div className="flex justify-center items-center">
          <SearchBar searchText={search} searchSetter={setSearch} />
        </div>
        {/* <pre>{JSON.stringify(filteredDataMatch, null, 2)}</pre> */}
        <div className="overflow-auto h-[70vh] px-2 pt-1">
          {filteredDataMatch?.map((value: any, index: number) => (
            <div
              key={index}
              className="flex justify-between items-center border-b border-gray-300 text-white py-1"
            >
              <div>{value.nameA}</div>
              <div className="px-4 bg-slate-500 text-white rounded-md font-semibold">
                {value.regionA}
              </div>
            </div>
          ))}
        </div>
      </div>



    </div>
  );
};
