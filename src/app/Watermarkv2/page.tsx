"use client";

import React, { useRef, useState, useEffect, useCallback, FC } from "react";

interface ProcessedImageData {
  src: string;
  name: string;
}

const App: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImages, setOriginalImages] = useState<File[]>([]);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [footerImage, setFooterImage] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [processedImagesData, setProcessedImagesData] = useState<ProcessedImageData[]>([]);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [footerSize, setFooterSize] = useState({ width: 300, height: 80 });
  const [footerOptions, setFooterOptions] = useState({ opacity: 0.8 });
  const [logoSize, setLogoSize] = useState([{ height: 100, width: 100 }]);
  const [logoPosition, setLogoPosition] = useState<
    "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
  >("top-left");
  const [footerOffsetX, setFooterOffsetX] = useState(0);

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const processAndGeneratePreviews = useCallback(async () => {
    setStatusMessage("Processing image(s)...");
    setProcessedImagesData([]);
    setMergedImage(null);

    if (originalImages.length === 0) {
      setStatusMessage("Please upload one or more base images.");
      return;
    }

    try {
      let logoImgLoaded: HTMLImageElement | null = null;
      let footerImgLoaded: HTMLImageElement | null = null;

      if (logoImage) {
        const logoImageUrl = URL.createObjectURL(logoImage);
        logoImgLoaded = await loadImage(logoImageUrl);
        URL.revokeObjectURL(logoImageUrl);
      }

      if (footerImage) {
        const footerImageUrl = URL.createObjectURL(footerImage);
        footerImgLoaded = await loadImage(footerImageUrl);
        URL.revokeObjectURL(footerImageUrl);
      }

      const newProcessedData: ProcessedImageData[] = [];

      for (const file of originalImages) {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) continue;

        const originalImageUrl = URL.createObjectURL(file);
        // ✅ Assuming baseImg is already defined inside your for-loop
        const baseImg = await loadImage(originalImageUrl);
        URL.revokeObjectURL(originalImageUrl);

        // Set canvas size
        tempCanvas.width = baseImg.width;
        tempCanvas.height = baseImg.height;
        tempCtx.drawImage(baseImg, 0, 0);

        // ✅ Enforce max footer width: no more than 2x base image width
        const maxFooterWidth = baseImg.width * 2;
        const footerWidth = Math.min(footerSize.width, maxFooterWidth);
        const footerHeight = footerSize.height;

        // ✅ Center footer horizontally with offset
        const footerX = (tempCanvas.width - footerWidth) / 2 + footerOffsetX;
        const footerY = tempCanvas.height - footerHeight;

        // ✅ Draw footer image
        if (footerImgLoaded) {
          tempCtx.save();
          tempCtx.globalAlpha = footerOptions.opacity;
          tempCtx.drawImage(footerImgLoaded, footerX, footerY, footerWidth, footerHeight);
          tempCtx.restore();
        }
        else {
          const footerHeight = Math.max(50, tempCanvas.height * 0.1);
          const footerY = tempCanvas.height - footerHeight;
          tempCtx.fillStyle = "rgba(0, 0, 0, 0.6)";
          tempCtx.fillRect(0, footerY, tempCanvas.width, footerHeight);
          tempCtx.fillStyle = "#fff";
          tempCtx.textAlign = "center";
          tempCtx.textBaseline = "middle";
          tempCtx.font = `${Math.max(16, footerHeight * 0.4)}px sans-serif`;
          tempCtx.fillText("Your Awesome Graphic Footer", tempCanvas.width / 2, footerY + footerHeight / 2);
        }

        const dataUrl = tempCanvas.toDataURL("image/png", 1.0);
        newProcessedData.push({
          src: dataUrl,
          name: file.name.replace(/\.[^/.]+$/, "") + "_processed.png",
        });

        if (originalImages.length === 1) setMergedImage(dataUrl);
      }

      setProcessedImagesData(newProcessedData);
      setStatusMessage(`Processed ${newProcessedData.length} image(s) successfully!`);
    } catch (error: any) {
      console.error("Error in processing:", error);
      setStatusMessage(`Error: ${error.message}`);
    }
  }, [originalImages, logoImage, footerImage, footerOptions, logoSize, logoPosition, footerOffsetX, footerSize, loadImage]);

  useEffect(() => {
    if (originalImages.length > 0) {
      processAndGeneratePreviews();
    } else {
      setProcessedImagesData([]);
      setMergedImage(null);
      setStatusMessage("");
    }
  }, [originalImages, logoImage, footerImage, footerOptions, logoSize, logoPosition, footerOffsetX, footerSize]);

  const handleFooterOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "opacity") {
      setFooterOptions((prev) => ({ ...prev, opacity: parseFloat(value) }));
    } else {
      setFooterSize((prev) => ({ ...prev, [name]: parseInt(value) }));
    }
  };

  const onChange = (key: string, value: string) =>
    setLogoSize([{ ...logoSize[0], [key]: +value }]);

  const handleDownloadAll = () => {
    if (processedImagesData.length === 0) return;
    processedImagesData.forEach((imgData, index) => {
      setTimeout(() => {
        handleIndividualDownload(imgData.src, imgData.name);
      }, index * 200);
    });
    setStatusMessage("Downloading all processed images...");
  };

  const handleIndividualDownload = (src: string, name: string) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    setOriginalImages(imageFiles);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) setLogoImage(file);
  };

  const handleFooterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) setFooterImage(file);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center font-inter">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl border border-gray-200">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Image Watermarker & Footer
        </h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Base Image Upload */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Upload Base Image(s):</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Logo Upload */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Upload Logo (Optional):</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {logoImage && (
              <div className="mt-2 space-y-2 text-xs text-gray-500">
                <p>Selected: {logoImage.name}</p>
                <div className="flex gap-2">
                  Size:
                  <input type="number" min={0} placeholder="Width" className="w-[60px] p-1 border rounded" onChange={(e) => onChange("width", e.target.value)} />
                  x
                  <input type="number" min={0} placeholder="Height" className="w-[60px] p-1 border rounded" onChange={(e) => onChange("height", e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  Position:
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value as any)}
                    className="p-1 border rounded"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer Upload */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Upload Footer (Optional):</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFooterUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
          </div>
        </div>

        {/* Footer Controls */}
        {footerImage && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Footer Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Opacity: {footerOptions.opacity.toFixed(1)}</label>
                <input
                  type="range"
                  name="opacity"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={footerOptions.opacity}
                  onChange={handleFooterOptionChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Footer Width (px): {footerSize.width}</label>
                <input
                  type="range"
                  name="width"
                  min="50"
                  max="1000"
                  step="10"
                  value={footerSize.width}
                  onChange={handleFooterOptionChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Footer Height (px): {footerSize.height}</label>
                <input
                  type="range"
                  name="height"
                  min="10"
                  max="500"
                  step="5"
                  value={footerSize.height}
                  onChange={handleFooterOptionChange}
                  className="w-full"
                />
              </div>



              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Footer X Offset: {footerOffsetX}px</label>
                <input
                  type="range"
                  min={-200}
                  max={200}
                  value={footerOffsetX}
                  onChange={(e) => setFooterOffsetX(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <p className="text-center text-sm mb-6 text-gray-600 bg-gray-50 p-2 rounded">{statusMessage}</p>
        )}

        {/* Preview Section */}
        <div className="mb-8 border border-gray-300 rounded-lg overflow-hidden shadow-inner flex flex-wrap justify-center items-center bg-gray-50 max-h-[500px] p-4 gap-4 overflow-y-auto">
          {processedImagesData.length > 0 ? (
            processedImagesData.map((imgData, index) => (
              <div
                key={index}
                className="relative group border border-gray-200 rounded-lg overflow-hidden shadow-md bg-white p-2 flex flex-col items-center max-w-[600px]"
              >
                <img
                  src={imgData.src}
                  alt={`Processed Image ${index + 1}`}
                  className="max-w-full h-auto max-h-48 object-contain rounded"
                />
                <p className="text-xs text-gray-600 mt-2 truncate w-full px-1 text-center">
                  {imgData.name.replace("_processed.png", "")}
                </p>
                <button
                  onClick={() => handleIndividualDownload(imgData.src, imgData.name)}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Download
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400">Your processed image(s) will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
