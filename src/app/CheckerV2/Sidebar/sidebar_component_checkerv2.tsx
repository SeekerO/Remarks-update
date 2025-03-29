/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import BASIS from "./basis";
import MATCH from "./match";

const SideBarChecker = ({
    open,
    setOpen,
    dataSetEvaluated,
    dataSet,
    handleFileUpload,
    removeFunction
}: {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    dataSetEvaluated: any;
    dataSet: any;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: "data_set" | "clc_data") => void;
    removeFunction: (type: "data_set" | "clc_data") => void;
}) => {
    // SEARCH PARAMS        
    const [searchDataSet, setSearchDataSet] = useState<string>("");
    const [searchDataSetEvaluated, setSearchDataSetEvaluated] =
        useState<string>("");

    //    SIDE BAR
    const [openBasisMatch, setOpenBasisMatch] = useState<boolean>(false);


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

    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isMobile = window.innerWidth < 500;
            const clickedOutside = ref.current && !ref.current.contains(event.target as Node);

            if (isMobile && clickedOutside) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setOpen]);



    return (<>
        <div ref={ref} className="z-50 bg-slate-800 text-white w-full h-full shrink-0 items-center flex flex-col px-2 gap-y-2 justify-center overflow-auto">
            {open &&
                <>
                    <div className="flex flex-col w-full mt-2">
                        {filteredDataSet.length === 0 ? (
                            <label className="group/basis w-full text-center py-2 bg-slate-950 hover:py-4 hover:bg-slate-600 hover:rounded-md cursor-pointer duration-300 rounded-lg flex items-center justify-center gap-1 hover:text-[1.1rem] text-[1rem]">
                                <IoCloudUploadOutline className="group-hover/basis:text-[1.4rem] duration:300" />{" "}
                                UPLOAD DATA BASIS
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={(e) => handleFileUpload(e, "data_set")}
                                    className="hidden"
                                />
                            </label>
                        ) : (
                            <button
                                onClick={() => removeFunction("data_set")}
                                className="flex items-center text-[1rem] bg-red-500 px-2 py-1 rounded-md gap-1 hover:py-3 duration-300 hover:bg-red-800 justify-center"
                            >
                                <MdDelete className="text-[1.2rem]" /> DELETE DATA BASIS
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col w-full">
                        {filteredDataEval.length === 0 ? (
                            <label className="group/match w-full text-center py-2 bg-slate-950 hover:py-4 hover:bg-slate-600 hover:rounded-md cursor-pointer duration-300 rounded-lg flex items-center justify-center gap-1 hover:text-[1.1rem] text-[1rem]">
                                <IoCloudUploadOutline className="group-hover/match:text-[1.4rem] duration:300" />
                                UPLOAD DATA TO MATCH
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={(e) => handleFileUpload(e, "clc_data")}
                                    className="hidden"
                                />
                            </label>
                        ) : (
                            <button
                                onClick={() => removeFunction("clc_data")}
                                className="flex items-center text-[1rem] bg-red-500 px-2 py-1 rounded-md gap-1 hover:py-3 duration-300 hover:bg-red-800 justify-center"
                            >
                                <MdDelete className="text-[1.2rem]" /> DELETE DATA TO MATCH
                            </button>
                        )}
                    </div>

                    <div className="h-full w-full mt-3 gap-1 flex-col flex">
                        <div className="flex gap-2 items-center justify-center w-full">
                            {dataSet.length !== 0 && (
                                <button
                                    onClick={() => setOpenBasisMatch(false)}
                                    className={`group/buttonBasis w-32 h-8 hover:scale-110 duration-300 cursor-pointer skew-x-12 items-center justify-center flex ${!openBasisMatch
                                        ? "bg-slate-100 text-slate-950"
                                        : "bg-slate-950"
                                        }`}
                                >
                                    <label className="flex -skew-x-12 group-hover/buttonBasis:text-[15px] duration-300 cursor-pointer">
                                        BASIS
                                    </label>
                                </button>
                            )}

                            {dataSetEvaluated.length !== 0 && (
                                <button
                                    onClick={() => setOpenBasisMatch(true)}
                                    className={`group/buttonMatch w-32 h-8 hover:scale-110 duration-300 cursor-pointer  skew-x-12 items-center justify-center flex ${openBasisMatch
                                        ? "bg-slate-100 text-slate-950"
                                        : "bg-slate-950"
                                        }`}
                                >
                                    <label className="flex -skew-x-12 group-hover/buttonMatch:text-[15px] duration-300 cursor-pointer">
                                        MATCH
                                    </label>
                                </button>
                            )}
                        </div>
                        <div className="w-full h-full flex mt-3">
                            {(filteredDataEval.length !== 0 ||
                                filteredDataSet.length !== 0) && (
                                    <>
                                        <BASIS
                                            open={openBasisMatch}
                                            filteredDataEval={filteredDataEval}
                                            setSearchDataSetEvaluated={setSearchDataSetEvaluated}
                                            searchDataSetEvaluated={searchDataSetEvaluated}
                                        />
                                        <MATCH
                                            open={openBasisMatch}
                                            filteredDataSet={filteredDataSet}
                                            searchDataSet={searchDataSetEvaluated}
                                            setSearchDataSet={setSearchDataSetEvaluated}
                                        />
                                    </>
                                )}
                        </div>
                    </div>
                </>
            }
        </div>
    </>)
}
export default SideBarChecker;