"use client";

import kkk from "../lib/image/KKK.png"; // Your logo/main image
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  // Animation variants for staggered reveal
  const containerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        when: "beforeChildren",
        staggerChildren: 0.2, // Stagger children animations
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-white overflow-hidden p-4">
      {/* Main content container with initial animation */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col justify-center items-center p-8 md:p-14 rounded-3xl shadow-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 max-w-xl w-full text-center relative overflow-hidden"
      >
        {/* Subtle background element inside the card */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-900 opacity-50 rounded-3xl -z-10 animate-pulse-subtle"></div>

        {/* Logo/Image */}
        <div className="mb-10 animate-bounce-subtle"> {/* More space below logo */}
          <Image
            src={kkk}
            alt="Application Logo"
            width={400} // Adjust width as needed
            height={80} // Adjust height to maintain aspect ratio
            priority
            className="" // Stronger shadow for logo
          />
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {/* Each Link is a motion.div item */}
          <motion.div variants={itemVariants}>
            <Link
              href="/Remarks"
              className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 uppercase tracking-wide"
            >
              Remarks
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              href="/"
              className="flex items-center justify-center px-8 py-4 bg-gray-300 text-gray-700 font-bold rounded-full shadow-md cursor-not-allowed opacity-70 transition-all duration-300 dark:bg-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 uppercase tracking-wide"
              aria-disabled="true"
            >
              Evaluation
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              href="/Matcher"
              className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 uppercase tracking-wide"
            >
              Matcher
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              href="/Watermarkv3"
              className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 uppercase tracking-wide"
            >
              Watermark
            </Link>
          </motion.div>
        </div>
      </motion.div>


    </div>
  );
}