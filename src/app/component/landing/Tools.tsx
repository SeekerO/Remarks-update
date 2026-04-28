const tools = [
  {
    category: "Image & Design",
    badge: "Edit",
    items: [
      {
        icon: "💧",
        name: "Watermark V5",
        desc: "Batch watermark photos with logos, text, and footers. Configure placement, opacity, and scale.",
        tag: "Batch processing",
        color: "violet",
      },
      {
        icon: "✂️",
        name: "BG Remover",
        desc: "Remove image backgrounds entirely in-browser using AI segmentation models.",
        tag: "AI-powered",
        color: "blue",
      },
      {
        icon: "🔷",
        name: "Logo Maker",
        desc: "Build logos using shapes, text layers, and imported images. Export as PNG or SVG.",
        tag: "Vector export",
        color: "indigo",
      },
      {
        icon: "📐",
        name: "Resolution Adjuster",
        desc: "Downsample images for web or print using Canvas 2D. Outputs JPEG at 85% quality.",
        tag: "Canvas 2D",
        color: "purple",
      },
    ],
  },
  {
    category: "Documents & Data",
    badge: "Document",
    items: [
      {
        icon: "📄",
        name: "File Converter",
        desc: "Convert between Word, PDF, Excel, HTML, and combine PDFs — powered by pdf-lib, APDF, SheetJS.",
        tag: "7 conversion types",
        color: "emerald",
      },
      {
        icon: "🔍",
        name: "Matcher",
        desc: "Fuzzy-match voter names or records across two Excel files with a comparison analysis engine.",
        tag: "Fuzzy matching",
        color: "teal",
      },
      {
        icon: "📋",
        name: "FAQ & Remarks",
        desc: "Browse knowledge base documents and structured remarks for team reference and workflows.",
        tag: "Team docs",
        color: "cyan",
      },
      {
        icon: "📊",
        name: "DTR Extractor",
        desc: "Parse and extract daily time records from structured formats for payroll and audit use.",
        tag: "HR tooling",
        color: "sky",
      },
    ],
  },
];

const colorMap: Record<string, string> = {
  violet: "bg-violet-600/15 text-violet-300 border-violet-600/20",
  blue: "bg-blue-600/15 text-blue-300 border-blue-600/20",
  indigo: "bg-indigo-600/15 text-indigo-300 border-indigo-600/20",
  purple: "bg-purple-600/15 text-purple-300 border-purple-600/20",
  emerald: "bg-emerald-600/15 text-emerald-300 border-emerald-600/20",
  teal: "bg-teal-600/15 text-teal-300 border-teal-600/20",
  cyan: "bg-cyan-600/15 text-cyan-300 border-cyan-600/20",
  sky: "bg-sky-600/15 text-sky-300 border-sky-600/20",
};

export default function Tools() {
  return (
    <section id="tools" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-600/30 bg-violet-600/10 text-violet-300 text-xs font-medium mb-5"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
            Tool Suite · v5.0.0
          </div>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-white mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Everything you need,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
              nothing you don&apos;t.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            15 tools across image editing, document processing, and data analysis.
            All run locally in your browser — no accounts required for core features.
          </p>
        </div>

        {/* Tool categories */}
        {tools.map((cat) => (
          <div key={cat.category} className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#1e2a40]" />
              <span
                className="text-xs font-semibold text-slate-500 tracking-widest uppercase px-3"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                {cat.category}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#1e2a40]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cat.items.map((tool) => (
                <div
                  key={tool.name}
                  className="tool-card group relative rounded-2xl bg-[#0d1120]/80 p-6 cursor-pointer overflow-hidden"
                >
                  {/* Icon */}
                  <div className="text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
                    {tool.icon}
                  </div>
                  {/* Name */}
                  <h3
                    className="text-base font-bold text-white mb-2 group-hover:text-violet-300 transition-colors"
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    {tool.name}
                  </h3>
                  {/* Desc */}
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    {tool.desc}
                  </p>
                  {/* Tag */}
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorMap[tool.color]}`}
                  >
                    {tool.tag}
                  </span>

                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
