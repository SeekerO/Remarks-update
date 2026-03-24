"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth/AuthContext";
import { Loader2 } from "lucide-react";
import { LogOut } from "lucide-react";

export default function RootPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Authenticated — send to dashboard or deny
    if (user.canChat === false) return; // withAuth will handle the denial UI
    router.replace("/dashboard");
  }, [user, isLoading, router]);

  /* Show spinner while auth resolves */
  if (isLoading || (user && user.canChat !== false)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)]">
        <div className="flex flex-col items-center gap-3">
          {/* Logo mark */}
          <div
            className="relative flex items-center justify-center rounded-xl mb-2"
            style={{
              width: 40, height: 40,
              background: "rgba(99,102,241,0.15)",
              border: "0.5px solid rgba(99,102,241,0.3)",
            }}
          >
            <div
              className="rounded-full"
              style={{ width: 16, height: 16, border: "1.5px solid #818cf8" }}
            />
            <div
              className="absolute rounded-full bg-[#a5b4fc]"
              style={{ width: 5, height: 5, top: 17, left: 17 }}
            />
          </div>

          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <p className="text-xs text-white/25 font-mono tracking-wide">
            Verifying access…
          </p>
        </div>
      </div>
    );
  }

  /* No access */
  if (user && user.canChat === false) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)]">
        <div
          className="flex flex-col items-center gap-4 p-8 rounded-2xl max-w-sm text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Lock icon */}
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-white/70">Access restricted</p>
            <p className="text-xs text-white/30 mt-1 leading-relaxed">
              Your account doesn't have permission to access Nexus yet.
              Contact your administrator to request access.
            </p>
          </div>

          <button
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign in with a different account
          </button>
        </div>
      </div>
    );
  }

  return null;
}