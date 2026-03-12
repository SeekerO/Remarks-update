"use client"

import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { FcGoogle } from "react-icons/fc";
import { CiLogout } from "react-icons/ci";
import { ImSpinner9 } from "react-icons/im";

import { useAuth } from './Chat/AuthContext';
import kkk from '../lib/image/KKK.png';
import DarkModeToggle from '@/lib/components/dark-button';

export default function Home() {
  const { user, isLoading, loginWithGoogle, logout } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);

  const handleLoginClick = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  // ✅ Still loading — AuthGuard handles redirect, just show spinner
  if (isLoading) {
    return (
      <div className='flex w-screen h-screen items-center justify-center'>
        <ImSpinner9 className='animate-spin text-blue-500' size={40} />
      </div>
    );
  }

  // ✅ No user — AuthGuard will redirect to /login, show nothing
  if (!user) return null;

  // ✅ User confirmed — render page
  return (
    <>
      <Head>
        <title>KKK Tool - SeekerDev</title>
      </Head>
      <main className="flex flex-col items-center justify-center h-screen w-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-white overflow-hidden p-4 relative">
        <div className='py-2'>
          <DarkModeToggle />
        </div>
        <div className="absolute top-5 left-5">
          <button
            onClick={logout}
            className='flex items-center gap-1 font-semibold text-red-500 hover:underline duration-300 hover:text-blue-500'
          >
            <CiLogout size={25} /> Logout
          </button>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          className="flex flex-col justify-center items-center p-8 md:p-14 rounded-3xl shadow-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 max-w-xl w-full text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-900 opacity-50 rounded-3xl -z-10 animate-pulse-subtle" />

          <div className="mb-10 animate-bounce-subtle">
            <Image src={kkk} alt="Application Logo" width={400} height={80} priority />
          </div>

          {user.canChat !== false ? (
            <div className="flex items-center justify-center h-full gap-3 w-full">
              <motion.div onClick={() => setLoading(true)}>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 uppercase tracking-wide"
                >
                  Dashboard
                </Link>
              </motion.div>
            </div>
          ) : (
            <div className='flex flex-col gap-1'>
              <label className='text-lg text-red-500 font-semibold'>
                It seems you {`don't`} have permission to access this site
              </label>
              <label className='italic text-gray-500'>
                Kindly contact the admin to grant you access.
              </label>
            </div>
          )}
        </motion.div>

        {loading && (
          <div className='fixed inset-0 z-50 h-screen w-screen bg-black/40 flex items-center justify-center'>
            <ImSpinner9 className='animate-spin text-red-500' size={50} />
          </div>
        )}
      </main>
    </>
  );
}