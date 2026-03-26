"use client";

import Link from "next/link";
import { useAuth } from "../../lib/auth/AuthContext";

export default function NotFound() {
    const { user } = useAuth();
    const dest = user?.isPermitted ? "/dashboard" : "/login";

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)] overflow-hidden relative">

            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-indigo-600/8 blur-3xl" />
            </div>

            {/* Grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.025]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6 max-w-sm">

                {/* 404 number */}
                <div className="relative">
                    <p
                        className="text-[120px] font-semibold leading-none tracking-tighter select-none"
                        style={{
                            background: "linear-gradient(180deg, rgba(129,140,248,0.4) 0%, rgba(129,140,248,0.05) 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        404
                    </p>
                    {/* Subtle line under the number */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-px bg-indigo-500/30" />
                </div>

                {/* Copy */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-white/60">
                        Page not found
                    </p>
                    <p className="text-xs text-white/25 leading-relaxed">
                        The page you're looking for doesn't exist or you don't have
                        permission to access it.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center gap-3 w-full">
                    <Link
                        href={dest}
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-5 rounded-xl
              bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
              text-white text-sm font-medium
              transition-colors duration-150 no-underline"
                    >
                        ← Back to {user?.isPermitted ? "dashboard" : "login"}
                    </Link>

                    <p className="text-[10px] text-white/15 font-mono">
                        Nexus · Election Information Division
                    </p>
                </div>

            </div>
        </div>
    );
}