"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthContext";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Logo from "@/../public/Avexi.png";
import { motion, AnimatePresence, Variants } from "framer-motion";

/* ── Animation Variants ── */
const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const logoPopVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay: 0.3,
    },
  },
};

// ── 2. The Text Slide-In (reveals from the bottom) ──
const nameSlideVariants: Variants = {
  hidden: { y: -30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1], // Smooth "out-expo" curve
      delay: 1, // Wait for logo pop to start
    },
  },
};

const HeaderSection = () => (
  <div className="flex flex-col items-center gap-4">
    {/* Logo Container */}
    <a href="/" title="Home">
      <motion.div
        variants={logoPopVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 flex items-center justify-center rounded-xl"
        style={{
          width: 60,
          height: 60,
          background: "rgba(99,102,241,0.15)",
          border: "0.5px solid rgba(99,102,241,0.35)",
        }}
      >
        <Image src={Logo} alt="Logo" width={52} className="animate-pulse" />
      </motion.div>
    </a>
    {/* Text Container with Masking */}
    <div className="overflow-hidden py-1">
      <motion.div
        variants={nameSlideVariants}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        <h1 className="text-xl font-semibold tracking-wide text-white/90">
          Avexi<span className="text-indigo-400">.</span>
        </h1>
        <p className="text-xs text-white/35 mt-0.5 tracking-wide">
          Workspace Tools
        </p>
      </motion.div>
    </div>
  </div>
);

export default function LoginClient() {
  const router = useRouter();
  const { loginWithGoogle, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* ── Background Glows & Floating Logos ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          {/*  <Image src={Logo} alt="" className="-top-80 -left-[30%] w-[100%] absolute blur-[50px] opacity-20" priority />
                    <Image src={Logo} alt="" className="-right-60 w-[60%] absolute blur-[40px] opacity-20" priority /> */}
        </motion.div>
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* ── Main Login Card ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(24px)",
          }}
        >
          <HeaderSection />

          <motion.div
            variants={itemVariants}
            className="w-full h-px bg-white/[0.07]"
          />

          <motion.div variants={itemVariants} className="text-center space-y-1">
            <p className="text-sm font-medium text-white/70">
              Sign in to continue
            </p>
            <p className="text-xs text-white/30 leading-relaxed">
              Access is restricted to authorized personnel only.
            </p>
          </motion.div>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-3 w-full py-3 rounded-xl
                          bg-white/95 text-gray-800 text-sm font-semibold transition-shadow
                          disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            ) : (
              <FcGoogle className="w-5 h-5" />
            )}
            {loading ? "Authenticating..." : "Continue with Google"}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-400 text-center -mt-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.p
            variants={itemVariants}
            className="text-[10px] text-white/20 text-center leading-relaxed"
          >
            By signing in you agree to the internal use policy. All activity is
            logged.
          </motion.p>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] text-white/15 font-mono mt-6"
        >
          Avexi v5.0.0
        </motion.p>
      </motion.div>
    </div>
  );
}
