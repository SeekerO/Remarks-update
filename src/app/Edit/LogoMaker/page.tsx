'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Type, Layers, ZoomIn, ZoomOut, Undo, Redo, Trash2, Copy, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Circle, Square, Star, Heart, Triangle, Lock, Unlock, Upload, Settings } from 'lucide-react';
import { IoLogoBuffer } from "react-icons/io";

interface Element {
    id: string;
    type: 'text' | 'shape' | 'image';
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: string;
    color: string;
    rotation: number;
    locked: boolean;
    zIndex: number;
    imageData?: string;
}

const SHAPES = [
    { name: 'Circle', component: Circle },
    { name: 'Square', component: Square },
    { name: 'Star', component: Star },
    { name: 'Heart', component: Heart },
    { name: 'Triangle', component: Triangle },
];

const COLORS = [
    '#000000', '#FFFFFF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
];

const CANVAS_PRESETS = [
    { name: 'Square (1:1)', width: 800, height: 800 },
    { name: 'Logo (4:3)', width: 800, height: 600 },
    { name: 'Wide (16:9)', width: 1600, height: 900 },
    { name: 'Instagram Post', width: 1080, height: 1080 },
    { name: 'Facebook Cover', width: 1640, height: 924 },
    { name: 'Custom', width: 800, height: 600 },
];

// Checkerboard pattern constants for transparent backgrounds
const CHECKERBOARD_LIGHT = 'linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5), linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5)';
const CHECKERBOARD_DARK = 'linear-gradient(45deg, #374151 25%, transparent 25%, transparent 75%, #374151 75%, #374151), linear-gradient(45deg, #374151 25%, transparent 25%, transparent 75%, #374151 75%, #374151)';

// Helper to determine initial theme from system preference or local storage
const getInitialTheme = () => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme') as 'light' | 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

const LogoMaker: React.FC = () => {
    const [elements, setElements] = useState<Element[]>([]);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [canvasColor, setCanvasColor] = useState('#FFFFFF');
    const [transparentBg, setTransparentBg] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(800);
    const [canvasHeight, setCanvasHeight] = useState(600);
    const [showCanvasSettings, setShowCanvasSettings] = useState(false);
    const [customWidth, setCustomWidth] = useState(800);
    const [customHeight, setCustomHeight] = useState(600);
    const [zoom, setZoom] = useState(100);
    const [history, setHistory] = useState<Element[][]>([]);
    const [historyStep, setHistoryStep] = useState(-1);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [theme] = useState<'light' | 'dark'>(getInitialTheme);

    const canvasContainerRef = useRef<HTMLDivElement>(null); // Ref for the scrollable container
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Theme Management Effect ---
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // --- History Management ---
    const addToHistory = (newElements: Element[]) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(JSON.parse(JSON.stringify(newElements)));
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    // --- Element Actions (Add, Update, Delete, Duplicate) ---
    const addText = () => {
        const newElement: Element = {
            id: `text-${Date.now()}`,
            type: 'text',
            content: 'Double click to edit',
            x: canvasWidth / 2 - 100,
            y: canvasHeight / 2 - 25,
            width: 200,
            height: 50,
            fontSize: 32,
            fontWeight: 'bold',
            fontStyle: 'normal',
            textAlign: 'center',
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
            rotation: 0,
            locked: false,
            zIndex: elements.length,
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        addToHistory(newElements);
        setSelectedElement(newElement.id);
    };

    const addShape = (shapeName: string) => {
        const newElement: Element = {
            id: `shape-${Date.now()}`,
            type: 'shape',
            content: shapeName,
            x: canvasWidth / 2 - 50,
            y: canvasHeight / 2 - 50,
            width: 100,
            height: 100,
            color: '#8B5CF6',
            rotation: 0,
            locked: false,
            zIndex: elements.length,
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        addToHistory(newElements);
        setSelectedElement(newElement.id);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const maxSize = 400;
                let width = img.width;
                let height = img.height;

                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height / width) * maxSize;
                        width = maxSize;
                    } else {
                        width = (width / height) * maxSize;
                        height = maxSize;
                    }
                }

                const newElement: Element = {
                    id: `image-${Date.now()}`,
                    type: 'image',
                    content: 'Image',
                    x: canvasWidth / 2 - width / 2,
                    y: canvasHeight / 2 - height / 2,
                    width,
                    height,
                    color: '#000000',
                    rotation: 0,
                    locked: false,
                    zIndex: elements.length,
                    imageData: event.target?.result as string,
                };
                const newElements = [...elements, newElement];
                setElements(newElements);
                addToHistory(newElements);
                setSelectedElement(newElement.id);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const updateElement = (id: string, updates: Partial<Element>) => {
        const newElements = elements.map(el =>
            el.id === id ? { ...el, ...updates } : el
        );
        setElements(newElements);
    };

    const deleteElement = () => {
        if (!selectedElement) return;
        const newElements = elements.filter(el => el.id !== selectedElement);
        setElements(newElements);
        addToHistory(newElements);
        setSelectedElement(null);
    };

    const duplicateElement = () => {
        if (!selectedElement) return;
        const element = elements.find(el => el.id === selectedElement);
        if (!element) return;

        const newElement = {
            ...element,
            id: `${element.type}-${Date.now()}`,
            x: element.x + 20,
            y: element.y + 20,
            zIndex: elements.length,
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        addToHistory(newElements);
        setSelectedElement(newElement.id);
    };

    const undo = () => {
        if (historyStep > 0) {
            setHistoryStep(historyStep - 1);
            setElements(JSON.parse(JSON.stringify(history[historyStep - 1])));
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(historyStep + 1);
            setElements(JSON.parse(JSON.stringify(history[historyStep + 1])));
        }
    };

    // --- Drag/Resize/Move Handlers ---
    const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
        const element = elements.find(el => el.id === elementId);
        if (element?.locked) return;

        setSelectedElement(elementId);
        setIsDragging(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left - element!.x,
                y: e.clientY - rect.top - element!.y,
            });
        }
    };

    const handleResizeStart = (e: React.MouseEvent, elementId: string) => {
        e.stopPropagation();
        const element = elements.find(el => el.id === elementId);
        if (element?.locked) return;

        setSelectedElement(elementId);
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: element!.width,
            height: element!.height,
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && selectedElement && !isResizing) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                // Account for zoom in drag calculation
                const scale = zoom / 100;
                const x = (e.clientX - rect.left) / scale - dragOffset.x / scale;
                const y = (e.clientY - rect.top) / scale - dragOffset.y / scale;
                updateElement(selectedElement, { x, y });
            }
        } else if (isResizing && selectedElement) {
            const element = elements.find(el => el.id === selectedElement);
            if (element) {
                // Account for zoom in resize calculation
                const scale = zoom / 100;
                const deltaX = (e.clientX - resizeStart.x) / scale;
                const deltaY = (e.clientY - resizeStart.y) / scale;
                const newWidth = Math.max(20, resizeStart.width + deltaX);
                const newHeight = Math.max(20, resizeStart.height + deltaY);
                updateElement(selectedElement, { width: newWidth, height: newHeight });
            }
        }
    };

    const handleMouseUp = () => {
        if ((isDragging || isResizing) && selectedElement) {
            addToHistory(elements);
        }
        setIsDragging(false);
        setIsResizing(false);
    };

    // --- Canvas Settings ---
    const applyCanvasPreset = (preset: typeof CANVAS_PRESETS[0]) => {
        if (preset.name === 'Custom') {
            setCanvasWidth(customWidth);
            setCanvasHeight(customHeight);
        } else {
            setCanvasWidth(preset.width);
            setCanvasHeight(preset.height);
        }
        setShowCanvasSettings(false);
    };

    // --- Keyboard/Scroll Handlers ---
    const handleZoom = useCallback((deltaY: number) => {
        setZoom(prevZoom => {
            const zoomStep = 25;
            const newZoom = deltaY < 0
                ? Math.min(200, prevZoom + zoomStep)
                : Math.max(25, prevZoom - zoomStep);
            return newZoom;
        });
    }, []);

    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            // 1. Horizontal Scroll (Shift + Scroll)
            if (event.shiftKey && canvasContainerRef.current) {
                event.preventDefault(); // Prevent default vertical scroll
                canvasContainerRef.current.scrollLeft += event.deltaY;
            }

            // 2. Zoom (Ctrl/Meta + Scroll) - Meta for Mac
            if ((event.ctrlKey || event.metaKey) && canvasContainerRef.current) {
                event.preventDefault(); // Prevent default browser zoom
                handleZoom(event.deltaY);
            }
        };

        const canvasContainer = canvasContainerRef.current;
        if (canvasContainer) {
            canvasContainer.addEventListener('wheel', handleWheel);
        }

        // Cleanup function
        return () => {
            if (canvasContainer) {
                canvasContainer.removeEventListener('wheel', handleWheel);
            }
        };
    }, [handleZoom]);

    // --- Download Functions (Canvas Drawing) ---
    const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    };

    const drawHeart = (ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number) => {
        const size = width / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy + size / 4);
        ctx.bezierCurveTo(cx, cy, cx - size / 2, cy - size / 2, cx - size, cy);
        ctx.bezierCurveTo(cx - size * 1.3, cy + size / 2, cx - size / 2, cy + size, cx, cy + size * 1.3);
        ctx.bezierCurveTo(cx + size / 2, cy + size, cx + size * 1.3, cy + size / 2, cx + size, cy);
        ctx.bezierCurveTo(cx + size / 2, cy - size / 2, cx, cy, cx, cy + size / 4);
        ctx.closePath();
    };

    const drawTriangle = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
    };

    const downloadCanvas = async (withBackground: boolean) => {
        if (!canvasRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = 2;
        canvas.width = canvasWidth * scale;
        canvas.height = canvasHeight * scale;

        if (ctx) {
            ctx.scale(scale, scale);

            // Background
            if (withBackground && !transparentBg) {
                ctx.fillStyle = canvasColor;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }

            // Sort by zIndex
            const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

            for (const element of sortedElements) {
                ctx.save();
                ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
                ctx.rotate((element.rotation * Math.PI) / 180);
                ctx.translate(-(element.x + element.width / 2), -(element.y + element.height / 2));

                if (element.type === 'text') {
                    ctx.fillStyle = element.color;
                    ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px Arial, sans-serif`;
                    ctx.textAlign = element.textAlign as CanvasTextAlign || 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(element.content, element.x + element.width / 2, element.y + element.height / 2);
                } else if (element.type === 'shape') {
                    ctx.fillStyle = element.color;
                    ctx.beginPath();
                    const cx = element.x + element.width / 2;
                    const cy = element.y + element.height / 2;
                    const radius = Math.min(element.width, element.height) / 2;

                    if (element.content === 'Circle') {
                        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    } else if (element.content === 'Square') {
                        ctx.rect(element.x, element.y, element.width, element.height);
                    } else if (element.content === 'Star') {
                        drawStar(ctx, cx, cy, 5, radius, radius / 2);
                    } else if (element.content === 'Heart') {
                        drawHeart(ctx, cx, cy, element.width);
                    } else if (element.content === 'Triangle') {
                        drawTriangle(ctx, element.x, element.y, element.width, element.height);
                    }
                    ctx.fill();
                } else if (element.type === 'image' && element.imageData) {
                    const img = new Image();
                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.src = element.imageData!;
                    });
                    ctx.drawImage(img, element.x, element.y, element.width, element.height);
                }
                ctx.restore();
            }

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `logo-${withBackground ? 'with-bg' : 'no-bg'}.png`;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            });
        }
    };

    const selected = elements.find(el => el.id === selectedElement);

    const checkerboardPattern = theme === 'dark' ? CHECKERBOARD_DARK : CHECKERBOARD_LIGHT;

    return (
        <div className="h-screen w-screen overflow-hidden  bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Top Toolbar */}
            <div className="select-none border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between h-[70px]">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1"> <IoLogoBuffer /> Logo Maker</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={undo}
                            disabled={historyStep <= 0}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Undo className="w-5 h-5" />
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyStep >= history.length - 1}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Redo className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">


                    <button
                        onClick={() => setShowCanvasSettings(!showCanvasSettings)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">{canvasWidth} × {canvasHeight}</span>
                    </button>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                        <button onClick={() => handleZoom(1)} className="p-1 hover:bg-white dark:hover:bg-gray-800 rounded">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                        <button onClick={() => handleZoom(-1)} className="p-1 hover:bg-white dark:hover:bg-gray-800 rounded">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => downloadCanvas(true)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>
                </div>
            </div>

            {/* Canvas Settings Modal */}
            {showCanvasSettings && (
                <div className="absolute top-16 right-4 z-50 bg-white dark:bg-gray-700 rounded-lg shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-600 p-4 w-80">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Canvas Settings</h3>
                    <div className="space-y-2 mb-4">
                        {CANVAS_PRESETS.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => applyCanvasPreset(preset)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg flex justify-between items-center"
                            >
                                <span className="text-sm font-medium">{preset.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-300">{preset.width} × {preset.height}</span>
                            </button>
                        ))}
                    </div>
                    <div className="border-t dark:border-gray-600 pt-3 space-y-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Custom Size</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={customWidth}
                                onChange={(e) => setCustomWidth(Number(e.target.value))}
                                placeholder="Width"
                                className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500 w-[100px]"
                            />
                            <input
                                type="number"
                                value={customHeight}
                                onChange={(e) => setCustomHeight(Number(e.target.value))}
                                placeholder="Height"
                                className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500 w-[100px]"
                            />
                        </div>
                        <button
                            onClick={() => applyCanvasPreset(CANVAS_PRESETS[5])}
                            className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        >
                            Apply Custom Size
                        </button>
                    </div>
                </div>
            )}
            {/* --- */}

            <div className="flex-1 flex overflow-hidden h-full">
                {/* Left Sidebar - Applied responsive width: w-56 on smaller screens, w-64 on medium and larger */}
                <div className="w-56 md:w-64 min-w-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                    <div className="p-4 space-y-4">
                        {/* Add Elements */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Add Elements</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={addText}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg flex items-center gap-3 text-left"
                                >
                                    <Type className="w-5 h-5" />
                                    <span className="font-medium">Add Text</span>
                                </button>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg flex items-center gap-3 text-left"
                                >
                                    <Upload className="w-5 h-5" />
                                    <span className="font-medium">Upload Image</span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                <div className="pt-2">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Shapes</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {SHAPES.map((shape) => {
                                            const ShapeIcon = shape.component;
                                            return (
                                                <button
                                                    key={shape.name}
                                                    onClick={() => addShape(shape.name)}
                                                    className="p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center"
                                                >
                                                    <ShapeIcon className="w-6 h-6" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Canvas Background */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Canvas</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={transparentBg}
                                        onChange={(e) => setTransparentBg(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm">Transparent Background</span>
                                </label>
                                {!transparentBg && (
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Background Color</p>
                                        <div className="grid grid-cols-6 gap-2">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setCanvasColor(color)}
                                                    className={`w-8 h-8 rounded-lg border-2 ${canvasColor === color ? 'border-blue-500' : 'border-gray-200 dark:border-gray-600'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Layers */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Layers
                            </h3>
                            <div className="space-y-1">
                                {[...elements].sort((a, b) => b.zIndex - a.zIndex).map((element) => (
                                    <div
                                        key={element.id}
                                        onClick={() => setSelectedElement(element.id)}
                                        className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between ${selectedElement === element.id ? 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        <span className="text-sm truncate">
                                            {element.type === 'text' ? element.content : element.type === 'image' ? 'Image' : element.content}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateElement(element.id, { locked: !element.locked });
                                            }}
                                            className="p-1"
                                        >
                                            {element.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas Container (Scrollable) */}
                <div
                    ref={canvasContainerRef}
                    className="flex-1 h-full  overflow-auto p-8 flex items-center justify-center relative"
                >
                    {/* Right Sidebar - Applied responsive width: w-64 on smaller screens, w-72 on medium and larger */}
                    {selected && (
                        <div className="w-64 md:w-72 min-w-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 fixed right-0 top-[70px] h-full z-50 overflow-y-auto">
                            <div className="p-4 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Properties</h3>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={duplicateElement}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                            title="Duplicate"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={deleteElement}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg text-red-600 dark:text-red-400"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 block">Color</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => {
                                                    updateElement(selected.id, { color });
                                                    addToHistory(elements);
                                                }}
                                                className={`w-8 h-8 rounded-lg border-2 ${selected.color === color ? 'border-blue-500' : 'border-gray-200 dark:border-gray-600'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Text Properties */}
                                {selected.type === 'text' && (
                                    <>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 block">
                                                Font Size: {selected.fontSize}px
                                            </label>
                                            <input
                                                type="range"
                                                min="12"
                                                max="120"
                                                value={selected.fontSize}
                                                onChange={(e) => updateElement(selected.id, { fontSize: Number(e.target.value) })}
                                                onMouseUp={() => addToHistory(elements)}
                                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 block">Style</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        updateElement(selected.id, {
                                                            fontWeight: selected.fontWeight === 'bold' ? 'normal' : 'bold'
                                                        });
                                                        addToHistory(elements);
                                                    }}
                                                    className={`px-3 py-2 rounded-lg transition-colors ${selected.fontWeight === 'bold' ? 'bg-blue-500 text-white dark:bg-blue-600' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        }`}
                                                >
                                                    <Bold className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        updateElement(selected.id, {
                                                            fontStyle: selected.fontStyle === 'italic' ? 'normal' : 'italic'
                                                        });
                                                        addToHistory(elements);
                                                    }}
                                                    className={`px-3 py-2 rounded-lg transition-colors ${selected.fontStyle === 'italic' ? 'bg-blue-500 text-white dark:bg-blue-600' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        }`}
                                                >
                                                    <Italic className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 block">Alignment</label>
                                            <div className="flex gap-2">
                                                {['left', 'center', 'right'].map((align) => (
                                                    <button
                                                        key={align}
                                                        onClick={() => {
                                                            updateElement(selected.id, { textAlign: align });
                                                            addToHistory(elements);
                                                        }}
                                                        className={`px-3 py-2 rounded-lg transition-colors ${selected.textAlign === align ? 'bg-blue-500 text-white dark:bg-blue-600' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                            }`}
                                                    >
                                                        {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                                        {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                                        {align === 'right' && <AlignRight className="w-4 h-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Size */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 block">
                                        Size: {Math.round(selected.width)} × {Math.round(selected.height)}
                                    </label>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">Width</label>
                                            <input
                                                type="range"
                                                min="20"
                                                max={canvasWidth}
                                                value={selected.width}
                                                onChange={(e) => updateElement(selected.id, { width: Number(e.target.value) })}
                                                onMouseUp={() => addToHistory(elements)}
                                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">Height</label>
                                            <input
                                                type="range"
                                                min="20"
                                                max={canvasHeight}
                                                value={selected.height}
                                                onChange={(e) => updateElement(selected.id, { height: Number(e.target.value) })}
                                                onMouseUp={() => addToHistory(elements)}
                                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Rotation */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 block">
                                        Rotation: {selected.rotation}°
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={selected.rotation}
                                        onChange={(e) => updateElement(selected.id, { rotation: Number(e.target.value) })}
                                        onMouseUp={() => addToHistory(elements)}
                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
                                    />
                                </div>

                                {/* Layer Z-Index (Simplified Up/Down) */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 block">Layer</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const newZIndex = Math.max(0, selected.zIndex - 1);
                                                updateElement(selected.id, { zIndex: newZIndex });
                                                addToHistory(elements);
                                            }}
                                            disabled={selected.zIndex === 0}
                                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm disabled:opacity-50"
                                        >
                                            <Layers className="w-4 h-4 transform rotate-180" /> Back
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newZIndex = selected.zIndex + 1;
                                                updateElement(selected.id, { zIndex: newZIndex });
                                                addToHistory(elements);
                                            }}
                                            disabled={selected.zIndex === elements.length - 1}
                                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm disabled:opacity-50"
                                        >
                                            <Layers className="w-4 h-4" /> Front
                                        </button>
                                    </div>
                                </div>

                                {/* Download Options */}
                                <div className="border-t dark:border-gray-700 pt-4">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3 block">Export Options</label>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => downloadCanvas(true)}
                                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            With Background
                                        </button>
                                        <button
                                            onClick={() => downloadCanvas(false)}
                                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Without Background
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div
                        ref={canvasRef}
                        className="relative shadow-2xl transition-all duration-200 ease-out"
                        style={{
                            width: `${canvasWidth}px`,
                            height: `${canvasHeight}px`,
                            // Corrected logic: background is 'transparent' for transparency, or a solid color otherwise.
                            backgroundColor: transparentBg ? 'transparent' : canvasColor,
                            // Checkerboard pattern is ONLY applied if transparentBg is true.
                            backgroundImage: transparentBg ? checkerboardPattern : 'none',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 10px 10px',
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'center',
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={() => setSelectedElement(null)} // Deselect when clicking canvas background
                    >
                        {elements.map((element) => {
                            const ShapeIcon = SHAPES.find(s => s.name === element.content)?.component;
                            return (
                                <div
                                    key={element.id}
                                    // Stop propagation to prevent canvas click from deselecting
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute cursor-move group transition-shadow duration-150 ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
                                    style={{
                                        left: `${element.x}px`,
                                        top: `${element.y}px`,
                                        width: `${element.width}px`,
                                        height: `${element.height}px`,
                                        transform: `rotate(${element.rotation}deg)`,
                                        zIndex: element.zIndex,
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                                >
                                    {element.type === 'text' ? (
                                        <div
                                            contentEditable={selectedElement === element.id && !element.locked}
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                updateElement(element.id, { content: e.currentTarget.textContent || '' });
                                                addToHistory(elements);
                                            }}
                                            className="w-full h-full flex items-center justify-center outline-none whitespace-pre-wrap break-words"
                                            style={{
                                                fontSize: `${element.fontSize}px`,
                                                fontWeight: element.fontWeight,
                                                fontStyle: element.fontStyle,
                                                textAlign: element.textAlign as any,
                                                color: element.color,
                                                // Prevent text selection when dragging starts
                                                userSelect: isDragging ? 'none' : 'auto',
                                            }}
                                        >
                                            {element.content}
                                        </div>
                                    ) : element.type === 'image' && element.imageData ? (
                                        <img
                                            src={element.imageData}
                                            alt="Uploaded"
                                            className="w-full h-full object-contain pointer-events-none"
                                        />
                                    ) : ShapeIcon ? (
                                        // Ensure shapes fill their bounding box
                                        <ShapeIcon className="w-full h-full" style={{ color: element.color }} />
                                    ) : null}

                                    {/* Resize Handle */}
                                    {selectedElement === element.id && !element.locked && (
                                        <div
                                            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded-full cursor-se-resize shadow-md"
                                            onMouseDown={(e) => handleResizeStart(e, element.id)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>


            </div>
        </div>
    );
};

export default LogoMaker;