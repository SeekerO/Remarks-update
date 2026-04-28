"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Logo from "../../../../public/Avexi.png";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 backdrop-blur-sm  ${
        scrolled
          ? "bg-[#080b14] backdrop-blur-xl border-b border-[#1e2a40]/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center group">
          <Image src={Logo} height={50} width={50} alt="Logo" />
          <span
            className="text-lg font-bold tracking-tight text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Avexi
            <span className="text-violet-400">.</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "Tools", "Privacy", "Docs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200 font-medium"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="text-sm text-slate-400 hover:text-white transition-colors duration-200 font-medium px-4 py-2"
          >
            Sign in
          </a>
          <a
            href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
          >
            Get started →
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-slate-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0d1120]/95 backdrop-blur-xl border-t border-[#1e2a40]/60 px-6 py-4 flex flex-col gap-4">
          {["Features", "Tools", "Privacy", "Docs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <a
            href="#"
            className="text-sm font-semibold px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-center transition-all"
          >
            Get started →
          </a>
        </div>
      )}
    </header>
  );
}
