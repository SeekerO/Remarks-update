"use client";

import kkk from "../lib/image/KKK.png";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen dark:bg-gray-900 light:bg-slate-100">
      <motion.div
        initial={{ y: -200, opacity: 0 }} // Start from above screen
        animate={{ y: 0, opacity: 1 }} // Fall down to normal position
        transition={{ duration: 1, ease: "easeOut" }} // Smooth animation
        className=" flex flex-col justify-center items-center w-fit h-fit bg-slate-300 dark:bg-slate-800 p-5 rounded-md shadow-inner"
      >
        <Image src={kkk} alt="Description of image" width={500} height={100} />

        <motion.div
          initial={{ opacity: 0, y: -50 }} // Start from above screen
          animate={{ opacity: 1, y: 0 }} // Fall down to normal position
          transition={{ duration: 1, delay: 1.5, ease: "easeOut" }} // Smooth animation
          className="flex gap-5 mt-4 justify-center"
        >
          <Link
            href={"/Remarks"}
            className="bg-blue-900 text-white font-semibold px-10 py-3 rounded-md hover:scale-110 duration-300"
          >
            REMARKS
          </Link>
          <Link
            href={"/Evaluation"}
            className="bg-blue-900 text-white font-semibold px-10 py-3 rounded-md hover:scale-110 duration-300"
          >
            EVALUATION
          </Link>
          <Link
            href={"/Matcher"}
            className="bg-blue-900 text-white font-semibold px-10 py-3 rounded-md hover:scale-110 duration-300"
          >
            MATCHER
          </Link>
          <Link
            href={"/Watermark"}
            className="bg-blue-900 text-white font-semibold px-10 py-3 rounded-md hover:scale-110 duration-300"
          >
            WATERMARK
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
