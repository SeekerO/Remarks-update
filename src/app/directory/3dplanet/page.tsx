"use client";

import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { Building2, Globe, MapPin } from "lucide-react";
import directoryData from "../fieldoffice/directory.json";
import test from "node:test";

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

const CANVAS_W = 460;
const CANVAS_H = 720;

const REGION_FILES = [
    { file: "provdists-region-1300000000.topo.0.01.json", key: "provdists-region-1300000000", label: "NCR", color: "#991b1b" },
    { file: "provdists-region-100000000.topo.0.01.json", key: "provdists-region-100000000", label: "Ilocos Region (I)", color: "#1e40af" },
    { file: "provdists-region-200000000.topo.0.01.json", key: "provdists-region-200000000", label: "Cagayan Valley (II)", color: "#92400e" },
    { file: "provdists-region-300000000.topo.0.01.json", key: "provdists-region-300000000", label: "Central Luzon (III)", color: "#3730a3" },
    { file: "provdists-region-400000000.topo.0.01.json", key: "provdists-region-400000000", label: "CALABARZON (IV-A)", color: "#86198f" },
    { file: "provdists-region-500000000.topo.0.01.json", key: "provdists-region-500000000", label: "Bicol Region (V)", color: "#065f46" },
    { file: "provdists-region-600000000.topo.0.01.json", key: "provdists-region-600000000", label: "Western Visayas (VI)", color: "#b91c1c" },
    { file: "provdists-region-700000000.topo.0.01.json", key: "provdists-region-700000000", label: "Central Visayas (VII)", color: "#1e3a8a" },
    { file: "provdists-region-800000000.topo.0.01.json", key: "provdists-region-800000000", label: "Eastern Visayas (VIII)", color: "#166534" },
    { file: "provdists-region-900000000.topo.0.01.json", key: "provdists-region-900000000", label: "Zamboanga Peninsula (IX)", color: "#5b21b6" },
    { file: "provdists-region-1000000000.topo.0.01.json", key: "provdists-region-1000000000", label: "Northern Mindanao (X)", color: "#854d0e" },
    { file: "provdists-region-1100000000.topo.0.01.json", key: "provdists-region-1100000000", label: "Davao Region (XI)", color: "#155e75" },
    { file: "provdists-region-1200000000.topo.0.01.json", key: "provdists-region-1200000000", label: "SOCCSKSARGEN (XII)", color: "#3f6212" },
    { file: "provdists-region-1400000000.topo.0.01.json", key: "provdists-region-1400000000", label: "CAR (XIV)", color: "#166534" },
    { file: "provdists-region-1600000000.topo.0.01.json", key: "provdists-region-1600000000", label: "Caraga (XIII)", color: "#4338ca" },
    { file: "provdists-region-1700000000.topo.0.01.json", key: "provdists-region-1700000000", label: "MIMAROPA (IV-B)", color: "#be185d" },
    { file: "provdists-region-1900000000.topo.0.01.json", key: "provdists-region-1900000000", label: "BARMM", color: "#047857" },
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PhilippineMap() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
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
        if (zoomAnimRef.current !== null) {
            cancelAnimationFrame(zoomAnimRef.current);
            zoomAnimRef.current = null;
        }
    }, []);

    const animateToTransform = useCallback((target: { x: number; y: number; scale: number }, durationMs = 650) => {
        cancelZoomAnimation();

        const from = transform;
        const start = performance.now();

        const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

        const step = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            const e = easeInOutCubic(t);
            setTransform({
                x: from.x + (target.x - from.x) * e,
                y: from.y + (target.y - from.y) * e,
                scale: from.scale + (target.scale - from.scale) * e,
            });

            if (t < 1) {
                zoomAnimRef.current = requestAnimationFrame(step);
            } else {
                zoomAnimRef.current = null;
            }
        };

        zoomAnimRef.current = requestAnimationFrame(step);
    }, [cancelZoomAnimation, transform]);

    const handleRedirect = ({ region, city }: { region: string; city: string }) => {
        const directoryRegionKey = REGION_LABEL_TO_DIRECTORY_KEY[region] ?? region;
        const formattedRegion = directoryRegionKey.toLowerCase().replace(/\s+/g, "");
        const formattedCity = city.toLowerCase().replace(/\s+/g, "");
        const officeCaps = formattedCity === "caraga" || formattedCity === "barmm" ? "Offices" : "offices";
        const url = `https://comelec.gov.ph/?r=ContactInformation/FieldOffices/CityMunicipalOffices/${formattedRegion + officeCaps}#${formattedCity}`;


        if (region.toLowerCase() === "ncr")
            return window.open("https://comelec.gov.ph/?r=ContactInformation/FieldOffices/NCROffices", "_blank", "noopener,noreferrer");
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
                    decodeTopology(data, reg.key).forEach(f =>
                        results.push({ ...f, regionLabel: reg.label, color: reg.color })
                    );
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
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        })));
        const pad = 60;
        const baseScale = Math.min((CANVAS_W - pad * 2) / (maxX - minX), (CANVAS_H - pad * 2) / (maxY - minY));
        const ox = (CANVAS_W - (maxX - minX) * baseScale) / 2;
        const oy = (CANVAS_H - (maxY - minY) * baseScale) / 2;
        return { minX, maxX, minY, maxY, baseScale, ox, oy };
    }, [allFeatures]);

    const project = useCallback((lon: number, lat: number): [number, number] => {
        if (!bounds) return [0, 0];
        const px = (lon - bounds.minX) * bounds.baseScale + bounds.ox;
        const py = (bounds.maxY - lat) * bounds.baseScale + bounds.oy;
        return [
            (px + transform.x) * transform.scale,
            (py + transform.y) * transform.scale
        ];
    }, [bounds, transform]);

    // ─── SEARCH & ZOOM LOGIC ───
    const searchOptions = useMemo(() => {
        const offices = directoryData.contactinformation.fieldoffices[0];
        const flatList: { name: string; region: string; isRegion: boolean }[] = [];

        Object.entries(offices).forEach(([regionKey, data]: [string, any]) => {
            const regionUpper = regionKey.toUpperCase();

            // Add the Region itself as a searchable zoom target
            flatList.push({ name: regionUpper, region: "REGION", isRegion: true });

            // Add the cities/provinces
            data.city.forEach((name: string) => {
                flatList.push({ name, region: regionUpper, isRegion: false });
            });
        });
        return flatList;
    }, []);

    const handleFocus = (name: string) => {
        const searchName = name.toLowerCase().trim();

        // 1. Helper to strip common prefixes for better matching
        const normalize = (val: string) =>
            val.toLowerCase()
                .replace("city of ", "")
                .replace("province of ", "")
                .replace("islands", "")
                .trim();

        const normalizedSearch = normalize(searchName);

        // If the search term is a directory-style region key (e.g., "region1", "caraga"),
        // translate it to the human-readable region label used in the TopoJSON data.
        const mappedRegionLabel = DIRECTORY_KEY_TO_REGION_LABEL[normalizedSearch];
        const regionSearchTerm = mappedRegionLabel ? mappedRegionLabel.toLowerCase() : searchName;

        // 2. Identify Regional Targets (e.g., if user searched "NCR" or "BARMM")
        // Compares against the regionLabel assigned during the TopoJSON decoding
        const regionalFeatures = allFeatures.filter(f =>
            f.regionLabel.toLowerCase().includes(regionSearchTerm) ||
            normalize(f.regionLabel).includes(regionSearchTerm)
        );

        // 3. Identify Specific Location Targets (e.g., "Manila")
        // Checks if the search name matches or is contained within the property name
        const specificFeature = allFeatures.find(f => {
            const featName = (f.properties?.adm2_en?.toLowerCase() || "");
            return featName === searchName ||
                normalize(featName) === normalizedSearch ||
                featName.includes(searchName);
        });

        // Determine what we are zooming into
        const targets = regionalFeatures.length > 0 ? regionalFeatures : (specificFeature ? [specificFeature] : []);

        if (targets.length > 0 && bounds) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

            // Calculate the bounding box of all target features to center the view
            targets.forEach(target => {
                target.rings.forEach(r => r.forEach(([x, y]) => {
                    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                }));
            });

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            // Project the world center to canvas space
            const px = (centerX - bounds.minX) * bounds.baseScale + bounds.ox;
            const py = (bounds.maxY - centerY) * bounds.baseScale + bounds.oy;

            // Use a wider zoom for regions (2.5x) and a tighter zoom for cities (6x)
            const isRegionZoom = regionalFeatures.length > 1;
            const targetScale = isRegionZoom ? 2.5 : 6;

            const targetTransform = {
                scale: targetScale,
                x: (CANVAS_W / 2 / targetScale) - px,
                y: (CANVAS_H / 2 / targetScale) - py
            };

            animateToTransform(targetTransform);

            // Lock highlight & tooltip on the selected feature until user clicks outside
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

            // Close search UI
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
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        allFeatures.forEach(feat => {
            const isHov = feat.id === hoveredId;
            ctx.beginPath();
            feat.rings.forEach(ring => {
                ring.forEach(([lon, lat], i) => {
                    const [px, py] = project(lon, lat);
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                });
            });
            ctx.fillStyle = isHov ? "#38bdf8" : feat.color;
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.05)";
            ctx.lineWidth = 0.5 / transform.scale;
            ctx.stroke();
        });

        // Pass 2: Regional Borders
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
            ctx.strokeStyle = "rgba(56,189,248,0.3)";
            ctx.lineWidth = 1.5 / transform.scale;
            ctx.stroke();
        });
    }, [allFeatures, hoveredId, project, transform.scale]);

    useEffect(() => { draw(); }, [draw]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        const my = (e.clientY - rect.top) * (CANVAS_H / rect.height);
        const hit = allFeatures.find(f =>
            f.rings.some(r =>
                pointInPolygon(
                    mx,
                    my,
                    r.map(p => project(p[0], p[1])) as [number, number][]
                )
            )
        );

        if (hit) {
            setSelectedFeatureId(hit.id);
            setHoveredId(hit.id);
            setTooltip({ x: e.clientX, y: e.clientY, data: hit });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging.current) {
            const dx = e.clientX - lastPos.current.x;
            const dy = e.clientY - lastPos.current.y;
            lastPos.current = { x: e.clientX, y: e.clientY };

            pendingDragDelta.current = {
                dx: pendingDragDelta.current.dx + dx,
                dy: pendingDragDelta.current.dy + dy,
            };

            if (dragAnimRef.current === null) {
                dragAnimRef.current = requestAnimationFrame(() => {
                    const { dx: totalDx, dy: totalDy } = pendingDragDelta.current;
                    pendingDragDelta.current = { dx: 0, dy: 0 };
                    dragAnimRef.current = null;

                    setTransform(p => ({
                        ...p,
                        x: p.x + totalDx / p.scale,
                        y: p.y + totalDy / p.scale,
                    }));
                });
            }

            return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        if (selectedFeatureId !== null) {
            return;
        }

        const mx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        const my = (e.clientY - rect.top) * (CANVAS_H / rect.height);
        const hit = allFeatures.find(f => f.rings.some(r => pointInPolygon(mx, my, r.map(p => project(p[0], p[1])) as [number, number][])));
        setHoveredId(hit?.id || null);
        setTooltip(hit ? { x: e.clientX, y: e.clientY, data: hit } : null);
    };

    return (
        <div
            className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 select-none font-sans overflow-hidden"
            onMouseDown={e => {
                const t = e.target as Node;
                const insideMap = mapContainerRef.current?.contains(t) ?? false;
                const insideTooltip = tooltipRef.current?.contains(t) ?? false;
                const insideSearch = searchContainerRef.current?.contains(t) ?? false;
                if (!insideMap && !insideTooltip && !insideSearch) {
                    setSelectedFeatureId(null);
                    setHoveredId(null);
                    setTooltip(null);
                    setIsSearchOpen(false);
                }
            }}
        >
            <header className="mb-8 text-center">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">PH <span className="text-sky-400">DIRECTORY</span></h1>
            </header>
            <div className="flex  gap-5 items-center justify-center">

                <aside>
                    <div ref={mapContainerRef} className="relative rounded-[2.5rem] border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden cursor-move">
                        <div ref={mapContainerRef}>
                            <canvas

                                ref={canvasRef}
                                width={CANVAS_W}
                                height={CANVAS_H}
                                onWheel={handleWheel}
                                onMouseDown={e => {
                                    isDragging.current = true;
                                    lastPos.current = { x: e.clientX, y: e.clientY };
                                    setTooltip(null);

                                }}
                                onMouseMove={handleMouseMove}
                                onMouseUp={() => {
                                    isDragging.current = false;
                                }}
                                onMouseLeave={() => {
                                    isDragging.current = false;
                                    if (!selectedFeatureId) setTooltip(null);
                                }}
                                onClick={e => {
                                    handleCanvasClick(e);
                                }}
                            />
                        </div>

                        <div>
                            <div className="absolute top-6 left-6 px-4 py-1.5 bg-slate-950/60 backdrop-blur-xl rounded-full border border-white/10 text-[10px] text-sky-400 font-black tracking-widest">
                                ZOOM: {transform.scale.toFixed(1)}x
                            </div>
                            <div>

                            </div>
                        </div>
                    </div>

                    {tooltip && (
                        <div
                            className="fixed z-50 transform -translate-x-1/2 -translate-y-[110%] transition-all duration-200 ease-out"
                            style={{ left: tooltip.x, top: tooltip.y }}
                            ref={tooltipRef}
                        >
                            {/* Main Container with Glassmorphism */}
                            <div className="relative group bg-slate-950/80 border border-white/10 backdrop-blur-xl p-1 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[240px] overflow-hidden">

                                {/* Subtle Inner Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-50" />

                                <div className="relative p-5">
                                    {/* Header Section */}
                                    <div className="flex flex-col gap-0.5">
                                        <span className="flex items-center gap-2">
                                            <span className="h-1 w-1 rounded-full bg-sky-400 animate-pulse" />
                                            <span className="text-sky-400/80 font-bold text-[10px] uppercase tracking-[0.25em]">
                                                {tooltip.data.regionLabel}
                                            </span>
                                        </span>
                                        <h3 className="text-2xl font-semibold text-white tracking-tight leading-tight">
                                            {tooltip.data.properties.adm2_en}
                                        </h3>
                                    </div>

                                    {/* Action Section */}
                                    <div className="mt-6 pt-4 border-t border-white/5">
                                        <button
                                            className="group/btn relative w-full overflow-hidden rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition-all active:scale-95"
                                            onClick={(e) => {
                                                handleRedirect({
                                                    region: tooltip.data.regionLabel,
                                                    city: tooltip.data.properties.adm2_en,
                                                });
                                            }}
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                View Regional Offices
                                                <svg
                                                    className="w-4 h-4 transition-transform group-hover/btn:translate-x-1"
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </span>
                                            {/* Button Hover Shine */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tooltip Tail / Indicator */}
                            <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-slate-950/80 rotate-45 border-r border-b border-white/10" />
                        </div>
                    )}
                </aside>



                <main className="flex flex-col gap-2 h-full items-center p-4 overflow-y-auto">

                    {/* Directory Search */}
                    <div ref={searchContainerRef} className="relative w-full max-w-[460px] mb-4 z-50">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center">
                            <input
                                className="bg-transparent text-white outline-none w-full text-sm"
                                placeholder="Search from Directory..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                                onKeyDown={e => {
                                    if (e.key === "Enter") {
                                        const term = searchQuery.toLowerCase();
                                        const firstMatch = searchOptions.find(o => o.name.toLowerCase().includes(term));
                                        if (firstMatch) {
                                            handleFocus(firstMatch.name);
                                            setIsSearchOpen(false);
                                        }
                                    }
                                }}
                            />
                        </div>
                        {isSearchOpen && searchQuery.length > 1 && (
                            <div className="absolute top-full w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl max-h-48 overflow-y-auto">
                                {searchOptions.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase())).map((o, i) => (
                                    <button
                                        key={i}
                                        onClick={e => {
                                            e.stopPropagation()
                                            handleFocus(o.name.toLowerCase());
                                            setSearchQuery(o.name);

                                        }}
                                        className="w-full text-left p-3 text-sm text-slate-300 hover:bg-sky-500 hover:text-white capitalize border-b border-white/5 last:border-none"
                                    >
                                        {o.name} <span className="text-[9px] opacity-40 float-right mt-1">{o.region}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-[80%] h-[1px] bg-slate-400" />

                    <h3 className="text-lg font-bold text-white tracking-tight leading-tight">COMELEC OFFICES</h3>

                    <div className="w-full max-w-[460px] mb-6 grid grid-cols-1 gap-3">
                        <QuickLink
                            icon={<Building2 size={18} />}
                            label="Main Office"
                            href={directoryData.contactinformation.mainoffice[0].directory}
                            color="bg-blue-600"
                        />
                        <QuickLink
                            icon={<Globe size={18} />}
                            label="Regional Offices"
                            href={directoryData.contactinformation.regionaloffices[0].href}
                            color="bg-emerald-600"
                        />
                        <QuickLink
                            icon={<MapPin size={18} />}
                            label="NCR Offices"
                            href={directoryData.contactinformation.ncroffices[0].href}
                            color="bg-purple-600"
                        />
                    </div>

                </main>

            </div>

        </div>
    );
}

function QuickLink({ icon, label, href, color }: { icon: ReactNode; label: string; href: string; color: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-sky-500 hover:bg-slate-900/80 transition-all group"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${color} text-white shadow-lg`}>{icon}</div>
                <span className="font-semibold text-slate-100 text-xs">{label}</span>
            </div>
        </a>
    );
}