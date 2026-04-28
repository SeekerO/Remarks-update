const privacyPoints = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Zero server uploads",
    desc: "Files are processed entirely in your browser using Web APIs. Nothing is ever transmitted to a server.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: "No tracking or analytics",
    desc: "We don't track which files you open, how you use tools, or collect any behavioural data.",
  },
  // {
  //   icon: (
  //     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
  //       <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  //     </svg>
  //   ),
  //   title: "Role-based access control",
  //   desc: "Admins control which users can access which tools. All permissions are managed server-side.",
  // },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "Open processing stack",
    desc: "Powered by pdf-lib, SheetJS, Canvas 2D, Mammoth, and APDF — all auditable open-source libraries.",
  },
];

export default function Privacy() {
  return (
    <section id="privacy" className="py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent pointer-events-none" />
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-violet-600/20 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-600/30 bg-emerald-600/10 text-emerald-300 text-xs font-medium mb-6"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Privacy · By design
            </div>
            <h2
              className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Your data stays{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                with you.
              </span>{" "}
              Always.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Avexi was built around a simple guarantee: sensitive workplace files —
              voter lists, HR records, branded assets — never touch a server.
              Client-side processing isn&apos;t a feature, it&apos;s the architecture.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {privacyPoints.map((point) => (
                <div
                  key={point.title}
                  className="flex flex-col gap-3 p-5 rounded-xl border border-[#1e2a40]/80 bg-[#0d1120]/60 hover:border-emerald-600/30 transition-colors duration-300"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-600/15 border border-emerald-600/20 flex items-center justify-center text-emerald-400">
                    {point.icon}
                  </div>
                  <div>
                    <h4
                      className="text-sm font-bold text-white mb-1"
                      style={{ fontFamily: "Syne, sans-serif" }}
                    >
                      {point.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual */}
          <div className="relative">
            <div className="relative rounded-2xl border border-[#1e2a40]/80 bg-[#0d1120]/80 p-8 overflow-hidden">
              {/* Animated network diagram */}
              <div className="flex flex-col items-center gap-6">
                {/* Browser node */}
                <div className="relative flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center mb-2">
                    <svg className="w-9 h-9 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-violet-300" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    Your Browser
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5">All processing happens here</span>
                </div>

                {/* Arrows & labels */}
                <div className="flex items-center gap-8 w-full justify-center">
                  {/* Left: file in */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-10 bg-gradient-to-b from-emerald-400/60 to-emerald-400/10" />
                      <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v9.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 13.586V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium" style={{ fontFamily: "JetBrains Mono, monospace" }}>Input files</span>
                  </div>

                  {/* Right: crossed out server */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-col items-center opacity-30">
                      <div className="w-px h-10 bg-gradient-to-b from-red-400/60 to-red-400/10" />
                      <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v9.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 13.586V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-red-400/60 font-medium line-through" style={{ fontFamily: "JetBrains Mono, monospace" }}>Server upload</span>
                  </div>
                </div>

                {/* Processed output */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center mb-2">
                    <svg className="w-9 h-9 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-emerald-300" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    Processed Output
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5">Downloaded to your device</span>
                </div>
              </div>

              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
