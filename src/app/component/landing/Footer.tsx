import Image from "next/image";
import Logo from "../../../../public/Avexi.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#1e2a40]/60 bg-[#080b14]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src={Logo} height={32} width={32} alt="Logo" />
              <span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                Avexi<span className="text-violet-400">.</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              A private, client-side workspace for teams who handle sensitive files.
            </p>
            <div
              className="mt-4 text-xs text-slate-600 font-medium"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              Avexi v5.0.0
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              Tools
            </h4>
            <ul className="flex flex-col gap-2.5">
              {["Watermark V5", "BG Remover", "Logo Maker", "Resolution Adjuster", "File Converter"].map((item) => (
                <li key={item}>
                  <a href="/login" className="text-sm text-slate-500 hover:text-white transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Workspace */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              Workspace
            </h4>
            <ul className="flex flex-col gap-2.5">
              {["Dashboard", "Matcher", "Directory", "Documents", "Chat"].map((item) => (
                <li key={item}>
                  <a href="/login" className="text-sm text-slate-500 hover:text-white transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              Info
            </h4>
            <ul className="flex flex-col gap-2.5">
              {["Privacy Policy", "Docs", "Changelog", "FAQ", "Contact"].map((item) => (
                <li key={item}>
                  <a href="/login" className="text-sm text-slate-500 hover:text-white transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#1e2a40]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {year} Avexi. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-600" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            100% client-side · No data leaves your device
          </div>
        </div>
      </div>
    </footer>
  );
}
