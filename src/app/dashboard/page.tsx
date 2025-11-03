import React from "react";
import kkk from "@/lib/image/KKK.png"
import Image from "next/image";
const page = () => {
    return <div className="w-full h-full flex justify-center items-center ">
        <div className="p-10  rounded-md">
            <Image
                src={kkk}
                alt="Application Logo"
                width={400}
                height={80}
                priority
                className="opacity-30 blur-[1px]"
            />
        </div>
    </div>;
};

export default page;
