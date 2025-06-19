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
  const [processedImagesData, setProcessedImagesData] = useState<
    ProcessedImageData[]
  >([]);
  const [footerOptions, setFooterOptions] = useState({
    opacity: 0.8,
    heightPercentage: 30, // Default height percentage
    minHeight: 80, // Minimum height in pixels
  });
  const [mergedImage, setMergedImage] = useState<string | null>(null);

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => {
        console.error("Image loading error:", err);
        reject(new Error(`Failed to load image from ${src}`));
      };
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

      // Load logo if provided
      if (logoImage) {
        try {
          const logoImageUrl = URL.createObjectURL(logoImage);
          logoImgLoaded = await loadImage(logoImageUrl);
          URL.revokeObjectURL(logoImageUrl);
        } catch (err) {
          console.error("Error loading logo:", err);
        }
      }

      // Load footer if provided
      if (footerImage) {
        try {
          const footerImageUrl = URL.createObjectURL(footerImage);
          footerImgLoaded = await loadImage(footerImageUrl);
          URL.revokeObjectURL(footerImageUrl);
          console.log("Footer image loaded successfully");
        } catch (err) {
          console.error("Error loading footer:", err);
        }
      }

      const newProcessedData: ProcessedImageData[] = [];

      for (const file of originalImages) {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        if (!tempCtx) {
          console.error("Could not get 2D context for canvas");
          continue;
        }

        try {
          const originalImageUrl = URL.createObjectURL(file);
          const baseImg = await loadImage(originalImageUrl);
          URL.revokeObjectURL(originalImageUrl);

          tempCanvas.width = baseImg.width;
          tempCanvas.height = baseImg.height;
          tempCtx.drawImage(baseImg, 0, 0);

          // Draw logo if available
          if (logoImgLoaded) {
            const logoWidth = 190;
            const logoHeight = 140;

            tempCtx.drawImage(
              logoImgLoaded,
              20, // x
              20, // y
              logoWidth,
              logoHeight
            );
          }

          // Draw footer if available
          if (footerImgLoaded) {
            // Calculate footer height based on percentage of image height
            const footerHeight = Math.max(
              70, // Minimum height in pixels
              (tempCanvas.height * footerOptions.heightPercentage) / 15 // Percentage of image height
            );

            const footerY = tempCanvas.height - footerHeight;
            const footerWidth = tempCanvas.width;
            let isPortrait = false;

            const alternative_width = 70;

            if (footerWidth < footerHeight) isPortrait = true;

            console.log(isPortrait);

            // Maintain aspect ratio of footer image
            const aspectRatio = footerImgLoaded.height / footerImgLoaded.width;
            const scaledFooterHeight =
              (isPortrait ? footerWidth : alternative_width) * aspectRatio;

            console.log("Drawing footer with dimensions:", {
              width: footerWidth,
              height: footerHeight,
              scaledFooterHeight,
              y: footerY,
            });

            // Save current context
            tempCtx.save();
            tempCtx.globalAlpha = footerOptions.opacity;
            tempCtx.drawImage(
              footerImgLoaded,
              0, // x
              footerY, // y (always at bottom)
              footerWidth,
              footerHeight // Use the calculated height
            );
            // Restore context
            tempCtx.restore();
          } else {
            // Fallback to text footer
            const footerHeight = Math.max(50, tempCanvas.height * 0.1);
            const footerY = tempCanvas.height - footerHeight;
            tempCtx.fillStyle = "rgba(5, 1, 0, 0.6)";
            tempCtx.fillRect(0, footerY, tempCanvas.width, footerHeight);
            tempCtx.fillStyle = "#FFFFFF";
            tempCtx.font = `${Math.max(
              16,
              footerHeight * 0.4
            )}px Inter, sans-serif`;
            tempCtx.textAlign = "center";
            tempCtx.textBaseline = "middle";
            tempCtx.fillText(
              "Your Awesome Graphic Footer",
              tempCanvas.width / 2,
              footerY + footerHeight / 2
            );
          }

          const dataUrl = tempCanvas.toDataURL("image/png", 1.0);
          newProcessedData.push({
            src: dataUrl,
            name: file.name.replace(/\.[^/.]+$/, "") + "_processed.png",
          });

          // Set merged image if only one image is processed
          if (originalImages.length === 1) {
            setMergedImage(dataUrl);
          }
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
        }
      }

      setProcessedImagesData(newProcessedData);
      setStatusMessage(
        newProcessedData.length > 0
          ? `Processed ${newProcessedData.length} image(s) successfully!`
          : "Failed to process images"
      );
    } catch (error: any) {
      console.error("Error in processing:", error);
      setStatusMessage(`Error: ${error.message}`);
    }
  }, [originalImages, logoImage, footerImage, footerOptions, loadImage]);

  useEffect(() => {
    if (originalImages.length > 0) {
      processAndGeneratePreviews();
    } else {
      setProcessedImagesData([]);
      setMergedImage(null);
      setStatusMessage("");
    }
  }, [
    originalImages,
    logoImage,
    footerImage,
    footerOptions,
    processAndGeneratePreviews,
  ]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (imageFiles.length > 0) {
        setOriginalImages(imageFiles);
        setStatusMessage("");
      } else {
        setOriginalImages([]);
        setProcessedImagesData([]);
        setMergedImage(null);
        setStatusMessage(
          "Please select one or more valid image files (e.g., PNG, JPG)."
        );
      }
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setLogoImage(file);
      setStatusMessage("");
    } else {
      setLogoImage(null);
      setStatusMessage("Please select a valid logo file (e.g., PNG, JPG).");
    }
  };

  const handleFooterUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setFooterImage(file);
      setStatusMessage("");
    } else {
      setFooterImage(null);
      setStatusMessage("Please select a valid footer file (e.g., PNG, JPG).");
    }
  };

  const handleFooterOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFooterOptions((prev) => ({
      ...prev,
      [name]: name === "opacity" ? parseFloat(value) : parseInt(value),
    }));
  };

  const handleIndividualDownload = (src: string, name: string) => {
    try {
      const link = document.createElement("a");
      link.href = src;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatusMessage(`Downloaded ${name}!`);
    } catch (error: any) {
      console.error("Error downloading image:", error);
      setStatusMessage(`Error downloading ${name}: ${error.message}`);
    }
  };

  const handleDownloadAll = () => {
    if (processedImagesData.length === 0) {
      setStatusMessage(
        "No images to download. Please upload and process image(s) first."
      );
      return;
    }
    processedImagesData.forEach((imgData, index) => {
      setTimeout(() => {
        handleIndividualDownload(imgData.src, imgData.name);
      }, index * 200);
    });
    setStatusMessage("Initiating download for all processed images...");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center font-inter">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl border border-gray-200">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Image Watermarker & Footer
        </h1>

        {/* Input section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col">
            <label
              htmlFor="imageUpload"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload Base Image(s):
            </label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {originalImages.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Selected: {originalImages.length} image(s)
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="logoUpload"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload Logo (Optional):
            </label>
            <input
              type="file"
              id="logoUpload"
              accept="image/*"
              onChange={handleLogoUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
            />
            {logoImage && (
              <p className="text-xs text-gray-500 mt-2">
                Selected: {logoImage.name} ({(logoImage.size / 1024).toFixed(2)}{" "}
                KB)
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="footerUpload"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload Footer (Optional):
            </label>
            <input
              type="file"
              id="footerUpload"
              accept="image/*"
              onChange={handleFooterUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
            />
            {footerImage && (
              <p className="text-xs text-gray-500 mt-2">
                Selected: {footerImage.name} (
                {(footerImage.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        </div>

        {/* Footer options section */}
        {footerImage && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Footer Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="footerOpacity"
                  className="block text-xs text-gray-500 mb-1"
                >
                  Opacity: {footerOptions.opacity.toFixed(1)}
                </label>
                <input
                  type="range"
                  id="footerOpacity"
                  name="opacity"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={footerOptions.opacity}
                  onChange={handleFooterOptionChange}
                  className="block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="footerHeight"
                  className="block text-xs text-gray-500 mb-1"
                >
                  Height: {footerOptions.heightPercentage}% of image height
                </label>
                <input
                  type="range"
                  id="footerHeight"
                  name="heightPercentage"
                  min="5"
                  max="40"
                  step="1"
                  value={footerOptions.heightPercentage}
                  onChange={handleFooterOptionChange}
                  className="block w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <p className="text-center text-sm mb-6 text-gray-600 p-2 bg-gray-50 rounded-lg">
            {statusMessage}
          </p>
        )}

        {/* Preview section */}
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
                  onClick={() =>
                    handleIndividualDownload(imgData.src, imgData.name)
                  }
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Download
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400">
              Your processed image(s) will appear here.
            </p>
          )}
        </div>

        {/* Action button */}
        <div className="flex justify-center">
          <button
            onClick={handleDownloadAll}
            disabled={processedImagesData.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download All Processed Images
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
