/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useLayoutEffect, useState } from "react";
import * as XLSX from "xlsx";
import LZString from "lz-string";
import kkk from "../../lib/image/KKK.png";
import moment from "moment";
import Duplicated from "./components/Template/download_template";
import CellItem from "./components/util/cellitem";

import { BsFiletypeXlsx } from "react-icons/bs";
import { MdDelete, MdNumbers } from "react-icons/md";
import {
  IoSearchOutline,
  IoChevronBack,
  IoCloudUploadOutline,
} from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaCheck, FaTimes } from "react-icons/fa";

interface EvaluationData {
  FULLNAME: string;
  NAME: string;
  POSITION: string;
  "MUNICIPALITY/REGION"?: string;
  STATUS: string;
  REMARKS?: string;
  _copied?: boolean;
  SEQ: string;
  REGION: string;
  PROVINCE: string;
  "CITY/MUN": string;
  SEAT: string;
}

const ITEMS_PER_PAGE = 50;

const Evaluation = () => {
  const [data, setData] = useState<EvaluationData[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // current number of the page
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // Opeing the xlsx modal
  const [controlno, setControlNo] = useState(false);

  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  useLayoutEffect(() => {
    const storedData =
      sessionStorage.getItem("evaluationData");
    if (storedData) {
      const decompressedData = JSON.parse(
        LZString.decompress(storedData) || "[]"
      );
      setData(decompressedData);
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);

    const readers: Promise<EvaluationData[]>[] = [];

    for (const file of files) {
      const reader = new FileReader();
      readers.push(
        new Promise((resolve) => {
          reader.onload = (e: ProgressEvent<FileReader>) => {
            const binaryString = e.target?.result as string;
            if (!binaryString) return resolve([]);

            const workbook = XLSX.read(binaryString, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) return resolve([]);

            let jsonData: EvaluationData[] = XLSX.utils.sheet_to_json(
              worksheet,
              {
                defval: "", // Use empty string instead of whitespace
              }
            );

            // Ensure `_copied` column is added before modifying data
            jsonData = jsonData.map((row) => ({ ...row, _copied: false }));

            let lastNonEmptyValue: any = null; // Store last non-empty value for column 7
            let lastNonEmptyRowIndex: number | null = null; // Track the last non-empty row index

            jsonData = jsonData.map((row: any, rowIndex: number) => {
              const newRow = { ...row };
              const column1Key = Object.keys(newRow)[0]; // Get key for 1st column
              const column7Key = Object.keys(newRow)[6]; // Get key for 7th column

              if (column1Key) {
                const originalValue = newRow[column1Key];

                newRow._firstFour =
                  typeof originalValue === "string"
                    ? originalValue.slice(0, 4)
                    : ""; // Extract first 4 characters
              }

              if (column7Key) {
                if (!newRow[column7Key] && lastNonEmptyValue !== null) {
                  newRow[column7Key] = lastNonEmptyValue; // Copy value from above
                  newRow._copied = true; // Mark row as copied

                  if (lastNonEmptyRowIndex !== null) {
                    jsonData[lastNonEmptyRowIndex]._copied = true;
                  }
                } else {
                  lastNonEmptyValue = newRow[column7Key]; // Update last known non-empty value
                  lastNonEmptyRowIndex = rowIndex;
                }
              }

              return newRow;
            });

            resolve(jsonData);
          };

          reader.readAsBinaryString(file);
        })
      );
    }

    Promise.all(readers).then((results) => {
      const mergedData = results.flat();
      setData((prevData) => [...prevData, ...mergedData]);
      setCurrentPage(1);
      const compressedData = LZString.compress(JSON.stringify(mergedData));
      sessionStorage.setItem("evaluationData", compressedData);
      setLoading(false);
    });
  };

  const filteredData = data.filter((row: any) => {
    if (!controlno) {
      // Search in all columns
      return Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(search.toLowerCase())
      );
    } else {
      // Search only in the 5th column
      const column5Key = Object.keys(row)[4]; // Get key for the 5th column dynamically
      return row[column5Key]
        ?.toString()
        .toLowerCase()
        .includes(search.toLowerCase());
    }
  });

  useEffect(() => {
    if (search.trim() !== "") setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const convertExcelTimestamp = (serial: number): string => {
    if (!serial || isNaN(serial)) return "Invalid Date";
    return moment("1899-12-30").add(serial, "days").format("YYYY-MM-DD");
  };

  const clearEvaluationData = () => {
    sessionStorage.removeItem("evaluationData");
    setData([]); // Clear the state
    setCurrentPage(1);
    window.location.reload();
  };

  const CountTotal = () => {
    const full = filteredData.filter(
      (item) =>
        item.STATUS?.toLowerCase().includes("full") &&
        item.STATUS?.toLowerCase().includes("compliance")
    ).length;
    const non = filteredData.filter(
      (item) =>
        item.STATUS?.toLowerCase().includes("non") &&
        item.STATUS?.toLowerCase().includes("compliance")
    ).length;
    const partial = filteredData.filter(
      (item) =>
        item.STATUS?.toLowerCase().includes("partial") &&
        item.STATUS?.toLowerCase().includes("compliance")
    ).length;

    return full + non + partial;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setSearch("");
    } else if (event.key === "-") {
      event.preventDefault(); // Prevent default "-" input
      setSearch((prev) => prev.slice(0, -1)); // Simulate backspace
    }
  };

  const toggleColumn = (column: string) => {
    setHiddenColumns((prevHidden) =>
      prevHidden.includes(column)
        ? prevHidden.filter((col) => col !== column)
        : [...prevHidden, column]
    );
  };

  const ColumnVisibilityDropdown = () => {
    return (
      <div className="relative inline-block text-left">
        <select
          className="px-4 py-2 bg-slate-100 rounded-md "
          onChange={(e) => toggleColumn(e.target.value)}
        >
          <option value="">Select Column</option>
          {Object.keys(filteredData[0] || {}).map((column) => (
            <option
              key={column}
              value={column}
              className="w-[300px] flex gap-2"
            >
              {!hiddenColumns.includes(column) ? "✔️ " : "❌ "}

              {column}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center py-5 bg-slate-300 h-screen text-slate-950">
      <div className="w-full mt-4 px-2">
        <Link
          href="/"
          className="text-slate-950 flex gap-1 items-center font-semibold hover:text-blue-700"
        >
          <IoChevronBack className="text-[2rem]" />
          BACK
        </Link>
      </div>

      <div className="font-semibold tracking-widest text-[2.5rem] flex items-center">
        <Image src={kkk} alt="Description of image" width={100} height={50} />
        <label className="">EVALUATION</label>
      </div>

      <div className="w-full flex text-slate-950 justify-between px-10 py-5">
        <div className="flex items-center">
          <button
            onClick={() => setControlNo(!controlno)}
            className={`flex items-center gap-1 border-[1px] p-2.5 rounded-xl ${controlno
              ? "border-blue-700 text-blue-700"
              : "border-slate-950 text-slate-950"
              }`}
          >
            CTRL <MdNumbers />
          </button>
          <div
            className={`flex w-[400px] px-2 py-0.5 gap-2 items-center mx-2 border-[1px] ${!controlno ? "border-slate-700" : "border-blue-700 text-blue-700"
              } rounded-xl`}
          >
            <IoSearchOutline className="text-[20px]" />
            <input
              type="text"
              onKeyDown={handleKeyDown}
              onChange={(e) => setSearch(e.target.value)}
              value={search}
              className={`w-full outline-none px-3 py-2 bg-slate-300 `}
              placeholder={`${!controlno ? "Search here.." : "Search Control No..."
                }`}
            />
          </div>
          <a
            onClick={() => setOpen(true)}
            className="border-[1px] border-slate-950 p-2 text-[1.3rem] rounded-md hover:border-green-600 hover:text-green-600 hover:scale-125 duration-300 cursor-pointer"
          >
            <BsFiletypeXlsx />
          </a>
        </div>

        <div className="flex items-center gap-5">
          {filteredData.length === 0 ? (
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:scale-125 duration-300 ">
              <IoCloudUploadOutline className="text-[20px]" /> Upload
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <a
              onClick={clearEvaluationData}
              className="flex items-center gap-2 px-4 py-3 border-[1px] border-red-500 text-red-500 hover:scale-125 duration-300 rounded-lg cursor-pointer"
            >
              <MdDelete className="text-[16px] font-bold" />
            </a>
          )}
        </div>
      </div>

      <div className="grid-cols-2 grid lg:grid-cols-4 px-10  justify-center gap-10 mb-2">
        <label className="font-semibold tracking-wide bg-green-700 text-slate-100 px-10 py-1 items-center flex rounded-md">
          COMPLIANT:{" "}
          {
            filteredData.filter((item) =>
              item.STATUS?.toLowerCase().includes("full")
            ).length
          }
        </label>

        <label className="font-semibold tracking-wide bg-red-700 text-slate-100 px-10 py-1 items-center flex rounded-md">
          NON-COMPLIANT:{" "}
          {
            filteredData.filter((item) =>
              item.STATUS?.toLowerCase().includes("non")
            ).length
          }
        </label>

        <label className="font-semibold tracking-wide bg-yellow-700 text-slate-100 px-10 py-1 items-center flex rounded-md">
          PARTIAL-COMPLIANT:{" "}
          {
            filteredData.filter((item) =>
              item.STATUS?.toLowerCase().includes("partial")
            ).length
          }
        </label>

        <label className="font-semibold tracking-wide bg-blue-700 text-slate-100 px-10 py-1 items-center flex rounded-md">
          TOTAL: {CountTotal()}
        </label>
      </div>
      <div className="py-3 w-full px-10">
        <ColumnVisibilityDropdown />
      </div>

      <div className="w-[95%] overflow-auto">
        {filteredData.length > 0 && (
          <div>
            {/* Mobile View (Card Layout) */}
            <div className="flex flex-col gap-4 lg:hidden">
              {paginatedData.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="border border-gray-950 bg-slate-300 p-4 rounded-md shadow"
                >
                  {Object.entries(row).map(([key, value], cellIndex) => {
                    let textColor = "";
                    let cellValue = value ? value.toString().trim() : " ";

                    // Convert Excel timestamp if applicable
                    if (typeof value === "number" && value > 40000) {
                      cellValue = convertExcelTimestamp(value);
                    }

                    // Apply color styling for first column
                    if (cellIndex === 0 && typeof value === "string") {
                      const lowerCell = value.toLowerCase();
                      if (lowerCell.includes("full"))
                        textColor = "text-green-600 font-semibold";
                      else if (lowerCell.includes("non"))
                        textColor = "text-red-600 font-semibold";
                      else if (lowerCell.includes("partial"))
                        textColor = "text-yellow-600 font-semibold";
                    }

                    return (
                      <div
                        key={cellIndex}
                        className="flex justify-between border-b border-gray-400 py-1"
                      >
                        <span className="font-semibold">{key}:</span>
                        <span className={`${textColor}`}>{cellValue}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Desktop View (Table) */}
            <table className="hidden lg:table w-full border-collapse border border-gray-950 bg-white">
              <thead>
                <tr className="bg-slate-950 text-white uppercase font-semibold">
                  {Object.keys(filteredData[0] || {}).map(
                    (key) =>
                      !hiddenColumns.includes(key) && (
                        <th
                          key={key}
                          className="border border-gray-950 px-4 text-center"
                        >
                          {key}
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData
                  .sort((a: any, b: any) => {
                    if (!controlno) return 0; // No sorting if controlno is false

                    const column5KeyA = Object.keys(a)[4]; // Get column 5 key dynamically
                    const column5KeyB = Object.keys(b)[4];

                    if (!column5KeyA || !column5KeyB) return 0; // Skip sorting if keys are missing

                    const valA = parseFloat(a[column5KeyA]); // Convert to number
                    const valB = parseFloat(b[column5KeyB]);

                    if (isNaN(valA) || isNaN(valB)) return 0; // Skip sorting if non-numeric

                    return valA - valB; // Sort numbers in ascending order (lowest first)
                  })
                  .map((row, rowIndex) => (
                    <tr key={rowIndex} className="border border-gray-950">
                      {Object.entries(row).map(
                        ([key, value], cellIndex) =>
                          !hiddenColumns.includes(key) && (
                            <CellItem
                              key={cellIndex}
                              cell={value}
                              cellIndex={cellIndex}
                            />
                          )
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredData.length > 0 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-4 py-2 bg-gray-400 disabled:opacity-50 rounded-lg"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-4 py-2 bg-gray-400 disabled:opacity-50 rounded-lg"
          >
            Next
          </button>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
          <AiOutlineLoading3Quarters className="text-slate-10 text-[2rem] animate-spin" />
        </div>
      )}

      <Duplicated open={open} setOpen={setOpen} />
    </div>
  );
};

export default Evaluation;
