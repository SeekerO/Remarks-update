"use client";

import Link from "next/link";
import React, { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { IoChevronBack } from "react-icons/io5";
import kkk from "../../lib/image/KKK.png"
import Image from "next/image";

interface EvaluationData {
    FULLNAME: string;
    POSITION: string;
    "MUNICIPALITY/REGION": string;
    STATUS: string;
    REMARKS: string;
}

const Evaluation = () => {
    const [data, setData] = useState<EvaluationData[]>([]);
    const [search, setSearch] = useState("");

    // Memoized filtered data
    // const filteredData = useMemo(() => {
    //     return data.filter((item) =>
    //         item?.FULLNAME?.toLowerCase().includes(search.toLowerCase())
    //     );
    // }, [data, search]);

    const getStatusColor = (status: string) => {
        if (!status) return "text-gray-500"; // Default color for missing status
        const lowerStatus = status.toLowerCase();

        if (lowerStatus.includes("full")) return "text-green-700"; // Full compliance
        if (lowerStatus.includes("non")) return "text-red-500"; // Non-compliance
        if (lowerStatus.includes("partial")) return "text-yellow-500"; // Partial compliance

        return "text-gray-600"; // Default color if none of the keywords match
    };

    return (
        <div className="flex flex-col items-center py-5 bg-slate-300 h-screen text-slate-950">
            <div className="w-full mt-4 px-2">
                <Link href="/" className="text-slate-950 flex gap-1 items-center font-semibold hover:text-blue-700"><IoChevronBack className="text-[2rem]" />BACK</Link>
            </div>

            <div className="font-semibold tracking-widest text-[2.5rem] flex items-center">
                <Image src={kkk} alt="Description of image" width={100} height={50} />
                <label className="">EVALUATION</label>
            </div>
            <div className="flex flex-col items-center w-full gap-3 px-10 ">
                <div className="w-full flex text-slate-950">
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
                </div>
                {/* TABLE */}
                <div className="w-full h-full overflow-y-auto ">
                    <div className="grid grid-cols-5 font-bold text-[1rem] text-white bg-slate-900 py-3 px-10 mb-2 rounded-md tracking-wide text-center">
                        <label>FULLNAME</label>
                        <label>POSITION</label>
                        <label>MUNICIPALITY/REGION</label>
                        <label>STATUS</label>
                        <label>REMARKS</label>
                    </div>

                    <div className=" capitalize grid grid-cols-5 py-3 px-10  text-[1rem] border-b-[1px] border-slate-700 justify-center h-fit text-center items-center">
                        <label className="font-semibold ">
                            ERCILLO, ARMANDO AQUINO
                        </label>
                        <label className="">Member, Sangguniang Panlungso</label>
                        <label className="">
                            TAGUIG-SP
                        </label>
                        {/* ${getStatusColor(item.STATUS)} */}
                        <label className={`${getStatusColor("full")} text-center font-bold tracking-wider uppercase`}>
                            Full-Compliance
                        </label>
                        <label>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro consequuntur autem doloribus reiciendis adipisci maiores rem facere vitae libero veniam.
                        </label>

                    </div>
                </div>
            </div>
        </div>
    );
};
export default Evaluation;
