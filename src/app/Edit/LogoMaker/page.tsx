"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Download, Type, Layers, ZoomIn, ZoomOut,
    Undo, Redo, Trash2, Copy, AlignLeft, AlignCenter,
    AlignRight, Bold, Italic, Circle, Square, Star,
    Heart, Triangle, Lock, Unlock, Upload, Settings, X,
} from "lucide-react";
import { IoLogoBuffer } from "react-icons/io";

/* ════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════ */
interface Element {
    id: string; type: "text" | "shape" | "image";
    content: string; x: number; y: number;
    width: number; height: number;
    fontSize?: number; fontWeight?: string; fontStyle?: string;
    textAlign?: string; color: string; rotation: number;
    locked: boolean; zIndex: number; imageData?: string;
}

/* ════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════ */
const SHAPES = [
    { name: "Circle", icon: Circle },
    { name: "Square", icon: Square },
    { name: "Star", icon: Star },
    { name: "Heart", icon: Heart },
    { name: "Triangle", icon: Triangle },
];

const COLORS = [
    "#000000", "#FFFFFF", "#EF4444", "#F59E0B",
    "#10B981", "#3B82F6", "#8B5CF6", "#EC4899",
    "#6366F1", "#14B8A6", "#F97316", "#84CC16",
];

const PRESETS = [
    { name: "Square 1:1", width: 800, height: 800 },
    { name: "Logo 4:3", width: 800, height: 600 },
    { name: "Wide 16:9", width: 1600, height: 900 },
    { name: "Instagram Post", width: 1080, height: 1080 },
    { name: "Facebook Cover", width: 1640, height: 924 },
    { name: "Custom", width: 800, height: 600 },
];

/* ════════════════════════════════════════════
   SMALL REUSABLE PIECES
   ════════════════════════════════════════════ */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-gray-400 dark:text-white/25 mb-2">
        {children}
    </p>
);

const ColorSwatch = ({
    color, active, onClick,
}: { color: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-7 h-7 rounded-lg border-2 transition-all ${active ? "border-indigo-500 scale-110" : "border-transparent hover:scale-105"
            }`}
        style={{ backgroundColor: color }}
    />
);

const ToolBtn = ({
    onClick, disabled, active, title, children,
}: {
    onClick?: () => void; disabled?: boolean;
    active?: boolean; title?: string; children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-1.5 rounded-md text-sm transition-colors
      disabled:opacity-30 disabled:cursor-not-allowed
      ${active
                ? "bg-indigo-500/15 text-indigo-500 dark:text-indigo-400"
                : "text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-white/70"
            }`}
    >
        {children}
    </button>
);

/* ════════════════════════════════════════════
   CANVAS DRAW HELPERS
   ════════════════════════════════════════════ */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outer);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer); rot += step;
        ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner); rot += step;
    }
    ctx.lineTo(cx, cy - outer);
    ctx.closePath();
}
function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
    const s = w / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s / 4);
    ctx.bezierCurveTo(cx, cy, cx - s / 2, cy - s / 2, cx - s, cy);
    ctx.bezierCurveTo(cx - s * 1.3, cy + s / 2, cx - s / 2, cy + s, cx, cy + s * 1.3);
    ctx.bezierCurveTo(cx + s / 2, cy + s, cx + s * 1.3, cy + s / 2, cx + s, cy);
    ctx.bezierCurveTo(cx + s / 2, cy - s / 2, cx, cy, cx, cy + s / 4);
    ctx.closePath();
}
function drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function LogoMaker() {
    const [elements, setElements] = useState<Element[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [canvasColor, setCanvasColor] = useState("#FFFFFF");
    const [transparentBg, setTransparentBg] = useState(false);
    const [canvasW, setCanvasW] = useState(800);
    const [canvasH, setCanvasH] = useState(600);
    const [showCanvasSettings, setShowCanvasSettings] = useState(false);
    const [customW, setCustomW] = useState(800);
    const [customH, setCustomH] = useState(600);
    const [zoom, setZoom] = useState(100);
    const [history, setHistory] = useState<Element[][]>([]);
    const [historyStep, setHistoryStep] = useState(-1);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ── History ── */
    const pushHistory = (els: Element[]) => {
        const next = history.slice(0, historyStep + 1);
        next.push(JSON.parse(JSON.stringify(els)));
        setHistory(next);
        setHistoryStep(next.length - 1);
    };

    /* ── Elements ── */
    const addText = () => {
        const el: Element = {
            id: `text-${Date.now()}`, type: "text",
            content: "Double click to edit",
            x: canvasW / 2 - 100, y: canvasH / 2 - 25,
            width: 200, height: 50, fontSize: 32,
            fontWeight: "bold", fontStyle: "normal",
            textAlign: "center", color: "#000000",
            rotation: 0, locked: false, zIndex: elements.length,
        };
        const next = [...elements, el];
        setElements(next); pushHistory(next); setSelected(el.id);
    };

    const addShape = (name: string) => {
        const el: Element = {
            id: `shape-${Date.now()}`, type: "shape", content: name,
            x: canvasW / 2 - 50, y: canvasH / 2 - 50,
            width: 100, height: 100, color: "#8B5CF6",
            rotation: 0, locked: false, zIndex: elements.length,
        };
        const next = [...elements, el];
        setElements(next); pushHistory(next); setSelected(el.id);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const max = 400;
                let w = img.width, h = img.height;
                if (w > max || h > max) {
                    if (w > h) { h = (h / w) * max; w = max; }
                    else { w = (w / h) * max; h = max; }
                }
                const el: Element = {
                    id: `image-${Date.now()}`, type: "image", content: "Image",
                    x: canvasW / 2 - w / 2, y: canvasH / 2 - h / 2,
                    width: w, height: h, color: "#000000",
                    rotation: 0, locked: false, zIndex: elements.length,
                    imageData: ev.target?.result as string,
                };
                const next = [...elements, el];
                setElements(next); pushHistory(next); setSelected(el.id);
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const updateEl = (id: string, patch: Partial<Element>) => {
        setElements((prev) => prev.map((el) => el.id === id ? { ...el, ...patch } : el));
    };

    const deleteEl = () => {
        if (!selected) return;
        const next = elements.filter((el) => el.id !== selected);
        setElements(next); pushHistory(next); setSelected(null);
    };

    const duplicateEl = () => {
        if (!selected) return;
        const src = elements.find((el) => el.id === selected);
        if (!src) return;
        const el = { ...src, id: `${src.type}-${Date.now()}`, x: src.x + 20, y: src.y + 20, zIndex: elements.length };
        const next = [...elements, el];
        setElements(next); pushHistory(next); setSelected(el.id);
    };

    const undo = () => {
        if (historyStep <= 0) return;
        setHistoryStep(historyStep - 1);
        setElements(JSON.parse(JSON.stringify(history[historyStep - 1])));
    };

    const redo = () => {
        if (historyStep >= history.length - 1) return;
        setHistoryStep(historyStep + 1);
        setElements(JSON.parse(JSON.stringify(history[historyStep + 1])));
    };

    /* ── Drag / resize ── */
    const onMouseDown = (e: React.MouseEvent, id: string) => {
        const el = elements.find((el) => el.id === id);
        if (el?.locked) return;
        setSelected(id); setIsDragging(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) setDragOffset({ x: e.clientX - rect.left - el!.x, y: e.clientY - rect.top - el!.y });
    };

    const onResizeStart = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const el = elements.find((el) => el.id === id);
        if (el?.locked) return;
        setSelected(id); setIsResizing(true);
        setResizeStart({ x: e.clientX, y: e.clientY, w: el!.width, h: el!.height });
    };

    const onMouseMove = (e: React.MouseEvent) => {
        const scale = zoom / 100;
        if (isDragging && selected && !isResizing) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) updateEl(selected, {
                x: (e.clientX - rect.left) / scale - dragOffset.x / scale,
                y: (e.clientY - rect.top) / scale - dragOffset.y / scale,
            });
        } else if (isResizing && selected) {
            updateEl(selected, {
                width: Math.max(20, resizeStart.w + (e.clientX - resizeStart.x) / scale),
                height: Math.max(20, resizeStart.h + (e.clientY - resizeStart.y) / scale),
            });
        }
    };

    const onMouseUp = () => {
        if ((isDragging || isResizing) && selected) pushHistory(elements);
        setIsDragging(false); setIsResizing(false);
    };

    /* ── Zoom via scroll ── */
    const handleZoom = useCallback((delta: number) => {
        setZoom((z) => Math.min(200, Math.max(25, z + (delta < 0 ? 25 : -25))));
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) { e.preventDefault(); handleZoom(e.deltaY); }
        };
        el.addEventListener("wheel", handler);
        return () => el.removeEventListener("wheel", handler);
    }, [handleZoom]);

    /* ── Export ── */
    const downloadCanvas = async (withBg: boolean) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const scale = 2;
        canvas.width = canvasW * scale;
        canvas.height = canvasH * scale;
        if (!ctx) return;
        ctx.scale(scale, scale);
        if (withBg && !transparentBg) {
            ctx.fillStyle = canvasColor;
            ctx.fillRect(0, 0, canvasW, canvasH);
        }
        const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
        for (const el of sorted) {
            ctx.save();
            ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
            ctx.rotate((el.rotation * Math.PI) / 180);
            ctx.translate(-(el.x + el.width / 2), -(el.y + el.height / 2));
            if (el.type === "text") {
                ctx.fillStyle = el.color;
                ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px DM Sans, sans-serif`;
                ctx.textAlign = (el.textAlign as CanvasTextAlign) || "center";
                ctx.textBaseline = "middle";
                ctx.fillText(el.content, el.x + el.width / 2, el.y + el.height / 2);
            } else if (el.type === "shape") {
                ctx.fillStyle = el.color;
                const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
                const r = Math.min(el.width, el.height) / 2;
                ctx.beginPath();
                if (el.content === "Circle") ctx.arc(cx, cy, r, 0, Math.PI * 2);
                else if (el.content === "Square") ctx.rect(el.x, el.y, el.width, el.height);
                else if (el.content === "Star") drawStar(ctx, cx, cy, 5, r, r / 2);
                else if (el.content === "Heart") drawHeart(ctx, cx, cy, el.width);
                else if (el.content === "Triangle") drawTriangle(ctx, el.x, el.y, el.width, el.height);
                ctx.fill();
            } else if (el.type === "image" && el.imageData) {
                const img = new Image();
                await new Promise<void>((res) => { img.onload = () => res(); img.src = el.imageData!; });
                ctx.drawImage(img, el.x, el.y, el.width, el.height);
            }
            ctx.restore();
        }
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `logo-${withBg ? "with-bg" : "no-bg"}.png`; a.click();
            URL.revokeObjectURL(url);
        });
    };

    const selectedEl = elements.find((el) => el.id === selected);

    /* ════════════════════════════════════════════
       RENDER
       ════════════════════════════════════════════ */
    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 dark:bg-[#0f0e17]">

            {/* ── Top toolbar ── */}
            <div className="flex items-center justify-between px-4 h-14 shrink-0
        bg-white dark:bg-[#0f0e17]
        border-b border-black/[0.06] dark:border-white/[0.06]">

                {/* Left */}

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-white/80">

                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                            <IoLogoBuffer className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h1 className="font-syne text-lg font-extrabold tracking-tight text-slate-800 dark:text-transparent dark:bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(90deg,#f9fafb,#9ca3af)' }}>Logo Maker</h1>
                    </div>

                    <div className="w-px h-4 bg-black/10 dark:bg-white/10" />
                    <div className="flex items-center gap-0.5">
                        <ToolBtn onClick={undo} disabled={historyStep <= 0} title="Undo"><Undo className="w-3.5 h-3.5" /></ToolBtn>
                        <ToolBtn onClick={redo} disabled={historyStep >= history.length - 1} title="Redo"><Redo className="w-3.5 h-3.5" /></ToolBtn>
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2">
                    {/* Canvas size */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCanvasSettings((v) => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                border border-black/[0.08] dark:border-white/[0.08]
                text-gray-500 dark:text-white/40
                hover:bg-gray-100 dark:hover:bg-white/[0.05]
                transition-colors"
                        >
                            <Settings className="w-3 h-3" />
                            {canvasW} × {canvasH}
                        </button>

                        {showCanvasSettings && (
                            <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl
                bg-white dark:bg-[#16151f]
                border border-black/[0.08] dark:border-white/[0.08]
                shadow-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-medium text-gray-600 dark:text-white/50">Canvas size</p>
                                    <button onClick={() => setShowCanvasSettings(false)}
                                        className="text-gray-300 dark:text-white/20 hover:text-gray-500 dark:hover:text-white/50">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="space-y-1 mb-3">
                                    {PRESETS.map((p) => (
                                        <button key={p.name}
                                            onClick={() => { if (p.name !== "Custom") { setCanvasW(p.width); setCanvasH(p.height); } setShowCanvasSettings(false); }}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs
                        hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                                            <span className="text-gray-700 dark:text-white/60">{p.name}</span>
                                            <span className="text-gray-400 dark:text-white/25 font-mono">{p.width} × {p.height}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-3 space-y-2">
                                    <div className="flex gap-2">
                                        <input type="number" value={customW} onChange={(e) => setCustomW(+e.target.value)}
                                            placeholder="Width"
                                            className="flex-1 px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08]
                        bg-gray-50 dark:bg-white/[0.04] text-xs text-gray-700 dark:text-white/60
                        focus:outline-none focus:border-indigo-400" />
                                        <input type="number" value={customH} onChange={(e) => setCustomH(+e.target.value)}
                                            placeholder="Height"
                                            className="flex-1 px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08]
                        bg-gray-50 dark:bg-white/[0.04] text-xs text-gray-700 dark:text-white/60
                        focus:outline-none focus:border-indigo-400" />
                                    </div>
                                    <button
                                        onClick={() => { setCanvasW(customW); setCanvasH(customH); setShowCanvasSettings(false); }}
                                        className="w-full py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-colors">
                                        Apply custom size
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg
            border border-black/[0.08] dark:border-white/[0.08]">
                        <ToolBtn onClick={() => handleZoom(1)}><ZoomOut className="w-3.5 h-3.5" /></ToolBtn>
                        <span className="text-xs font-mono font-medium w-10 text-center text-gray-600 dark:text-white/50">{zoom}%</span>
                        <ToolBtn onClick={() => handleZoom(-1)}><ZoomIn className="w-3.5 h-3.5" /></ToolBtn>
                    </div>

                    {/* Download */}
                    <button onClick={() => downloadCanvas(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-indigo-500 hover:bg-indigo-600 text-white transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Download
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left sidebar ── */}
                <div className="w-52 shrink-0 flex flex-col overflow-y-auto
          bg-white dark:bg-[#0f0e17]
          border-r border-black/[0.06] dark:border-white/[0.06]">
                    <div className="p-4 space-y-5">

                        {/* Add elements */}
                        <div>
                            <SectionLabel>Add elements</SectionLabel>
                            <div className="space-y-1.5">
                                <button onClick={addText}
                                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm
                    bg-gray-50 dark:bg-white/[0.03] hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10
                    text-gray-600 dark:text-white/50 hover:text-indigo-600 dark:hover:text-indigo-400
                    border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/20
                    transition-all">
                                    <Type className="w-4 h-4" /> Add Text
                                </button>
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm
                    bg-gray-50 dark:bg-white/[0.03] hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10
                    text-gray-600 dark:text-white/50 hover:text-indigo-600 dark:hover:text-indigo-400
                    border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/20
                    transition-all">
                                    <Upload className="w-4 h-4" /> Upload Image
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </div>

                            {/* Shapes */}
                            <div className="mt-3">
                                <SectionLabel>Shapes</SectionLabel>
                                <div className="grid grid-cols-5 gap-1">
                                    {SHAPES.map(({ name, icon: Icon }) => (
                                        <button key={name} onClick={() => addShape(name)} title={name}
                                            className="flex items-center justify-center p-2 rounded-lg
                        bg-gray-50 dark:bg-white/[0.03]
                        hover:bg-indigo-500/10 hover:text-indigo-500 dark:hover:text-indigo-400
                        text-gray-500 dark:text-white/35
                        transition-colors">
                                            <Icon className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Canvas background */}
                        <div>
                            <SectionLabel>Canvas</SectionLabel>
                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input type="checkbox" checked={transparentBg} onChange={(e) => setTransparentBg(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded accent-indigo-500" />
                                <span className="text-xs text-gray-600 dark:text-white/45">Transparent background</span>
                            </label>
                            {!transparentBg && (
                                <div className="grid grid-cols-6 gap-1.5 mt-2">
                                    {COLORS.map((c) => (
                                        <ColorSwatch key={c} color={c} active={canvasColor === c} onClick={() => setCanvasColor(c)} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Layers */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <Layers className="w-3.5 h-3.5 text-gray-400 dark:text-white/25" />
                                <SectionLabel>Layers</SectionLabel>
                            </div>
                            <div className="space-y-1">
                                {[...elements].sort((a, b) => b.zIndex - a.zIndex).map((el) => (
                                    <button key={el.id} onClick={() => setSelected(el.id)}
                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors
                      ${selected === el.id
                                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25"
                                                : "bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                                            }`}>
                                        <span className="truncate max-w-[110px]">
                                            {el.type === "image" ? "Image" : el.content}
                                        </span>
                                        <button onClick={(e) => { e.stopPropagation(); updateEl(el.id, { locked: !el.locked }); }}
                                            className="text-gray-300 dark:text-white/20 hover:text-gray-500 dark:hover:text-white/50 ml-1">
                                            {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </button>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Canvas container ── */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto flex items-center justify-center
            bg-[#f1f1f7] dark:bg-[#0d0d1a]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px)," +
                            "linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)",
                        backgroundSize: "20px 20px",
                    }}
                >
                    <div
                        ref={canvasRef}
                        className="relative shadow-2xl"
                        style={{
                            width: canvasW, height: canvasH,
                            backgroundColor: transparentBg ? "transparent" : canvasColor,
                            backgroundImage: transparentBg
                                ? "linear-gradient(45deg,#e5e5e5 25%,transparent 25%,transparent 75%,#e5e5e5 75%)," +
                                "linear-gradient(45deg,#e5e5e5 25%,transparent 25%,transparent 75%,#e5e5e5 75%)"
                                : "none",
                            backgroundSize: "20px 20px",
                            backgroundPosition: "0 0, 10px 10px",
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: "center",
                        }}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseUp}
                        onClick={() => setSelected(null)}
                    >
                        {elements.map((el) => {
                            const ShapeIcon = SHAPES.find((s) => s.name === el.content)?.icon;
                            return (
                                <div
                                    key={el.id}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute cursor-move group ${selected === el.id ? "ring-2 ring-indigo-500 ring-offset-0" : ""}`}
                                    style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`, zIndex: el.zIndex }}
                                    onMouseDown={(e) => onMouseDown(e, el.id)}
                                >
                                    {el.type === "text" ? (
                                        <div
                                            contentEditable={selected === el.id && !el.locked}
                                            suppressContentEditableWarning
                                            onBlur={(e) => { updateEl(el.id, { content: e.currentTarget.textContent || "" }); pushHistory(elements); }}
                                            className="w-full h-full flex items-center justify-center outline-none whitespace-pre-wrap break-words"
                                            style={{
                                                fontSize: el.fontSize, fontWeight: el.fontWeight,
                                                fontStyle: el.fontStyle, textAlign: el.textAlign as any,
                                                color: el.color, userSelect: isDragging ? "none" : "auto",
                                            }}
                                        >
                                            {el.content}
                                        </div>
                                    ) : el.type === "image" && el.imageData ? (
                                        <img src={el.imageData} alt="Uploaded" className="w-full h-full object-contain pointer-events-none" />
                                    ) : ShapeIcon ? (
                                        <ShapeIcon className="w-full h-full pointer-events-none" style={{ color: el.color }} />
                                    ) : null}

                                    {selected === el.id && !el.locked && (
                                        <div
                                            className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-indigo-500 cursor-se-resize shadow-md"
                                            onMouseDown={(e) => onResizeStart(e, el.id)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Right properties panel ── */}
                {selectedEl && (
                    <div className="w-60 shrink-0 overflow-y-auto
            bg-white dark:bg-[#0f0e17]
            border-l border-black/[0.06] dark:border-white/[0.06]">
                        <div className="p-4 space-y-5">

                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-gray-600 dark:text-white/50">Properties</p>
                                <div className="flex gap-0.5">
                                    <ToolBtn onClick={duplicateEl} title="Duplicate"><Copy className="w-3.5 h-3.5" /></ToolBtn>
                                    <ToolBtn onClick={deleteEl} title="Delete">
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </ToolBtn>
                                </div>
                            </div>

                            {/* Color */}
                            <div>
                                <SectionLabel>Color</SectionLabel>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {COLORS.map((c) => (
                                        <ColorSwatch key={c} color={c} active={selectedEl.color === c}
                                            onClick={() => { updateEl(selectedEl.id, { color: c }); pushHistory(elements); }} />
                                    ))}
                                </div>
                            </div>

                            {/* Text props */}
                            {selectedEl.type === "text" && (
                                <>
                                    <div>
                                        <SectionLabel>Font size — {selectedEl.fontSize}px</SectionLabel>
                                        <input type="range" min={12} max={120} value={selectedEl.fontSize}
                                            onChange={(e) => updateEl(selectedEl.id, { fontSize: +e.target.value })}
                                            onMouseUp={() => pushHistory(elements)}
                                            className="w-full accent-indigo-500" />
                                    </div>
                                    <div>
                                        <SectionLabel>Style</SectionLabel>
                                        <div className="flex gap-1.5">
                                            <ToolBtn active={selectedEl.fontWeight === "bold"}
                                                onClick={() => { updateEl(selectedEl.id, { fontWeight: selectedEl.fontWeight === "bold" ? "normal" : "bold" }); pushHistory(elements); }}>
                                                <Bold className="w-3.5 h-3.5" />
                                            </ToolBtn>
                                            <ToolBtn active={selectedEl.fontStyle === "italic"}
                                                onClick={() => { updateEl(selectedEl.id, { fontStyle: selectedEl.fontStyle === "italic" ? "normal" : "italic" }); pushHistory(elements); }}>
                                                <Italic className="w-3.5 h-3.5" />
                                            </ToolBtn>
                                        </div>
                                    </div>
                                    <div>
                                        <SectionLabel>Alignment</SectionLabel>
                                        <div className="flex gap-1.5">
                                            {(["left", "center", "right"] as const).map((a) => (
                                                <ToolBtn key={a} active={selectedEl.textAlign === a}
                                                    onClick={() => { updateEl(selectedEl.id, { textAlign: a }); pushHistory(elements); }}>
                                                    {a === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                                                    {a === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                                                    {a === "right" && <AlignRight className="w-3.5 h-3.5" />}
                                                </ToolBtn>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Size */}
                            <div>
                                <SectionLabel>Size — {Math.round(selectedEl.width)} × {Math.round(selectedEl.height)}</SectionLabel>
                                <div className="space-y-2">
                                    {(["width", "height"] as const).map((k) => (
                                        <div key={k}>
                                            <p className="text-[10px] text-gray-400 dark:text-white/25 mb-1 capitalize">{k}</p>
                                            <input type="range" min={20} max={k === "width" ? canvasW : canvasH} value={selectedEl[k]}
                                                onChange={(e) => updateEl(selectedEl.id, { [k]: +e.target.value })}
                                                onMouseUp={() => pushHistory(elements)}
                                                className="w-full accent-indigo-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rotation */}
                            <div>
                                <SectionLabel>Rotation — {selectedEl.rotation}°</SectionLabel>
                                <input type="range" min={0} max={360} value={selectedEl.rotation}
                                    onChange={(e) => updateEl(selectedEl.id, { rotation: +e.target.value })}
                                    onMouseUp={() => pushHistory(elements)}
                                    className="w-full accent-indigo-500" />
                            </div>

                            {/* Layer order */}
                            <div>
                                <SectionLabel>Layer order</SectionLabel>
                                <div className="flex gap-1.5">
                                    <button disabled={selectedEl.zIndex === 0}
                                        onClick={() => { updateEl(selectedEl.id, { zIndex: selectedEl.zIndex - 1 }); pushHistory(elements); }}
                                        className="flex-1 py-1.5 rounded-lg text-xs border border-black/[0.07] dark:border-white/[0.07]
                      text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.05]
                      disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                        ↓ Back
                                    </button>
                                    <button disabled={selectedEl.zIndex === elements.length - 1}
                                        onClick={() => { updateEl(selectedEl.id, { zIndex: selectedEl.zIndex + 1 }); pushHistory(elements); }}
                                        className="flex-1 py-1.5 rounded-lg text-xs border border-black/[0.07] dark:border-white/[0.07]
                      text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.05]
                      disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                        ↑ Front
                                    </button>
                                </div>
                            </div>

                            {/* Export */}
                            <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-4 space-y-2">
                                <SectionLabel>Export</SectionLabel>
                                <button onClick={() => downloadCanvas(true)}
                                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium
                    bg-indigo-500 hover:bg-indigo-600 text-white transition-colors">
                                    <Download className="w-3.5 h-3.5" /> With background
                                </button>
                                <button onClick={() => downloadCanvas(false)}
                                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium
                    bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.08]
                    border border-black/[0.08] dark:border-white/[0.08]
                    text-gray-600 dark:text-white/50 transition-colors">
                                    <Download className="w-3.5 h-3.5" /> Without background
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}