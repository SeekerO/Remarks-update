"use client"
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import kkk from '../lib/image/KKK.png'; // adjust if needed
import { ImSpinner9 } from "react-icons/im";
import { useState } from 'react';
import { FcGoogle } from "react-icons/fc";
import { useAuth } from './Chat/AuthContext';

export default function Home() {
  const { user, loginWithGoogle, logout } = useAuth(); // Get user, login, and logout functions from AuthContext
  const [loading, setLoading] = useState<boolean>(false)
  const containerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10,
        when: 'beforeChildren',
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10,
      },
    },
  };

  // Handles Google login click
  const handleLoginClick = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Google login failed:", error);
      // In a real app, you'd show a user-friendly error message here (e.g., a toast notification)
    }
  };


  const handleLoading = () => {
    return setLoading(true)
  }

  if (!user) {
    return (<div className='flex w-screen h-screen items-center justify-center select-none'>
      <div className='w-[450px] h-[300px] shadow-md light:bg-slate-200 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-4 gap-5 relative'>
        <Image
          src={kkk}
          alt="Application Logo"
          width={200}
          height={80}
          priority
        />
        <button onClick={handleLoginClick} className='bg-blue-500 text-slate-50 px-5 py-3 duration-300 hover:scale-105 rounded-md font-semibold flex gap-2 items-center'>
          <FcGoogle size={20} />   Sign using Google Login
        </button>
        <p className='text-sm text-slate-500 italic absolute bottom-3'>Note: Please contact the admin after logging in</p>
      </div>
    </div>)
  }

  return (
    <>
      <Head>
        <title>Home | My App</title>
      </Head>
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-white overflow-hidden p-4">


        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col justify-center items-center p-8 md:p-14 rounded-3xl shadow-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 max-w-xl w-full text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-900 opacity-50 rounded-3xl -z-10 animate-pulse-subtle"></div>

          <div className="mb-10 animate-bounce-subtle">
            <Image
              src={kkk}
              alt="Application Logo"
              width={400}
              height={80}
              priority
            />
          </div>
          {user.canChat !== false &&
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">

              <motion.div onClick={handleLoading} variants={itemVariants}>
                <Link
                  href="/Remarks"
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 uppercase tracking-wide"
                >
                  Remarks
                </Link>
              </motion.div>

              <motion.div onClick={handleLoading} variants={itemVariants}>
                <Link
                  href="/Evaluation"
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 uppercase tracking-wide"

                >
                  Evaluation
                </Link>
              </motion.div>

              <motion.div onClick={handleLoading} variants={itemVariants}>
                <Link
                  href="/Matcher"
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 uppercase tracking-wide"
                >
                  Matcher
                </Link>
              </motion.div>

              <motion.div onClick={handleLoading} variants={itemVariants}>
                <Link
                  href="/Watermarkv3"
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 uppercase tracking-wide"
                >
                  WaterMark
                </Link>
              </motion.div>
            </div>
          }
        </motion.div>


        {loading &&
          <div className='fixed inset-0 z-50 h-screen w-screen bg-black/40 flex items-center justify-center'>
            <ImSpinner9 className='animate-spin text-red-500' size={50} />
          </div>
        }
      </div>
    </>
  );
}
