"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useImageEditor } from "./ImageEditorContext";
import SingleImageEditor from "./SingleImageEditor";
import ModalLoading from "./ModalLoading";
import ExportOptionsPanel, { defaultExportOptions } from "./ExportOptionsPanel";
import { exportAsZip } from "../lib/utils/export";
import { ExportOptions } from "../lib/types/watermark";
import { HiOutlineFolderDownload } from "react-icons/hi";
import { IoImage } from "react-icons/io5";
import {
  Settings2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Grid2x2,
  Rows3,
} from "lucide-react";
import { useTemplateActions } from "./hooks/useTemplateActions";
import BatchActions from "./BatchActions";
import { useImageKeyNav } from "./hooks/useImageKeyNav";
import { useInView } from "../lib/hooks/useInView";
import { useAuth } from "@/lib/auth/AuthContext";
import { logActivity } from "@/lib/firebase/firebase.actions.firestore/offlineLogger";

type GridSize = 1 | 2 | 3;

interface LazyImageCardProps {
  metadata: any;
  image: any;
  index: number;
  onCanvasReady: (
    index: number,
    getBlobFunc: () => Promise<Blob | null>,
    canvas: HTMLCanvasElement,
  ) => void;
  exportOptions: ExportOptions;
  isSelected: boolean;
  isDragOver: boolean;
  dragFromIndex: React.MutableRefObject<number | null>;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
  cardRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  forceLoad?: boolean;
}

const LazyImageCard = React.memo(
  ({
    metadata,
    image,
    index,
    onCanvasReady,
    exportOptions,
    isSelected,
    isDragOver,
    dragFromIndex,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onClick,
    cardRefs,
    forceLoad = false,
  }: LazyImageCardProps) => {
    const { ref, inView } = useInView("300px");
    const shouldRender = inView || forceLoad;

    return (
      <div
        ref={(el) => {
          (ref as any).current = el;
          if (el) cardRefs.current.set(index, el);
          else cardRefs.current.delete(index);
        }}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={`relative rounded-xl overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing h-fit
                ${
                  isSelected
                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-xl"
                    : "ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-indigo-300 dark:hover:ring-indigo-700 shadow-md hover:shadow-lg"
                }
                ${isDragOver ? "ring-2 ring-dashed ring-indigo-400 scale-[1.02] bg-indigo-50 dark:bg-indigo-900/20" : ""}
            `}
      >
        {isDragOver &&
          dragFromIndex.current !== null &&
          dragFromIndex.current > index && (
            <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500 rounded-t-xl z-30" />
          )}

        {shouldRender ? (
          <SingleImageEditor
            metadata={metadata}
            image={image}
            index={index}
            onCanvasReady={onCanvasReady}
            exportOptions={exportOptions}
          />
        ) : (
          <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl flex items-center justify-center">
            <IoImage className="text-3xl text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {isDragOver &&
          dragFromIndex.current !== null &&
          dragFromIndex.current < index && (
            <div className="absolute bottom-0 inset-x-0 h-1 bg-indigo-500 rounded-b-xl z-30" />
          )}

        <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full">
            <span className="text-white text-[10px] font-medium">
              ⠿ drag to reorder
            </span>
          </div>
        </div>
      </div>
    );
  },
);

LazyImageCard.displayName = "LazyImageCard";

const gridCols: Record<GridSize, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

export default function PreviewArea({ metadata }: { metadata: any }) {
  const {
    images,
    selectedImageIndex,
    setSelectedImageIndex,
    reorderImages,
    selectedImages,
  } = useImageEditor();

  const [processing, setProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [fileName, setFileName] = useState("watermarked_images");
  const [exportOptions, setExportOptions] =
    useState<ExportOptions>(defaultExportOptions);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [gridSize, setGridSize] = useState<GridSize>(
    typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 3,
  );
  const [forceLoadAll, setForceLoadAll] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<string | null>(null);

  const dragFromIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useImageKeyNav(
    images.length,
    selectedImageIndex,
    setSelectedImageIndex,
    gridSize,
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const imageBlobGetters = useRef<Map<number, () => Promise<Blob | null>>>(
    new Map(),
  );
  const imageCanvases = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const { saveTemplate } = useTemplateActions();

  const { user } = useAuth();

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    if (images.length === 0) {
      setEstimatedSize(null);
      return;
    }
    const timer = setTimeout(() => {
      const canvases = imageCanvases.current;
      if (canvases.size === 0) {
        const totalBytes = images.reduce(
          (sum, img) => sum + (img.file.size ?? 0),
          0,
        );
        setEstimatedSize(`${formatBytes(totalBytes)}`);
        return;
      }
      const qualityFactor =
        exportOptions.format === "png"
          ? 3.5
          : exportOptions.format === "webp"
            ? (exportOptions.quality / 100) * 0.5
            : (exportOptions.quality / 100) * 1.2;
      let totalEstimate = 0;
      canvases.forEach((canvas) => {
        const pixels =
          canvas.width *
          canvas.height *
          exportOptions.scale *
          exportOptions.scale;
        totalEstimate += pixels * qualityFactor;
      });
      if (canvases.size < images.length) {
        const avg = totalEstimate / canvases.size;
        totalEstimate += avg * (images.length - canvases.size);
      }
      setEstimatedSize(`${formatBytes(totalEstimate)}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [
    images.length,
    exportOptions.format,
    exportOptions.quality,
    exportOptions.scale,
  ]);

  useEffect(() => {
    if (selectedImageIndex === null) return;
    const card = cardRefs.current.get(selectedImageIndex);
    if (!card) return;
    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [selectedImageIndex]);

  const handleCanvasReady = useCallback(
    (
      index: number,
      getBlobFunc: () => Promise<Blob | null>,
      canvas: HTMLCanvasElement,
    ) => {
      imageBlobGetters.current.set(index, getBlobFunc);
      imageCanvases.current.set(index, canvas);
    },
    [],
  );

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragFromIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
    const canvas = imageCanvases.current.get(index);
    if (canvas) e.dataTransfer.setDragImage(canvas, canvas.offsetWidth / 2, 40);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      if (dragFromIndex.current !== null && dragFromIndex.current !== toIndex) {
        reorderImages(dragFromIndex.current, toIndex);
      }
      dragFromIndex.current = null;
      setDragOverIndex(null);
    },
    [reorderImages],
  );

  const handleDragEnd = useCallback(() => {
    dragFromIndex.current = null;
    setDragOverIndex(null);
  }, []);

  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickedIndexRef = useRef<number | null>(null);

  const handleSelectImage = useCallback(
    (index: number) => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        if (lastClickedIndexRef.current === index) {
          setSelectedImageIndex(null);
          lastClickedIndexRef.current = null;
          return;
        }
      }
      setSelectedImageIndex(index);
      lastClickedIndexRef.current = index;
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        lastClickedIndexRef.current = null;
      }, 300);
    },
    [setSelectedImageIndex],
  );

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const current = new Set(images.map((_, i) => i));
    Array.from(imageBlobGetters.current.keys()).forEach((i) => {
      if (!current.has(i)) {
        imageBlobGetters.current.delete(i);
        imageCanvases.current.delete(i);
        cardRefs.current.delete(i);
      }
    });
  }, [images.length]);

  const cardHandlers = useRef<
    Map<
      number,
      {
        onDragStart: (e: React.DragEvent) => void;
        onDragOver: (e: React.DragEvent) => void;
        onDrop: (e: React.DragEvent) => void;
        onClick: () => void;
      }
    >
  >(new Map());

  const getCardHandlers = useCallback(
    (index: number) => {
      if (!cardHandlers.current.has(index)) {
        cardHandlers.current.set(index, {
          onDragStart: (e: React.DragEvent) => handleDragStart(e, index),
          onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
          onDrop: (e: React.DragEvent) => handleDrop(e, index),
          onClick: () => handleSelectImage(index),
        });
      }
      return cardHandlers.current.get(index)!;
    },
    [handleDragStart, handleDragOver, handleDrop, handleSelectImage],
  );

  const waitForAllCanvases = useCallback(
    (
      total: number,
      signal: AbortSignal,
      onTick: (ready: number) => void,
    ): Promise<void> => {
      return new Promise((resolve, reject) => {
        const check = () => {
          if (signal.aborted) return reject(new Error("aborted"));
          const ready = imageBlobGetters.current.size;
          onTick(ready);
          if (ready >= total) return resolve();
          setTimeout(check, 100);
        };
        check();
      });
    },
    [],
  );

  const downloadAll = async () => {
    saveTemplate();
    if (images.length === 0) return;
    setProcessing(true);
    setDownloadProgress(0);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      if (imageBlobGetters.current.size < images.length) {
        setForceLoadAll(true);
        await Promise.race([
          waitForAllCanvases(images.length, signal, (ready) =>
            setDownloadProgress(Math.round((ready / images.length) * 40)),
          ),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("Timeout")), 30_000),
          ),
        ]);
      }
      if (signal.aborted) return;
      await exportAsZip(
        imageBlobGetters.current,
        images.map((img) => img.file.name),
        fileName.replace(/\./g, " ") || "watermarked_images",
        exportOptions,
        imageCanvases.current,
        metadata,
        (percent) => setDownloadProgress(40 + Math.round(percent * 0.6)),
        signal,
      );
      if (!user) return;

      await logActivity({
        userName: user.displayName ?? "Unknown",
        userEmail: user.email ?? "unknown@email.com",
        function: `downloadZIP_allImages_${images.length}`,
        urlPath: "/Edit/Watermarkv5",
      });
    } catch (err: any) {
      if (err?.message !== "aborted") console.error("Export error:", err);
    } finally {
      setForceLoadAll(false);
      setProcessing(false);
      setDownloadProgress(0);
      abortControllerRef.current = null;
    }
  };

  const downloadSelected = async () => {
    if (selectedImages.length === 0) return;
    if (selectedImages.length === 1) {
      const index = selectedImages[0];
      const canvas = imageCanvases.current.get(index);
      const image = images[index];
      if (!canvas || !image) return;
      const mimeType = `image/${exportOptions.format}`;
      const quality =
        exportOptions.format === "png" ? 1 : exportOptions.quality / 100;
      let exportCanvas = canvas;
      if (exportOptions.scale !== 1) {
        exportCanvas = document.createElement("canvas");
        exportCanvas.width = Math.round(canvas.width * exportOptions.scale);
        exportCanvas.height = Math.round(canvas.height * exportOptions.scale);
        const ctx = exportCanvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
        }
      }
      exportCanvas.toBlob(
        (blob) => {
          if (!blob) return;
          const baseName = image.file.name.replace(/\.[^/.]+$/, "");
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `${baseName}_watermarked.${exportOptions.format}`;
          link.click();
          URL.revokeObjectURL(link.href);
        },
        mimeType,
        quality,
      );

      if (!user) return;

      await logActivity({
        userName: user.displayName ?? "Unknown",
        userEmail: user.email ?? "unknown@email.com",
        function: `downloadZIP_selectedImages_${selectedImages.length}`,
        urlPath: "/Edit/Watermarkv5",
      });

      return;
    }
    setProcessing(true);
    setDownloadProgress(0);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      const selectedBlobGetters = new Map<number, () => Promise<Blob | null>>();
      const selectedCanvases = new Map<number, HTMLCanvasElement>();
      selectedImages.forEach((index) => {
        const getter = imageBlobGetters.current.get(index);
        const canvas = imageCanvases.current.get(index);
        if (getter) selectedBlobGetters.set(index, getter);
        if (canvas) selectedCanvases.set(index, canvas);
      });
      await exportAsZip(
        selectedBlobGetters,
        images.map((img) => img.file.name),
        `${fileName || "watermarked_images"}_selected`,
        exportOptions,
        selectedCanvases,
        metadata,
        (percent) => setDownloadProgress(percent),
        signal,
      );
    } catch (err) {
      console.error("Selected export error:", err);
    } finally {
      setProcessing(false);
      setDownloadProgress(0);
      abortControllerRef.current = null;
    }
  };

  const cancelDownload = () => {
    abortControllerRef.current?.abort();
    setForceLoadAll(false);
    setProcessing(false);
    setDownloadProgress(0);
  };

  return (
    <div className="space-y-4 p-3 sm:p-6 w-full min-h-screen">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
          Image Previews
          {images.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold
                            bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              <IoImage size={16} />
              {selectedImageIndex !== null ? (
                <>
                  {selectedImageIndex + 1} <span className="opacity-50">/</span>{" "}
                  {images.length}
                </>
              ) : (
                images.length
              )}
            </span>
          )}
        </h2>

        {images.length > 0 && (
          <div
            className="hidden lg:flex items-center gap-1 p-1
                        bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            {([1, 2, 3] as GridSize[]).map((size) => {
              const Icon =
                size === 1 ? Rows3 : size === 2 ? Grid2x2 : LayoutGrid;
              return (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  title={`${size} column${size !== 1 ? "s" : ""}`}
                  className={`p-1.5 rounded-md transition-colors ${
                    gridSize === size
                      ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky toolbar */}
      {images.length > 0 && (
        <div
          className="sticky lg:top-4 top-[70px] z-30
                    bg-white/90 dark:bg-gray-900/90 backdrop-blur
                    border border-gray-200 dark:border-gray-700
                    rounded-xl shadow-md py-3 px-3 sm:py-4 sm:px-4 space-y-3"
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-[110px] sm:min-w-[160px]">
              <input
                type="text"
                placeholder="File name"
                value={fileName}
                maxLength={256}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 pl-10 sm:pl-12 py-2 text-sm
                                    border border-gray-300 dark:border-gray-600 rounded-lg
                                    bg-white dark:bg-gray-800
                                    text-gray-900 dark:text-white
                                    placeholder-gray-400 dark:placeholder-gray-500
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] italic text-gray-400 border-r border-gray-300 dark:border-gray-600 pr-1.5">
                {fileName.length}/256
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-bold px-2 py-1 rounded
                                bg-indigo-100 text-indigo-700
                                dark:bg-indigo-900/40 dark:text-indigo-300 uppercase"
              >
                .{exportOptions.format}
              </span>
              {exportOptions.scale !== 1 && (
                <span
                  className="text-xs font-bold px-2 py-1 rounded
                                    bg-purple-100 text-purple-700
                                    dark:bg-purple-900/40 dark:text-purple-300"
                >
                  {exportOptions.scale}×
                </span>
              )}
            </div>

            <button
              onClick={() => setShowExportPanel((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm font-medium rounded-lg transition-colors
                                bg-white border border-gray-300 hover:bg-gray-50 text-gray-700
                                dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              {showExportPanel ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={downloadAll}
              disabled={processing}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow transition-all hover:scale-105 text-sm relative"
            >
              <HiOutlineFolderDownload className="text-lg flex-shrink-0" />
              <span>ZIP</span>
              {estimatedSize && (
                <span className="hidden sm:inline text-[10px] font-normal opacity-75 ml-0.5">
                  ~{estimatedSize}
                </span>
              )}
            </button>
          </div>

          {showExportPanel && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <ExportOptionsPanel
                options={exportOptions}
                onChange={setExportOptions}
              />
            </div>
          )}
        </div>
      )}

      <BatchActions onDownloadSelected={downloadSelected} />

      {/* Image grid / empty state */}
      {images.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 text-center
                    bg-white dark:bg-gray-800
                    rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700"
        >
          <IoImage className="text-5xl text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
            No images yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Upload images using the panel on the left
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <span>⠿</span>
            Drag cards to reorder · Double-click to deselect · ← → arrow keys to
            navigate
          </p>

          <div className={`grid ${gridCols[gridSize]} gap-6`}>
            {images.map((image, index) => {
              const handlers = getCardHandlers(index);
              return (
                <LazyImageCard
                  metadata={metadata}
                  key={index}
                  image={image}
                  index={index}
                  onCanvasReady={handleCanvasReady}
                  exportOptions={exportOptions}
                  isSelected={selectedImageIndex === index}
                  isDragOver={
                    dragOverIndex === index && dragFromIndex.current !== index
                  }
                  dragFromIndex={dragFromIndex}
                  onDragStart={handlers.onDragStart}
                  onDragOver={handlers.onDragOver}
                  onDrop={handlers.onDrop}
                  onDragEnd={handleDragEnd}
                  onClick={handlers.onClick}
                  cardRefs={cardRefs}
                  forceLoad={forceLoadAll}
                />
              );
            })}
          </div>
        </>
      )}

      <ModalLoading
        open={processing}
        cancelProcess={cancelDownload}
        progress={downloadProgress}
        totalImages={images.length}
      />
    </div>
  );
}
