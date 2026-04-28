export default function CTA() {
  return (
    <section className="py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/12 rounded-full blur-[100px] animate-glow-pulse pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-600/30 bg-violet-600/10 text-violet-300 text-xs font-medium mb-8"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block animate-ping-slow" />
          Ready when you are
        </div>

        <h2
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Start working
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-violet-300 to-blue-400">
            without the risk.
          </span>
        </h2>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Avexi gives your team a private, browser-based workspace that processes
          sensitive files with zero data exposure.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#"
            className="group relative px-10 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg transition-all duration-300 hover:shadow-[0_0_50px_rgba(124,58,237,0.5)] overflow-hidden"
          >
            <span className="relative z-10">Open Workspace →</span>
          </a>
          <a
            href="#"
            className="px-10 py-4 rounded-xl border border-[#1e2a40] hover:border-[#2e3a55] text-slate-300 hover:text-white font-semibold text-lg transition-all duration-300"
          >
            View documentation
          </a>
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
          {[
            "No account required",
            "Open-source libraries",
            "Zero server uploads",
            "Role-based access",
            "v5.0.0 stable",
          ].map((badge) => (
            <span key={badge} className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
