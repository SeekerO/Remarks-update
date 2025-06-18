"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, useState } from "react";

import Image from "next/image";
import kkk from "../../lib/image/KKK.png";

import BreadCrumb from "../component/breadcrumb";
import { compareExcelFilesFuzzy } from "@/lib/util/compare";

import SideMenu from "./component/sidemenu";
import SearchBar from "@/lib/components/searchbar";

import { FaPlay } from "react-icons/fa";
import { IoMdPerson } from "react-icons/io";
import { IoSearch } from "react-icons/io5";
import { MdDeleteOutline } from "react-icons/md";
import { AiOutlineUpload } from "react-icons/ai";

const Matcher = () => {
  const [dataset1, setDataSet1] = useState<File | null>(null);
  const [dataset2, setDataSet2] = useState<File | null>(null);
  const [res, setRes] = useState<any>([]);

  const [inputSearch1, setInputSearch1] = useState<string>("");
  const [threshold, SetThreshold] = useState<number>(85);

  const handleMatchingMethod = async () => {
    if (!dataset1 || !dataset2) return;

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
  };

  const filterNames = (data: []) => {
    return data?.filter((item: string[]) =>
      item.some((value) => value.toLowerCase().includes(inputSearch1))
    );
  };

  const filteredData1 = filterNames(res?.data1);
  const filteredData2 = filterNames(res?.data2);
  const filteredResults = res?.matched?.filter((item: any) =>
    item?.row1[0].toLowerCase().includes(inputSearch1)
  );

  const handleDeleteData = () => {
    setDataSet1(null);
    setDataSet2(null);
    setRes(null);
  };

  return (
    <div className="w-screen h-screen p-5 gap-2 flex flex-col dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between px-3">
        <BreadCrumb />
        <Image src={kkk} alt="Description of image" width={60} height={30} />
      </div>

      {/* Table */}
      <div className="h-full w-full bg-slate-200 dark:bg-gray-800 rounded-md shadow-md flex gap-3 p-3  dark:text-white">
        {/* Left side */}
        <div className="w-[50%] h-full gap-y-3 flex flex-col ">
          {/* Dataset 1 */}
          <div className="w-full h-[50%] bg-slate-100 dark:bg-slate-700 shadow-inner rounded-md p-2 gap-2 flex flex-col">
            <div className="flex justify-between items-center">
              <label className="font-semibold tracking-wider text-[1.2rem] italic ">
                DATA SET 1
              </label>
              <div className="flex items-center gap-1 text-blue-700 dark:text-blue-500">
                {res?.data1?.length > 0 && (
                  <>
                    <IoMdPerson />
                    <label>{res?.data1.length}</label>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-gray-300 dark:bg-gray-600 text-gray-800 rounded-md">
              <IoSearch className="text-white text-[1.2rem]" />
              <SearchBar
                searchText={inputSearch1}
                searchSetter={setInputSearch1}
              />
            </div>

            <div
              className={`h-full w-full overflow-auto bg-slate-200 dark:bg-slate-600 flex flex-col shadow-md rounded-md p-3 gap-1 ${
                res?.data1?.length ? "items-start" : "items-center "
              }`}
            >
              {res?.data1 ? (
                filteredData1.map(
                  (value: string[], index: number) =>
                    value.length !== 0 && (
                      <div
                        key={index}
                        className="flex justify-between w-full dark:text-slate-300 text-slate-600 border border-slate-500 px-2 py-1 rounded-md"
                      >
                        <label className="font-bold">{value[0]}</label>
                        <label>{value[1]}</label>
                      </div>
                    )
                )
              ) : (
                <UploadButton set={setDataSet1} />
              )}
            </div>
          </div>

          {/* Dataset 2 */}
          <div className="w-full h-[50%] bg-slate-100 dark:bg-slate-700 shadow-inner rounded-md p-2 gap-2 flex flex-col">
            <div className="flex justify-between items-center">
              <label className="font-semibold tracking-wider text-[1.2rem] italic ">
                DATA SET 2
              </label>
              <div className="flex items-center gap-1 text-blue-700 dark:text-blue-500">
                {res?.data2?.length > 0 && (
                  <>
                    <IoMdPerson />
                    <label>{res?.data2.length}</label>
                  </>
                )}
              </div>
            </div>

            <div
              className={`h-full w-full overflow-auto bg-slate-200 dark:bg-slate-600 flex flex-col shadow-md rounded-md p-3 gap-1 ${
                res?.data2?.length ? "items-start" : "items-center"
              }`}
            >
              {res?.data2 ? (
                filteredData2.map(
                  (value: string[], index: number) =>
                    value.length !== 0 && (
                      <div
                        key={index}
                        className="flex justify-between w-full dark:text-slate-300 text-slate-600 border border-slate-500 px-2 py-1 rounded-md"
                      >
                        <label className="font-bold">{value[0]}</label>
                        <label>{value[1]}</label>
                      </div>
                    )
                )
              ) : (
                <UploadButton set={setDataSet2} />
              )}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="w-[50%] h-full bg-slate-100 dark:bg-slate-600 shadow-inner rounded-md p-3">
          <div className="w-full h-fit justify-between flex">
            {dataset1 && dataset2 && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-blue-700 dark:text-blue-500">
                    {res?.data2?.length > 0 && (
                      <>
                        <IoMdPerson />
                        <label>{res?.data2.length}</label>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleMatchingMethod}
                    className="hover:scale-110 duration-500 border-2 border-blue-500 text-blue-500 flex gap-2 items-center w-[80px] justify-center rounded-md hover:bg-blue-500 hover:text-white py-1"
                  >
                    <FaPlay />
                  </button>
                </div>
                {res && (
                  <button
                    onClick={handleDeleteData}
                    className="text-[1.4rem] hover:text-red-500 hover:scale-110"
                  >
                    <MdDeleteOutline />
                  </button>
                )}
                <SideMenu
                  res={res}
                  threshold={threshold}
                  SetThreshold={SetThreshold}
                />
              </>
            )}
          </div>

          <div className="h-[80vh] w-full flex flex-col gap-2 mt-2 overflow-y-auto">
            {res?.matched ? (
              filteredResults.map((value: any, index: number) => (
                <div
                  key={index}
                  className={`flex justify-between items-center gap-1 dark:text-slate-300 text-slate-600  bg-slate-100 dark:bg-transparent p-1 rounded-md w-full ${
                    value.score > 90
                      ? "border-2 border-green-600"
                      : value.score > 85
                      ? "border-2 border-yellow-600"
                      : "border-2 border-red-600"
                  }`}
                >
                  <div className="flex flex-col gap-2 w-full px-2 sm:px-4 md:px-2">
                    <div className="flex gap-1 sm:gap-2 items-center">
                      <span
                        title={value.row1[1]}
                        className="font-bold text-sm sm:text-base md:text-lg truncate w-full"
                      >
                        {value.row1[0]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2 items-center text-[12px] sm:text-[13px] md:text-[14px] italic">
                      <span className="font-semibold">Matched with:</span>
                      <span
                        title={value.bestMatch[1]}
                        className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]"
                      >
                        {value.bestMatch[0]}
                      </span>
                    </div>
                  </div>
                  <label
                    className={`flex items-center justify-center mr-5 rounded-full w-10 h-10 shrink-0 flex-none ${
                      value.score > 90
                        ? "border-2 border-green-600 text-green-600"
                        : value.score > 85
                        ? "border-2 border-yellow-600 text-yellow-600"
                        : "border-2 border-red-600 text-red-600"
                    }`}
                  >
                    {value.score}
                  </label>
                </div>
              ))
            ) : (
              <NoBasis />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matcher;

// Upload button
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
    <>
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        onClick={handleButtonClick}
        className="flex flex-col gap-1 items-center justify-center font-extralight text-gray-400 dark:text-gray-300 rounded-md hover:text-blue-400 duration-300"
      >
        <AiOutlineUpload className="text-[1.5rem]" />
        {fileName ? (
          <label className="text-sm text-center font-extralight">
            Selected file: <strong>{fileName}</strong>
          </label>
        ) : (
          <span>Upload XLSX File</span>
        )}
      </button>
    </>
  );
};

// No Basis message
const NoBasis = () => {
  return (
    <div className="h-full w-full text-gray-400 flex items-center justify-center">
      No Basis
    </div>
  );
};
