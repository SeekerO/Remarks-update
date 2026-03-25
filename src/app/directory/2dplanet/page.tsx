"use client";

import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { Building2, Globe, MapPin, Search, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import directoryData from "./directory.json";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface ProvinceProperties {
    adm2_en: string;
    area_km2: number;
    adm2_psgc: number;
}
interface DecodedFeature {
    id: number;
    properties: ProvinceProperties;
    rings: [number, number][][];
    regionLabel: string;
    color: string;
}
interface Topology {
    type: "Topology";
    arcs: [number, number][][];
    transform: { scale: [number, number]; translate: [number, number] };
    objects: Record<string, any>;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CANVAS_W = 420;
const CANVAS_H = 680;

const REGION_FILES = [
    { file: "provdists-region-1300000000.topo.0.01.json", key: "provdists-region-1300000000", label: "NCR", color: "#6366f1" },
    { file: "provdists-region-100000000.topo.0.01.json", key: "provdists-region-100000000", label: "Ilocos Region (I)", color: "#8b5cf6" },
    { file: "provdists-region-200000000.topo.0.01.json", key: "provdists-region-200000000", label: "Cagayan Valley (II)", color: "#a78bfa" },
    { file: "provdists-region-300000000.topo.0.01.json", key: "provdists-region-300000000", label: "Central Luzon (III)", color: "#818cf8" },
    { file: "provdists-region-400000000.topo.0.01.json", key: "provdists-region-400000000", label: "CALABARZON (IV-A)", color: "#7c3aed" },
    { file: "provdists-region-500000000.topo.0.01.json", key: "provdists-region-500000000", label: "Bicol Region (V)", color: "#4f46e5" },
    { file: "provdists-region-600000000.topo.0.01.json", key: "provdists-region-600000000", label: "Western Visayas (VI)", color: "#6d28d9" },
    { file: "provdists-region-700000000.topo.0.01.json", key: "provdists-region-700000000", label: "Central Visayas (VII)", color: "#5b21b6" },
    { file: "provdists-region-800000000.topo.0.01.json", key: "provdists-region-800000000", label: "Eastern Visayas (VIII)", color: "#4338ca" },
    { file: "provdists-region-900000000.topo.0.01.json", key: "provdists-region-900000000", label: "Zamboanga Peninsula (IX)", color: "#3730a3" },
    { file: "provdists-region-1000000000.topo.0.01.json", key: "provdists-region-1000000000", label: "Northern Mindanao (X)", color: "#6366f1" },
    { file: "provdists-region-1100000000.topo.0.01.json", key: "provdists-region-1100000000", label: "Davao Region (XI)", color: "#818cf8" },
    { file: "provdists-region-1200000000.topo.0.01.json", key: "provdists-region-1200000000", label: "SOCCSKSARGEN (XII)", color: "#a5b4fc" },
    { file: "provdists-region-1400000000.topo.0.01.json", key: "provdists-region-1400000000", label: "CAR (XIV)", color: "#c4b5fd" },
    { file: "provdists-region-1600000000.topo.0.01.json", key: "provdists-region-1600000000", label: "Caraga (XIII)", color: "#7c3aed" },
    { file: "provdists-region-1700000000.topo.0.01.json", key: "provdists-region-1700000000", label: "MIMAROPA (IV-B)", color: "#8b5cf6" },
    { file: "provdists-region-1900000000.topo.0.01.json", key: "provdists-region-1900000000", label: "BARMM", color: "#6d28d9" },
];

const REGION_LABEL_TO_DIRECTORY_KEY: Record<string, string> = {
    "NCR": "ncr",
    "Ilocos Region (I)": "region1",
    "Cagayan Valley (II)": "region2",
    "Central Luzon (III)": "region3",
    "CALABARZON (IV-A)": "region4a",
    "MIMAROPA (IV-B)": "region4b",
    "Bicol Region (V)": "region5",
    "Western Visayas (VI)": "region6",
    "Central Visayas (VII)": "region7",
    "Eastern Visayas (VIII)": "region8",
    "Zamboanga Peninsula (IX)": "region9",
    "Northern Mindanao (X)": "region10",
    "Davao Region (XI)": "region11",
    "SOCCSKSARGEN (XII)": "region12",
    "Caraga (XIII)": "caraga",
    "CAR (XIV)": "car",
    "BARMM": "barmm",
};

const DIRECTORY_KEY_TO_REGION_LABEL: Record<string, string> = Object.fromEntries(
    Object.entries(REGION_LABEL_TO_DIRECTORY_KEY).map(([label, key]) => [key.toLowerCase(), label])
);

// ─── UTILS ────────────────────────────────────────────────────────────────────
function decodeTopology(topo: Topology, objectKey: string): Omit<DecodedFeature, "regionLabel" | "color">[] {
    const { arcs: topoArcs, transform: { scale, translate } } = topo;
    const decodedArcs = topoArcs.map(arc => {
        let x = 0, y = 0;
        return arc.map(([dx, dy]): [number, number] => {
            x += dx; y += dy;
            return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
        });
    });
    const stitch = (indices: number[]): [number, number][] => {
        const ring: [number, number][] = [];
        indices.forEach(i => {
            const arc = i < 0 ? [...decodedArcs[~i]].reverse() : decodedArcs[i];
            ring.push(...(ring.length ? arc.slice(1) : arc));
        });
        return ring;
    };
    const geoObj = topo.objects[objectKey];
    if (!geoObj) return [];
    return geoObj.geometries.map((geom: any) => ({
        id: geom.id,
        properties: geom.properties,
        rings: geom.type === "Polygon"
            ? geom.arcs.map((g: number[]) => stitch(g))
            : geom.arcs.flatMap((p: number[][]) => p.map(g => stitch(g)))
    }));
}

function pointInPolygon(px: number, py: number, ring: [number, number][]) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
}

// ─── QUICK LINK ───────────────────────────────────────────────────────────────
function QuickLink({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl
        bg-white/[0.03] border border-white/[0.06]
        hover:border-indigo-500/40 hover:bg-indigo-500/[0.06]
        transition-all duration-150 group no-underline"
        >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0
        group-hover:bg-indigo-500/20 transition-colors">
                <span className="text-indigo-400">{icon}</span>
            </div>
            <span className="text-sm font-medium text-white/60 group-hover:text-white/80 transition-colors">{label}</span>
            <svg className="w-3.5 h-3.5 text-white/20 group-hover:text-indigo-400 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        </a>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PhilippineMap() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const zoomAnimRef = useRef<number | null>(null);
    const [allFeatures, setAllFeatures] = useState<DecodedFeature[]>([]);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{ data: DecodedFeature; x: number; y: number } | null>(null);
    const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const dragAnimRef = useRef<number | null>(null);
    const pendingDragDelta = useRef({ dx: 0, dy: 0 });

    const cancelZoomAnimation = useCallback(() => {
        if (zoomAnimRef.current !== null) { cancelAnimationFrame(zoomAnimRef.current); zoomAnimRef.current = null; }
    }, []);

    const animateToTransform = useCallback((target: { x: number; y: number; scale: number }, durationMs = 650) => {
        cancelZoomAnimation();
        const from = transform;
        const start = performance.now();
        const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            const e = ease(t);
            setTransform({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, scale: from.scale + (target.scale - from.scale) * e });
            if (t < 1) { zoomAnimRef.current = requestAnimationFrame(step); } else { zoomAnimRef.current = null; }
        };
        zoomAnimRef.current = requestAnimationFrame(step);
    }, [cancelZoomAnimation, transform]);

    const handleRedirect = ({ region, city }: { region: string; city: string }) => {
        const directoryRegionKey = REGION_LABEL_TO_DIRECTORY_KEY[region] ?? region;
        const formattedRegion = directoryRegionKey.toLowerCase().replace(/\s+/g, "");
        const formattedCity = city.toLowerCase().replace(/\s+/g, "");
        const officeCaps = formattedCity === "caraga" || formattedCity === "barmm" ? "Offices" : "offices";
        const url = `https://comelec.gov.ph/?r=ContactInformation/FieldOffices/CityMunicipalOffices/${formattedRegion + officeCaps}#${formattedCity}`;
        if (region.toLowerCase() === "ncr") return window.open("https://comelec.gov.ph/?r=ContactInformation/FieldOffices/NCROffices", "_blank", "noopener,noreferrer");
        window.open(url, "_blank", "noopener,noreferrer");
    };

    useEffect(() => {
        async function init() {
            const results: DecodedFeature[] = [];
            for (const reg of REGION_FILES) {
                try {
                    const res = await fetch(`/PhilippineMap/topojson/regions/medres/${reg.file}`);
                    if (!res.ok) continue;
                    const data = await res.json();
                    decodeTopology(data, reg.key).forEach(f => results.push({ ...f, regionLabel: reg.label, color: reg.color }));
                } catch (e) { console.error(e); }
            }
            setAllFeatures(results);
            setLoading(false);
        }
        init();
    }, []);

    const bounds = useMemo(() => {
        if (allFeatures.length === 0) return null;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        allFeatures.forEach(f => f.rings.forEach(r => r.forEach(([x, y]) => {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        })));
        const pad = 48;
        const baseScale = Math.min((CANVAS_W - pad * 2) / (maxX - minX), (CANVAS_H - pad * 2) / (maxY - minY));
        const ox = (CANVAS_W - (maxX - minX) * baseScale) / 2;
        const oy = (CANVAS_H - (maxY - minY) * baseScale) / 2;
        return { minX, maxX, minY, maxY, baseScale, ox, oy };
    }, [allFeatures]);

    const project = useCallback((lon: number, lat: number): [number, number] => {
        if (!bounds) return [0, 0];
        const px = (lon - bounds.minX) * bounds.baseScale + bounds.ox;
        const py = (bounds.maxY - lat) * bounds.baseScale + bounds.oy;
        return [(px + transform.x) * transform.scale, (py + transform.y) * transform.scale];
    }, [bounds, transform]);

    const searchOptions = useMemo(() => {
        const offices = directoryData.contactinformation.fieldoffices[0];
        const flatList: { name: string; region: string; isRegion: boolean }[] = [];
        Object.entries(offices).forEach(([regionKey, data]: [string, any]) => {
            flatList.push({ name: regionKey.toUpperCase(), region: "REGION", isRegion: true });
            data.city.forEach((name: string) => { flatList.push({ name, region: regionKey.toUpperCase(), isRegion: false }); });
        });
        return flatList;
    }, []);

    const handleFocus = (name: string) => {
        const searchName = name.toLowerCase().trim();
        const normalize = (val: string) => val.toLowerCase().replace("city of ", "").replace("province of ", "").replace("islands", "").trim();
        const normalizedSearch = normalize(searchName);
        const mappedRegionLabel = DIRECTORY_KEY_TO_REGION_LABEL[normalizedSearch];
        const regionSearchTerm = mappedRegionLabel ? mappedRegionLabel.toLowerCase() : searchName;
        const regionalFeatures = allFeatures.filter(f => f.regionLabel.toLowerCase().includes(regionSearchTerm) || normalize(f.regionLabel).includes(regionSearchTerm));
        const specificFeature = allFeatures.find(f => {
            const featName = (f.properties?.adm2_en?.toLowerCase() || "");
            return featName === searchName || normalize(featName) === normalizedSearch || featName.includes(searchName);
        });
        const targets = regionalFeatures.length > 0 ? regionalFeatures : (specificFeature ? [specificFeature] : []);
        if (targets.length > 0 && bounds) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            targets.forEach(target => { target.rings.forEach(r => r.forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); })); });
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const px = (centerX - bounds.minX) * bounds.baseScale + bounds.ox;
            const py = (bounds.maxY - centerY) * bounds.baseScale + bounds.oy;
            const isRegionZoom = regionalFeatures.length > 1;
            const targetScale = isRegionZoom ? 2.5 : 6;
            const targetTransform = { scale: targetScale, x: (CANVAS_W / 2 / targetScale) - px, y: (CANVAS_H / 2 / targetScale) - py };
            animateToTransform(targetTransform);
            const featureForTooltip = specificFeature ?? targets[0];
            if (featureForTooltip) {
                setSelectedFeatureId(featureForTooltip.id);
                setHoveredId(featureForTooltip.id);
                const sx = (px + targetTransform.x) * targetTransform.scale;
                const sy = (py + targetTransform.y) * targetTransform.scale;
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    const clientX = rect.left + sx * (rect.width / CANVAS_W);
                    const clientY = rect.top + sy * (rect.height / CANVAS_H);
                    setTooltip({ x: clientX, y: clientY, data: featureForTooltip });
                }
            }
            setIsSearchOpen(false);
            setSearchQuery("");
        }
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        cancelZoomAnimation();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        const my = (e.clientY - rect.top) * (CANVAS_H / rect.height);
        const wx = (mx / transform.scale) - transform.x;
        const wy = (my / transform.scale) - transform.y;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const ns = Math.max(0.5, Math.min(25, transform.scale * delta));
        setTransform({ scale: ns, x: (mx / ns) - wx, y: (my / ns) - wy });
    };

    const draw = useCallback(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || allFeatures.length === 0) return;
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        // Dark background
        ctx.fillStyle = "#070710";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Draw provinces
        allFeatures.forEach(feat => {
            const isHov = feat.id === hoveredId;
            ctx.beginPath();
            feat.rings.forEach(ring => {
                ring.forEach(([lon, lat], i) => {
                    const [px, py] = project(lon, lat);
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                });
            });
            if (isHov) {
                ctx.fillStyle = "#a5b4fc";
                ctx.shadowColor = "rgba(99,102,241,0.6)";
                ctx.shadowBlur = 12;
            } else {
                ctx.fillStyle = feat.color + "cc"; // 80% opacity
                ctx.shadowBlur = 0;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(13,13,26,0.8)";
            ctx.lineWidth = 0.4 / transform.scale;
            ctx.stroke();
        });

        // Regional borders
        const regions = Array.from(new Set(allFeatures.map(f => f.regionLabel)));
        regions.forEach(reg => {
            ctx.beginPath();
            allFeatures.filter(f => f.regionLabel === reg).forEach(feat => {
                feat.rings.forEach(ring => {
                    ring.forEach(([lon, lat], i) => {
                        const [px, py] = project(lon, lat);
                        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    });
                });
            });
            ctx.strokeStyle = "rgba(99,102,241,0.25)";
            ctx.lineWidth = 1 / transform.scale;
            ctx.stroke();
        });
    }, [allFeatures, hoveredId, project, transform.scale]);

    useEffect(() => { draw(); }, [draw]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        const my = (e.clientY - rect.top) * (CANVAS_H / rect.height);
        const hit = allFeatures.find(f => f.rings.some(r => pointInPolygon(mx, my, r.map(p => project(p[0], p[1])) as [number, number][])));
        if (hit) { setSelectedFeatureId(hit.id); setHoveredId(hit.id); setTooltip({ x: e.clientX, y: e.clientY, data: hit }); }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging.current) {
            const dx = e.clientX - lastPos.current.x;
            const dy = e.clientY - lastPos.current.y;
            lastPos.current = { x: e.clientX, y: e.clientY };
            pendingDragDelta.current = { dx: pendingDragDelta.current.dx + dx, dy: pendingDragDelta.current.dy + dy };
            if (dragAnimRef.current === null) {
                dragAnimRef.current = requestAnimationFrame(() => {
                    const { dx: totalDx, dy: totalDy } = pendingDragDelta.current;
                    pendingDragDelta.current = { dx: 0, dy: 0 };
                    dragAnimRef.current = null;
                    setTransform(p => ({ ...p, x: p.x + totalDx / p.scale, y: p.y + totalDy / p.scale }));
                });
            }
            return;
        }
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect || selectedFeatureId !== null) return;
        const mx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        const my = (e.clientY - rect.top) * (CANVAS_H / rect.height);
        const hit = allFeatures.find(f => f.rings.some(r => pointInPolygon(mx, my, r.map(p => project(p[0], p[1])) as [number, number][])));
        setHoveredId(hit?.id || null);
        setTooltip(hit ? { x: e.clientX, y: e.clientY, data: hit } : null);
    };

    const resetView = () => {
        animateToTransform({ x: 0, y: 0, scale: 1 });
        setSelectedFeatureId(null);
        setHoveredId(null);
        setTooltip(null);
    };

    const zoomIn = () => {
        cancelZoomAnimation();
        setTransform(p => ({ ...p, scale: Math.min(25, p.scale * 1.3) }));
    };

    const zoomOut = () => {
        cancelZoomAnimation();
        setTransform(p => ({ ...p, scale: Math.max(0.5, p.scale * 0.77) }));
    };

    return (
        <div
            className="min-h-full w-full bg-gray-50 dark:bg-[#0f0e17] overflow-y-auto"
            onMouseDown={e => {
                const insideSearch = searchContainerRef.current?.contains(e.target as Node);
                const insideTooltip = tooltipRef.current?.contains(e.target as Node);
                if (!insideSearch && !insideTooltip) { setIsSearchOpen(false); }
            }}
        >
            {/* ── Sticky Header ── */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0f0e17]/80 backdrop-blur-md
        border-b border-black/[0.06] dark:border-white/[0.06] px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-base font-semibold tracking-tight text-gray-800 dark:text-white/85">PH Directory</h1>
                            <p className="text-[11px] text-gray-400 dark:text-white/30">COMELEC Field Offices</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div ref={searchContainerRef} className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/25" />
                        <input
                            type="text"
                            placeholder="Search province or region…"
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    const term = searchQuery.toLowerCase();
                                    const firstMatch = searchOptions.find(o => o.name.toLowerCase().includes(term));
                                    if (firstMatch) { handleFocus(firstMatch.name); setIsSearchOpen(false); }
                                }
                            }}
                            className="w-full bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06]
                rounded-xl pl-9 pr-4 py-2 text-sm text-gray-700 dark:text-white/70
                placeholder-gray-400 dark:placeholder-white/20
                focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-white/20 hover:text-gray-500 dark:hover:text-white/50">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Dropdown */}
                        {isSearchOpen && searchQuery.length > 1 && (
                            <div className="absolute top-full mt-1.5 w-full bg-white dark:bg-[#0d0d1a] border border-black/[0.08] dark:border-white/[0.08]
                rounded-xl shadow-xl overflow-hidden z-50 max-h-56 overflow-y-auto">
                                {searchOptions.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 12).map((o, i) => (
                                    <button
                                        key={i}
                                        onClick={e => { e.stopPropagation(); handleFocus(o.name.toLowerCase()); setSearchQuery(o.name); }}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm
                      hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors
                      border-b border-black/[0.04] dark:border-white/[0.04] last:border-none"
                                    >
                                        <span className="text-gray-700 dark:text-white/70 capitalize">{o.name}</span>
                                        <span className="text-[10px] text-gray-400 dark:text-white/25 uppercase tracking-widest">{o.region}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex flex-col lg:flex-row gap-0 max-w-6xl mx-auto px-6 py-6">

                {/* ── Map Panel ── */}
                <div className="flex-1 flex flex-col items-center lg:items-start">
                    <div className="relative">
                        {/* Map canvas card */}
                        <div className="rounded-2xl overflow-hidden border border-black/[0.07] dark:border-white/[0.07]
              shadow-lg dark:shadow-none relative"
                            style={{ width: CANVAS_W, height: CANVAS_H }}>
                            <canvas
                                ref={canvasRef}
                                width={CANVAS_W}
                                height={CANVAS_H}
                                className="cursor-move block"
                                onWheel={handleWheel}
                                onMouseDown={e => { isDragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; setTooltip(null); }}
                                onMouseMove={handleMouseMove}
                                onMouseUp={() => { isDragging.current = false; }}
                                onMouseLeave={() => { isDragging.current = false; if (!selectedFeatureId) setTooltip(null); }}
                                onClick={handleCanvasClick}
                            />

                            {/* Loading overlay */}
                            {loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070710]">
                                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mb-3" />
                                    <p className="text-xs text-white/30 font-mono">Loading map data…</p>
                                </div>
                            )}

                            {/* Zoom level pill */}
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full
                bg-[#0d0d1a]/80 backdrop-blur-sm border border-white/[0.08]
                text-[10px] font-mono text-indigo-400">
                                {transform.scale.toFixed(1)}×
                            </div>

                            {/* Zoom controls */}
                            <div className="absolute top-3 right-3 flex flex-col gap-1">
                                {[
                                    { icon: <ZoomIn className="w-3.5 h-3.5" />, action: zoomIn, title: "Zoom in" },
                                    { icon: <ZoomOut className="w-3.5 h-3.5" />, action: zoomOut, title: "Zoom out" },
                                    { icon: <RotateCcw className="w-3.5 h-3.5" />, action: resetView, title: "Reset view" },
                                ].map(({ icon, action, title }, i) => (
                                    <button key={i} onClick={action} title={title}
                                        className="w-7 h-7 rounded-lg bg-[#0d0d1a]/80 backdrop-blur-sm border border-white/[0.08]
                      flex items-center justify-center text-white/40 hover:text-white/80
                      hover:bg-white/[0.08] transition-all">
                                        {icon}
                                    </button>
                                ))}
                            </div>

                            {/* Selected indicator */}
                            {selectedFeatureId && (
                                <button
                                    onClick={() => { setSelectedFeatureId(null); setHoveredId(null); setTooltip(null); }}
                                    className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full
                    bg-indigo-500/20 border border-indigo-500/30 text-indigo-300
                    text-[10px] hover:bg-indigo-500/30 transition-colors">
                                    <X className="w-2.5 h-2.5" /> Clear selection
                                </button>
                            )}
                        </div>

                        {/* Tooltip */}
                        {tooltip && (
                            <div
                                ref={tooltipRef}
                                className="fixed z-50 pointer-events-auto"
                                style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, calc(-100% - 12px))" }}
                            >
                                <div className="bg-[#0d0d1a] border border-white/[0.1] rounded-2xl shadow-2xl
                  shadow-black/50 overflow-hidden min-w-[220px]">
                                    {/* Accent bar */}
                                    <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
                                    <div className="p-4">
                                        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-indigo-400/70 mb-1">
                                            {tooltip.data.regionLabel}
                                        </p>
                                        <p className="text-base font-semibold text-white/90 leading-tight mb-4">
                                            {tooltip.data.properties.adm2_en}
                                        </p>
                                        <button
                                            onClick={() => handleRedirect({ region: tooltip.data.regionLabel, city: tooltip.data.properties.adm2_en })}
                                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl
                        bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold
                        transition-colors"
                                        >
                                            View offices
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                {/* Tail */}
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-3 h-3
                  bg-[#0d0d1a] border-r border-b border-white/[0.1] rotate-45" />
                            </div>
                        )}
                    </div>

                    {/* Map hint */}
                    <p className="text-[11px] text-gray-400 dark:text-white/20 mt-3 text-center" style={{ width: CANVAS_W }}>
                        Scroll to zoom · drag to pan · click a province to view offices
                    </p>
                </div>

                {/* ── Info Panel ── */}
                <div className="lg:w-72 flex flex-col gap-4 lg:pl-6 mt-6 lg:mt-0 lg:pt-0">

                    {/* Quick links */}
                    <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-gray-400 dark:text-white/25 mb-3">
                            Quick Access
                        </p>
                        <div className="space-y-2">
                            <QuickLink icon={<Building2 className="w-4 h-4" />} label="Main Office Directory" href={directoryData.contactinformation.mainoffice[0].directory} />
                            <QuickLink icon={<Globe className="w-4 h-4" />} label="Regional Offices" href={directoryData.contactinformation.regionaloffices[0].href} />
                            <QuickLink icon={<MapPin className="w-4 h-4" />} label="NCR Offices" href={directoryData.contactinformation.ncroffices[0].href} />
                        </div>
                    </div>

                    {/* Region legend */}
                    <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-gray-400 dark:text-white/25 mb-3">
                            Regions ({REGION_FILES.length})
                        </p>
                        <div className="bg-white dark:bg-white/[0.02] border border-black/[0.07] dark:border-white/[0.06] rounded-xl p-3 space-y-1.5 max-h-64 overflow-y-auto">
                            {REGION_FILES.map((reg) => (
                                <button
                                    key={reg.label}
                                    onClick={() => handleFocus(reg.label.toLowerCase())}
                                    className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg
                    hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors text-left group"
                                >
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: reg.color }} />
                                    <span className="text-xs text-gray-600 dark:text-white/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                        {reg.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Voter reg link */}
                    <a
                        href={directoryData.voterregistration.schedule}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl
              bg-indigo-500/10 border border-indigo-500/20
              hover:bg-indigo-500/15 hover:border-indigo-500/30
              transition-all no-underline group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-indigo-400">Voter Registration</p>
                            <p className="text-[10px] text-indigo-400/60 mt-0.5">View schedule & program</p>
                        </div>
                        <svg className="w-3.5 h-3.5 text-indigo-400/40 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
}