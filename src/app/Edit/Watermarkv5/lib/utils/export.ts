import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ExportOptions } from "../types/watermark";
import { injectMetadataIntoBlob } from "./metadata";
import { ImageMetadata } from "../../components/Metadatainjector";

export const exportSingleImage = async (
  canvas: HTMLCanvasElement,
  filename: string,
  options: ExportOptions,
): Promise<void> => {
  const mimeType = `image/${options.format}`;
  const quality = options.quality / 100;

  const exportCanvas = applyScale(canvas, options.scale);

  return new Promise((resolve) => {
    exportCanvas.toBlob(
      (blob) => {
        if (blob) saveAs(blob, `${filename}.${options.format}`);
        resolve();
      },
      mimeType,
      quality,
    );
  });
};

export const exportAsZip = async (
  getBlobFuncs: Map<number, () => Promise<Blob | null>>,
  filenames: string[],
  zipName: string,
  options: ExportOptions,
  canvases: Map<number, HTMLCanvasElement>,
  metadata: ImageMetadata,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<void> => {
  const compressionLevels: Record<ExportOptions["compression"], number> = {
    none: 0,
    low: 3,
    medium: 6,
    high: 9,
  };

  const zip = new JSZip();
  const folder = zip.folder(zipName);
  const total = getBlobFuncs.size;
  let current = 0;
  const mimeType = `image/${options.format}`;
  const quality = options.quality / 100;

  for (const [index, getBlob] of getBlobFuncs.entries()) {
    if (signal?.aborted) return;

    const canvas = canvases.get(index);
    let blob: Blob | null = null;

    if (canvas && (options.scale !== 1 || options.format !== "png")) {
      const exportCanvas = applyScale(canvas, options.scale);
      blob = await new Promise<Blob | null>((resolve) =>
        exportCanvas.toBlob(resolve, mimeType, quality),
      );
    } else {
      blob = await getBlob();
    }

    if (signal?.aborted) return;

    if (blob && metadata?.enabled) {
      blob = await injectMetadataIntoBlob(blob, metadata, options.format);
    }

    if (blob) {
      const baseName = filenames[index]
        ? filenames[index].replace(/\.[^/.]+$/, "")
        : `image_${index + 1}`;

      const metaSuffix = options.includeMetadata ? `_orig-${baseName}` : "";
      folder?.file(
        `${baseName}_watermarked${metaSuffix}.${options.format}`,
        blob,
        {
          compression: options.compression === "none" ? "STORE" : "DEFLATE",
          compressionOptions: { level: compressionLevels[options.compression] },
        },
      );
    }

    // Always increment and report progress, even if blob was null
    current++;
    onProgress?.(Math.round((current / total) * 100));
  }

  if (signal?.aborted) return;
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${zipName}.zip`);
};

function applyScale(
  source: HTMLCanvasElement,
  scale: number,
): HTMLCanvasElement {
  if (scale === 1) return source;
  const out = document.createElement("canvas");
  out.width = Math.round(source.width * scale);
  out.height = Math.round(source.height * scale);
  const ctx = out.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, out.width, out.height);
  }
  return out;
}

export const generateThumbnail = (
  canvas: HTMLCanvasElement,
  maxWidth = 200,
  maxHeight = 200,
): Promise<string> => {
  return new Promise((resolve) => {
    const thumbCanvas = document.createElement("canvas");
    const ctx = thumbCanvas.getContext("2d");
    if (!ctx) {
      resolve("");
      return;
    }
    const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    thumbCanvas.width = canvas.width * scale;
    thumbCanvas.height = canvas.height * scale;
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    resolve(thumbCanvas.toDataURL("image/jpeg", 0.7));
  });
};
