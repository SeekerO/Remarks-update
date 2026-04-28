export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden grid-pattern mesh-gradient pt-16">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] animate-glow-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-blue-600/6 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Privacy badge */}
        <div className="animate-fade-up delay-100 inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full border border-[#1e2a40] bg-[#0d1120]/80 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span
            className="text-xs text-slate-400 font-medium tracking-wide"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            100% client-side · your files never leave your device
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up delay-200 text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[0.95] mb-6"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          The workspace
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-violet-300 to-blue-400 glow-text">
            that stays private.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-up delay-300 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Batch watermark images, remove backgrounds, match voter lists, convert documents —
          all processed in your browser. Zero uploads. Zero exposure.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="/login"
            className="group relative px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] overflow-hidden"
          >
            <span className="relative z-10">Open Workspace →</span>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a
            href="/login"
            className="px-8 py-4 rounded-xl border border-[#1e2a40] hover:border-[#2e3a55] text-slate-300 hover:text-white font-semibold text-base transition-all duration-300 hover:bg-[#111827]/50"
          >
            Explore tools
          </a>
        </div>

        {/* Stats bar */}
        <div className="animate-fade-up delay-500 grid grid-cols-3 gap-px bg-[#1e2a40]/60 rounded-2xl overflow-hidden border border-[#1e2a40]/60 max-w-xl mx-auto">
          {[
            { value: "15+", label: "Tools" },
            { value: "0 KB", label: "Server uploads" },
            { value: "v5", label: "Current version" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#0d1120]/80 px-6 py-4 text-center">
              <div
                className="text-xl font-bold text-white"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {value}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating UI preview */}
      <div className="animate-fade-up delay-600 relative z-10 w-full max-w-5xl mx-auto px-6 mt-20">
        <div className="animate-float">
          <div className="relative rounded-2xl overflow-hidden border border-[#1e2a40]/80 bg-[#0d1120]/60 backdrop-blur-sm shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(124,58,237,0.1)]">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e2a40]/60 bg-[#111827]/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-[#1a2235] rounded-md px-3 py-1.5 text-xs text-slate-500 font-mono flex items-center gap-2 max-w-xs">
                  <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  app.avexi.com/watermark
                </div>
              </div>
            </div>
            {/* Dashboard preview illustration */}
            <div className="flex h-72 md:h-96">
              {/* Sidebar */}
              <div className="hidden md:flex w-48 border-r border-[#1e2a40]/60 bg-[#080b14]/80 flex-col">
                <div className="p-4 border-b border-[#1e2a40]/40">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-violet-600/80 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white/80 rounded-sm" />
                    </div>
                    <div className="h-3 w-16 bg-white/20 rounded" />
                  </div>
                </div>
                <div className="p-3 flex flex-col gap-1">
                  {["Dashboard", "Edit", "Watermark V5", "BG Remover", "Logo Maker"].map((item, i) => (
                    <div
                      key={item}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                        i === 2 ? "bg-violet-600/20 border border-violet-600/30" : ""
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${i === 2 ? "bg-violet-400" : "bg-slate-600"}`} />
                      <div className={`h-2 rounded ${i === 2 ? "w-20 bg-violet-300/60" : "w-16 bg-slate-600/60"}`} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Main content */}
              <div className="flex-1 p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-32 bg-white/20 rounded" />
                  <div className="h-4 w-16 bg-slate-600/40 rounded text-xs" />
                </div>
                {/* Tool cards grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                  {[
                    { color: "violet", label: "Watermark V5" },
                    { color: "blue", label: "BG Remover" },
                    { color: "emerald", label: "Logo Maker" },
                    { color: "amber", label: "File Converter" },
                  ].map(({ color, label }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#1e2a40]/80 bg-[#111827]/60 p-4 flex flex-col justify-between hover:border-violet-600/40 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center mb-8 ${
                          color === "violet"
                            ? "bg-violet-600/30"
                            : color === "blue"
                            ? "bg-blue-600/30"
                            : color === "emerald"
                            ? "bg-emerald-600/30"
                            : "bg-amber-600/30"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-sm ${
                          color === "violet" ? "bg-violet-400/60" : color === "blue" ? "bg-blue-400/60" : color === "emerald" ? "bg-emerald-400/60" : "bg-amber-400/60"
                        }`} />
                      </div>
                      <div className="h-2.5 w-20 bg-white/30 rounded" />
                      <div className="h-1.5 w-14 bg-slate-600/40 rounded mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 animate-bounce">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
