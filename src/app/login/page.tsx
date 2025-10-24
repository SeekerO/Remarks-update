// page.tsx
'use client'

import React, { useEffect } from "react";
import Image from "next/image";
// 🚨 Import useRouter from next/navigation
import { useRouter } from "next/navigation";
import kkk from '../../lib/image/KKK.png'
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../Chat/AuthContext";

const Login = () => {
    // 🚨 Initialize the router
    const router = useRouter();
    const { loginWithGoogle, user } = useAuth()

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    // Handles Google login click
    const handleLoginClick = async () => {
        try {
            await loginWithGoogle();
            // 🚨 Redirect to the home page after successful login
            router.push('/');
        } catch (error) {
            console.error("Google login failed:", error);
            // In a real app, you'd show a user-friendly error message here (e.g., a toast notification)
        }
    };

    if (!user)
        return <div className='flex w-screen h-screen items-center justify-center select-none'>
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
        </div>;
};

export default Login;