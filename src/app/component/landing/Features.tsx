const marqueeItems = [
  "Batch Watermarking",
  "Background Removal",
  "Logo Builder",
  "Resolution Scaler",
  "Word → PDF",
  "PDF → Excel",
  "Fuzzy Matching",
  "DTR Extraction",
  "CSC Reviewer",
  "File Combining",
  "Image Optimization",
  "Client-Side Only",
];

const roles = [
  // {
  //   title: "Administrators",
  //   icon: "🛡️",
  //   perks: ["Full 15-tool access", "User management", "Role & permission control", "Master workspace view"],
  //   color: "violet",
  // },
  {
    title: "User",
    icon: "👤",
    perks: ["Tool access by role", "Watermark & edit images", "Document conversions", "View assigned data"],
    color: "blue",
  },
  // {
  //   title: "Viewers",
  //   icon: "👁️",
  //   perks: ["Read-only access", "FAQ & remarks", "Directory lookup", "Restricted tool set"],
  //   color: "slate",
  // },
];

export default function Features() {
  return (
    <>
      {/* Marquee banner */}
      <div id="features" className="py-6 mt-10 bg-[#0d1120]/60 border-y border-[#1e2a40]/60 overflow-hidden">
        <div className="flex gap-0 animate-slide-right whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3 px-6 text-sm text-slate-500 font-medium shrink-0"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600/60 inline-block" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Roles section */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/6 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-extrabold text-white mb-4"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Built for teams
              <span className="text-violet-400">.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Granular role-based access ensures the right people have the right tools.
            </p>
          </div>

          <div className="flex flex-wrap w-full justify-center gap-6">
            {roles.map((role, i) => (
              <div
                key={role.title}
                className={`relative rounded-2xl border p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  i === 0
                    ? "border-violet-600/40 bg-violet-600/8 hover:border-violet-600/60"
                    : i === 1
                    ? "border-blue-600/30 bg-blue-600/5 hover:border-blue-600/50"
                    : "border-[#1e2a40]/80 bg-[#0d1120]/60 hover:border-slate-600/40"
                }`}
              >
                {i === 0 && (
                  <div className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300 border border-violet-600/30">
                    Most access
                  </div>
                )}
                <div className="text-3xl mb-4">{role.icon}</div>
                <h3
                  className="text-xl font-bold text-white mb-6"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  {role.title}
                </h3>
                <ul className="flex flex-col gap-3">
                  {role.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2.5 text-sm text-slate-400">
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
