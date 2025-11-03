import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ExportOptions } from "../types/watermark";

export const exportSingleImage = async (
  canvas: HTMLCanvasElement,
  filename: string,
  options: ExportOptions
): Promise<void> => {
  const mimeType = `image/${options.format}`;
  const quality = options.quality / 100;

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, `${filename}.${options.format}`);
        }
        resolve();
      },
      mimeType,
      quality
    );
  });
};

export const exportAsZip = async (
  getBlobFuncs: Map<number, () => Promise<Blob | null>>,
  filename: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const zip = new JSZip();
  const folder = zip.folder(filename);
  const total = getBlobFuncs.size;
  let current = 0;

  for (const [index, getBlob] of getBlobFuncs.entries()) {
    const blob = await getBlob();
    if (blob) {
      folder?.file(`image_${index + 1}.png`, blob);
      current++;
      onProgress?.(current, total);
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${filename}.zip`);
};

export const generateThumbnail = (
  canvas: HTMLCanvasElement,
  maxWidth: number = 200,
  maxHeight: number = 200
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
