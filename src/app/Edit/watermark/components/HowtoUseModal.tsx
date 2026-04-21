"use client";

import React, { useState, useEffect, useRef } from "react";

interface Step {
  num: number;
  title: string;
  desc: string;
  /** Path/URL to a GIF or image shown in the accordion drawer */
  preview?: string;
}
interface Card {
  title: string;
  desc: string;
}
interface Group {
  icon: string;
  label: string;
  color: string;
  items: string;
}
interface Format {
  badge: string;
  color: string;
  desc: string;
}
interface Shortcut {
  label: string;
  keys: string[];
}
interface ProTip {
  title: string;
  desc: string;
}

interface BaseTab {
  id: string;
  label: string;
  icon: string;
  tip?: string | null;
}
interface StepTab extends BaseTab {
  steps: Step[];
}
interface WatermarkTab extends StepTab {
  cards: Card[];
}
interface AdjustTab extends StepTab {
  groups: Group[];
}
interface ExportTab extends StepTab {
  formats: Format[];
}
interface TipsTab extends BaseTab {
  shortcuts: Shortcut[];
  tips: ProTip[];
}

type AnyTab = StepTab | WatermarkTab | AdjustTab | ExportTab | TipsTab;

function hasSteps(tab: AnyTab): tab is StepTab {
  return "steps" in tab;
}
function hasCards(tab: AnyTab): tab is WatermarkTab {
  return "cards" in tab;
}
function hasGroups(tab: AnyTab): tab is AdjustTab {
  return "groups" in tab;
}
function hasFormats(tab: AnyTab): tab is ExportTab {
  return "formats" in tab;
}
function hasShortcuts(tab: AnyTab): tab is TipsTab {
  return "shortcuts" in tab;
}

const HOW_TO_USE_DATA = {
  title: "Watermark Editor",
  tabs: [
    {
      id: "upload",
      label: "Upload",
      icon: "↑",
      steps: [
        {
          num: 1,
          title: "Drag or click to add images",
          desc: "Drop any number of images onto the large dashed zone, or click Add Images. JPEG, PNG, and WebP are all supported.",
          preview: "/how-to/upload-drag-drop.gif",
        },
        {
          num: 2,
          title: "Add logos and footers",
          desc: "Use Global Logos and Global Footer to apply the same asset to every image. Both accept multiple files — logos stack, footers layer.",
          preview: "/how-to/upload-logos-footers.gif",
        },
        {
          num: 3,
          title: "Browse preset images",
          desc: "Click Browse Preset Images at the bottom to pick from built-in EID and COMELEC logos or shadow footers, then choose whether to add as a logo or footer.",
          preview: "/how-to/upload-preset-browser.gif",
        },
        {
          num: 4,
          title: "Image optimization toggle",
          desc: "When ON, files over 10 MB are automatically downscaled to 2500 px to keep things fast. Turn it OFF to preserve full resolution.",
          preview: "/how-to/upload-optimization.gif",
        },
      ],
      tip: "Switch to Individual mode in the Watermark tab first, then come back here to upload assets that apply only to the selected image.",
    },
    {
      id: "watermark",
      label: "Watermark",
      icon: "◈",
      steps: [
        {
          num: 1,
          title: "Global vs. individual scope",
          desc: "The toggle switches between Global (same watermarks on all images) and Individual (separate settings per image). Tap Copy from Global to copy all global assets into the current image.",
          preview: "/how-to/watermark-global-individual.gif",
        },
        {
          num: 2,
          title: "Select a logo to adjust",
          desc: "Click a thumbnail in the logo grid to select it. Sliders for position, width, height, padding, opacity, and rotation appear below. Drag thumbnails to reorder layering.",
          preview: "/how-to/watermark-select-logo.gif",
        },
        {
          num: 3,
          title: "Footer — auto fit mode",
          desc: "Footers default to Auto Fit — they center at the bottom and scale automatically. Use Fit Size % to control width. Disable Auto Fit for manual scale and offsetX/Y control.",
          preview: "/how-to/watermark-footer-autofit.gif",
        },
        {
          num: 4,
          title: "Edge warning",
          desc: "An amber badge appears on the preview card if a logo is within 10 px of any edge. Increase the padding sliders to fix it.",
          preview: "/how-to/watermark-edge-warning.gif",
        },
      ],
      tip: null,
      cards: [
        {
          title: "Position",
          desc: "6 anchor points — corners and center-top / center-bottom.",
        },
        {
          title: "Width / Height",
          desc: "Pixel size of the rendered logo on the canvas.",
        },
        {
          title: "Padding X / Y",
          desc: "Distance from the nearest edge. Warns when ≤ 10 px.",
        },
        { title: "Opacity", desc: "0% = invisible, 100% = fully opaque." },
        {
          title: "Rotation",
          desc: "−180° to +180°, rotates around the logo center.",
        },
        {
          title: "Reorder",
          desc: "Drag thumbnails — earlier in the list = rendered first (underneath).",
        },
      ],
    },
    {
      id: "adjust",
      label: "Adjust",
      icon: "⊹",
      steps: [
        {
          num: 1,
          title: "Select an image first",
          desc: "Click any preview card to select it. Adjustments apply globally by default. Switch to Individual mode to adjust each image independently.",
          preview: "/how-to/adjust-select-image.gif",
        },
        {
          num: 2,
          title: "Expand a section to see sliders",
          desc: "Four collapsible groups: Light, Color, Detail, and Effects. A blue bubble on the header shows how many sliders are non-zero.",
          preview: "/how-to/adjust-expand-section.gif",
        },
        {
          num: 3,
          title: "Reset controls",
          desc: "The Reset button at the top clears all adjustments. Each expanded section also has its own Reset link when any slider is modified.",
          preview: "/how-to/adjust-reset.gif",
        },
      ],
      tip: "Open the full-screen preview (the expand icon on any card) to adjust sliders while seeing the image at full size, with pan and zoom support.",
      groups: [
        {
          icon: "☀",
          label: "Light",
          color: "amber",
          items:
            "Exposure · Brilliance · Highlights · Shadows · Contrast · Brightness · Black point",
        },
        {
          icon: "◐",
          label: "Color",
          color: "coral",
          items: "Saturation · Vibrance · Warmth · Tint",
        },
        {
          icon: "⊕",
          label: "Detail",
          color: "blue",
          items: "Sharpness · Definition · Noise reduction",
        },
        {
          icon: "✦",
          label: "Effects",
          color: "purple",
          items: "Vignette — darkens corners for a cinematic look",
        },
      ],
    },
    {
      id: "metadata",
      label: "Metadata",
      icon: "⌗",
      steps: [
        {
          num: 1,
          title: "Enable the injector",
          desc: "Toggle Metadata Injector on. Fields and sections will appear below. Metadata is only embedded on export when this toggle is on.",
          preview: "/how-to/metadata-enable.gif",
        },
        {
          num: 2,
          title: "Fill in the identity fields",
          desc: "Title, Author, and Copyright are the most widely supported fields. Embedded in XMP, EXIF, and PNG tEXt chunks — readable by Lightroom, ExifTool, and Windows Explorer.",
          preview: "/how-to/metadata-identity-fields.gif",
        },
        {
          num: 3,
          title: "Add keywords and description",
          desc: "Separate keywords with commas. The description is embedded in the XMP dc:description field.",
          preview: "/how-to/metadata-keywords.gif",
        },
        {
          num: 4,
          title: "Optional: visible text watermark",
          desc: "Inside the Text Watermark section, enable the toggle to render visible copyright text directly on each exported image. Control position, font size, opacity, and background color.",
          preview: "/how-to/metadata-text-watermark.gif",
        },
        {
          num: 5,
          title: "Custom fields",
          desc: "Two key/value pairs you can name freely. They are stored as XMP extension fields in the output file.",
          preview: "/how-to/metadata-custom-fields.gif",
        },
      ],
      tip: "PNG uses tEXt + iTXt(XMP) chunks. JPEG uses APP1(XMP) + APP1(EXIF) + COM segments. WebP does not support metadata injection in this tool.",
    },
    {
      id: "export",
      label: "Export",
      icon: "⇩",
      steps: [
        {
          num: 1,
          title: "Set a file name",
          desc: "Type a base name in the filename field (max 256 chars). Each file will be named [originalname]_watermarked.[format] inside a ZIP folder.",
          preview: "/how-to/export-filename.gif",
        },
        {
          num: 2,
          title: "Open export settings",
          desc: "Click the Export button in the toolbar to expand format, quality, scale, compression, and metadata options.",
          preview: "/how-to/export-settings.gif",
        },
        {
          num: 3,
          title: "Choose a format",
          desc: "PNG — lossless, best for logos & transparency. JPG — smallest file, best for photos. WebP — modern, best quality-to-size ratio.",
          preview: "/how-to/export-format.gif",
        },
        {
          num: 4,
          title: "Output scale",
          desc: "0.5× halves resolution for smaller files. 2× doubles it for high-DPI / print. Scale is applied on top of the original image dimensions.",
          preview: "/how-to/export-scale.gif",
        },
        {
          num: 5,
          title: "Download all or selected",
          desc: "Click ZIP to export every image. Use the checkboxes in the batch bar to select specific images, then click Download (N) to export only those.",
          preview: "/how-to/export-download.gif",
        },
      ],
      tip: null,
      formats: [
        {
          badge: "PNG",
          color: "indigo",
          desc: "Lossless · transparent backgrounds preserved · largest file size · no quality slider",
        },
        {
          badge: "JPG",
          color: "green",
          desc: "Lossy · quality slider 10–100% · smallest files · no transparency",
        },
        {
          badge: "WebP",
          color: "teal",
          desc: "Lossy or lossless · quality slider · best ratio · modern browsers only",
        },
        {
          badge: "ZIP",
          color: "amber",
          desc: "None → High compression. Higher = smaller ZIP but slower to generate.",
        },
      ],
    },
    {
      id: "tips",
      label: "Tips",
      icon: "⚡",
      shortcuts: [
        { label: "Next image", keys: ["→", "↓"] },
        { label: "Previous image", keys: ["←", "↑"] },
        { label: "Deselect image", keys: ["Esc"] },
        { label: "Undo", keys: ["Ctrl", "Z"] },
        { label: "Redo", keys: ["Ctrl", "Shift", "Z"] },
        { label: "Save template", keys: ["Ctrl", "S"] },
        { label: "Download single", keys: ["Ctrl", "D"] },
        { label: "Zoom in/out (preview)", keys: ["+", "−"] },
        { label: "Reset zoom (preview)", keys: ["0"] },
        { label: "Close preview", keys: ["Esc"] },
      ],
      tips: [
        {
          title: "Double-click to deselect",
          desc: "Double-click a selected preview card to deselect it without using the keyboard.",
        },
        {
          title: "Drag cards to reorder",
          desc: "Grab any preview card and drag it to change the order images appear in the ZIP.",
        },
        {
          title: "Reorder logo layers",
          desc: "Drag logo or footer thumbnails in the Watermark tab to change render order — earlier thumbnails render underneath.",
        },
        {
          title: "Grid layout controls",
          desc: "On desktop, use the 1/2/3 column switcher (top-right of the preview area) to change how many cards appear per row.",
        },
        {
          title: "Estimated export size",
          desc: "The ZIP button shows a rough file size estimate that updates as you change format, quality, and scale settings.",
        },
      ],
    },
  ],
};

const TAB_ACCENT: Record<string, string> = {
  upload: "from-blue-500 to-indigo-500",
  watermark: "from-violet-500 to-purple-500",
  adjust: "from-amber-500 to-orange-500",
  metadata: "from-emerald-500 to-teal-500",
  export: "from-sky-500 to-cyan-500",
  tips: "from-rose-500 to-pink-500",
};

const TAB_BG: Record<string, string> = {
  upload: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
  watermark: "bg-violet-500/10 border-violet-500/30 text-violet-300",
  adjust: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  metadata: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  export: "bg-sky-500/10 border-sky-500/30 text-sky-300",
  tips: "bg-rose-500/10 border-rose-500/30 text-rose-300",
};

const BADGE_COLORS: Record<string, string> = {
  indigo: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  green: "bg-green-500/20 text-green-300 border border-green-500/30",
  teal: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  amber: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
};

const GROUP_COLORS: Record<string, string> = {
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-200",
  coral: "bg-red-500/10 border-red-500/20 text-red-200",
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-200",
  purple: "bg-purple-500/10 border-purple-500/20 text-purple-200",
};

function StepItem({
  num,
  title,
  desc,
  preview,
  isOpen,
  onToggle,
}: {
  num: number;
  title: string;
  desc: string;
  preview?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  // Only start loading the image after first open — never unmount once loaded
  const [everOpened, setEverOpened] = useState(false);
  useEffect(() => {
    if (isOpen && !everOpened) setEverOpened(true);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
      {/* Clickable header row */}
      <button
        onClick={preview ? onToggle : undefined}
        className={`w-full flex gap-3 items-start px-3 py-3 text-left transition-colors ${
          preview
            ? "cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06]"
            : "cursor-default"
        } ${isOpen ? "bg-white/[0.04]" : ""}`}
      >
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium mt-0.5 transition-colors ${
            isOpen
              ? "bg-white/20 border border-white/30 text-white/90"
              : "bg-white/5 border border-white/10 text-white/40"
          }`}
        >
          {num}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium mb-0.5 transition-colors ${
              isOpen ? "text-white" : "text-white/90"
            }`}
          >
            {title}
          </p>
          <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
        </div>
        {preview && (
          <div className="flex-shrink-0 mt-1">
            <span
              className={`text-white/30 text-xs transition-transform duration-200 inline-block ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </div>
        )}
      </button>

      {/* Drawer — stays mounted after first open so img never reloads */}
      {preview && (
        <div
          className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
          style={{
            maxHeight: isOpen ? "320px" : "0px",
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div className="px-3 pb-3">
            <div className="rounded-lg overflow-hidden border border-white/[0.07] bg-black/30">
              {everOpened ? (
                <img
                  src={preview}
                  alt={title}
                  className="w-full object-cover block"
                  style={{ maxHeight: "260px" }}
                  onError={(e) => {
                    const t = e.currentTarget;
                    t.style.display = "none";
                    const sib = t.nextElementSibling as HTMLElement | null;
                    if (sib) sib.style.display = "flex";
                  }}
                />
              ) : null}
              {/* Fallback placeholder (shown on load error, or before first open) */}
              <div
                className="items-center justify-center py-8 gap-2 flex-col"
                style={{ display: everOpened ? "none" : "flex" }}
              >
                <span className="text-2xl opacity-30">🎬</span>
                <p className="text-[11px] text-white/25 text-center px-4">
                  Preview GIF coming soon
                  <br />
                  <span className="text-white/15 text-[10px] font-mono break-all">
                    {preview}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 items-start p-3 rounded-lg bg-white/[0.04] border border-white/[0.08] mt-4">
      <span className="text-yellow-400 text-sm flex-shrink-0 mt-0.5">💡</span>
      <p className="text-xs text-white/60 leading-relaxed">{text}</p>
    </div>
  );
}

function TabContent({ tab }: { tab: AnyTab }) {
  const [openStep, setOpenStep] = useState<number | null>(null);

  // Reset open step when tab changes
  useEffect(() => {
    setOpenStep(null);
  }, [tab.id]);

  const handleToggle = (num: number) => {
    setOpenStep((prev) => (prev === num ? null : num));
  };

  return (
    <div className="space-y-2 animate-[fadeSlideIn_0.2s_ease_both]">
      {/* Steps */}
      {hasSteps(tab) && tab.steps.length > 0 && (
        <div className="space-y-2">
          {tab.steps.map((s) => (
            <StepItem
              key={s.num}
              num={s.num}
              title={s.title}
              desc={s.desc}
              preview={s.preview}
              isOpen={openStep === s.num}
              onToggle={() => handleToggle(s.num)}
            />
          ))}
          <p className="text-[10px] text-white/20 text-center pt-1 select-none">
            Tap a step to see a preview
          </p>
        </div>
      )}

      {/* Cards grid (watermark) */}
      {hasCards(tab) && (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
            Logo controls
          </p>
          <div className="grid grid-cols-2 gap-2">
            {tab.cards.map((c) => (
              <div
                key={c.title}
                className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
              >
                <p className="text-xs font-medium text-white/80 mb-0.5">
                  {c.title}
                </p>
                <p className="text-[11px] text-white/40 leading-snug">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adjustment groups */}
      {hasGroups(tab) && (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
            Adjustment groups
          </p>
          {tab.groups.map((g) => (
            <div
              key={g.label}
              className={`flex gap-3 items-start p-2.5 rounded-lg border ${GROUP_COLORS[g.color]}`}
            >
              <span className="text-sm flex-shrink-0">{g.icon}</span>
              <div>
                <p className="text-xs font-medium mb-0.5">{g.label}</p>
                <p className="text-[11px] opacity-60 leading-snug">{g.items}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Format cards */}
      {hasFormats(tab) && (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
            Format comparison
          </p>
          <div className="grid grid-cols-2 gap-2">
            {tab.formats.map((f) => (
              <div
                key={f.badge}
                className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
              >
                <span
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5 ${BADGE_COLORS[f.color]}`}
                >
                  {f.badge}
                </span>
                <p className="text-[11px] text-white/40 leading-snug">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shortcuts + tips */}
      {hasShortcuts(tab) && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
              Keyboard shortcuts
            </p>
            <div className="rounded-lg border border-white/[0.07] overflow-hidden">
              {tab.shortcuts.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex items-center justify-between px-3 py-2 text-xs ${i !== tab.shortcuts.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                >
                  <span className="text-white/60">{s.label}</span>
                  <div className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] font-mono text-[11px] text-white/50"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
              Pro tips
            </p>
            <div className="space-y-2">
              {tab.tips.map((t) => (
                <div
                  key={t.title}
                  className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <p className="text-xs font-medium text-white/80 mb-0.5">
                    {t.title}
                  </p>
                  <p className="text-[11px] text-white/40 leading-snug">
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tip banner */}
      {tab.tip && <Tip text={tab.tip} />}
    </div>
  );
}

const HowtoUseModal = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const currentTab: AnyTab =
    (HOW_TO_USE_DATA.tabs as AnyTab[]).find((t) => t.id === activeTab) ??
    HOW_TO_USE_DATA.tabs[0];
  const accent = TAB_ACCENT[activeTab] ?? "from-blue-500 to-indigo-500";
  const tabBg = TAB_BG[activeTab] ?? TAB_BG.upload;

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex gap-2 w-full items-center bg-blue-600/20 hover:bg-blue-600/30 transition-colors p-2 rounded-md border border-blue-700/50 cursor-pointer"
      >
        <div className="relative w-6 h-6">
          <div className="absolute h-6 w-6 rounded-full bg-blue-500/30 items-center justify-center flex animate-pulse" />
          <div className="absolute h-4 w-4 rounded-full bg-blue-500 items-center justify-center flex text-xs left-1 top-1 text-white font-semibold">
            i
          </div>
        </div>
        <label className="font-light cursor-pointer">
          How to use Watermark{" "}
        </label>
      </button>

      {/* Backdrop + Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-[#0d0d14] border border-white/[0.08]"
            style={{
              animation: "modalIn 0.25s cubic-bezier(0.32,0.72,0,1) both",
            }}
          >
            {/* Gradient header bar */}
            <div
              className={`h-0.5 w-full bg-gradient-to-r ${accent} flex-shrink-0`}
            />

            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-white flex gap-1">
                  {" "}
                  <div className=" h-5 w-5 rounded-full bg-blue-500 items-center justify-center flex text-xs text-white font-semibold">
                    i
                  </div>
                  How to use
                </h2>
                <p className="text-xs text-white/40 mt-0.5 italic uppercase tracking-wide">
                  {HOW_TO_USE_DATA.title}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.1] transition-all flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 px-4 py-3 border-b border-white/[0.06] overflow-x-auto flex-shrink-0 scrollbar-none">
              {HOW_TO_USE_DATA.tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 border ${
                      isActive
                        ? `${TAB_BG[tab.id]}`
                        : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="text-[13px] leading-none">{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              <TabContent tab={currentTab} />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between flex-shrink-0">
              {HOW_TO_USE_DATA.tabs.findIndex((t) => t.id === activeTab) >
                0 && (
                <button
                  onClick={() => {
                    const idx = HOW_TO_USE_DATA.tabs.findIndex(
                      (t) => t.id === activeTab,
                    );
                    const next = HOW_TO_USE_DATA.tabs[idx - 1];
                    if (next) setActiveTab(next.id);
                    else setOpen(false);
                  }}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${tabBg}`}
                >
                  ← Back
                </button>
              )}

              <div className="flex relative gap-1.5">
                {HOW_TO_USE_DATA.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`h-1 rounded-full transition-all ${
                      tab.id === activeTab
                        ? `w-4 bg-gradient-to-r ${TAB_ACCENT[tab.id]}`
                        : "w-1 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
                <span className="absolute top-1 left-5 text-[10px] text-white/20">
                  {HOW_TO_USE_DATA.tabs.findIndex((t) => t.id === activeTab) +
                    1}{" "}
                  / {HOW_TO_USE_DATA.tabs.length}
                </span>
              </div>

              <button
                onClick={() => {
                  const idx = HOW_TO_USE_DATA.tabs.findIndex(
                    (t) => t.id === activeTab,
                  );
                  const next = HOW_TO_USE_DATA.tabs[idx + 1];
                  if (next) setActiveTab(next.id);
                  else setOpen(false);
                }}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${tabBg}`}
              >
                {HOW_TO_USE_DATA.tabs.findIndex((t) => t.id === activeTab) ===
                HOW_TO_USE_DATA.tabs.length - 1
                  ? "Done"
                  : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default HowtoUseModal;
