"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthContext";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Logo from "@/../public/Avexi.png"


/* ── Nexus logo mark (matches sidebar) ── */
const LogoMark = () => (
    <div
        className="relative flex items-center justify-center rounded-xl"
        style={{
            width: 60, height: 60,
            background: "rgba(99,102,241,0.15)",
            border: "0.5px solid rgba(99,102,241,0.35)",
        }}
    >

        <Image src={Logo} alt="Dosmos" width={52} className="animate-pulse" />
    </div>
);

export default function LoginPage() {
    const router = useRouter();
    const { loginWithGoogle, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /* Redirect if already signed in */
    useEffect(() => {
        if (user) router.replace("/dashboard");
    }, [user, router]);

    const handleLogin = async () => {
        try {
            setLoading(true);
            setError("");
            await loginWithGoogle();
            router.replace("/dashboard");
        } catch (err) {
            setError("Sign-in failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (user) return null;

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[var(--nexus-sidebar-bg)] overflow-hidden relative">

            {/* ── Background glow ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-3xl" />
            </div>

            {/* ── Subtle grid overlay ── */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            {/* ── Card ── */}
            <div className="relative z-10 w-full max-w-sm mx-4">
                <div
                    className="rounded-2xl p-8 flex flex-col items-center gap-6"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "0.5px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(20px)",
                    }}
                >
                    {/* Logo */}
                    <div className="flex flex-col items-center gap-3">
                        <LogoMark />
                        <div className="text-center">
                            <h1 className="text-xl font-semibold tracking-wide text-white/90">
                                Avexi<span className="text-indigo-400">.</span>
                            </h1>
                            <p className="text-xs text-white/35 mt-0.5 tracking-wide">
                                Workspace Tools
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-white/[0.07]" />

                    {/* Welcome copy */}
                    <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-white/70">
                            Sign in to continue
                        </p>
                        <p className="text-xs text-white/30 leading-relaxed">
                            Access is restricted to authorized personnel only.
                            Contact your administrator if you need access.
                        </p>
                    </div>

                    {/* Google sign-in button */}
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl
              bg-white hover:bg-gray-50 active:bg-gray-100
              border border-black/10
              text-gray-700 text-sm font-medium
              transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-sm hover:shadow-md"
                    >
                        {loading
                            ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            : <FcGoogle className="w-4 h-4" />
                        }
                        {loading ? "Signing in…" : "Continue with Google"}
                    </button>

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-red-400 text-center -mt-2">{error}</p>
                    )}

                    {/* Footer note */}
                    <p className="text-[10px] text-white/20 text-center leading-relaxed">
                        By signing in you agree to the internal use policy.
                        All activity is logged.
                    </p>
                </div>

                {/* Version */}
                <p className="text-center text-[10px] text-white/15 font-mono mt-4">
                    Avexi v5.0.0
                </p>

            </div>
            <Image src={Logo} alt="Avexi" className=" -top-30 -left-56 w-[60%] z-0 absolute blur-[70px] opacity-15" />
            <Image src={Logo} alt="Avexi" className=" -top-30 -right-56 w-[60%] z-0 absolute blur-[70px] opacity-15" />
        </div>

    );
}