"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import JSZip from "jszip";
import Image from "next/image";

export default function Watermark() {
  const [watermark, setWatermark] = useState<File | null>(null);
  const [images, setImages] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previews, setPreviews] = useState<{ name: string; dataUrl: string }[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!watermark || !images || images.length === 0) {
      setError(
        "Please select a watermark image and at least one image to watermark."
      );
      return;
    }
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("watermark", watermark);
    Array.from(images).forEach((file) => {
      formData.append("images", file);
    });

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Something went wrong on the server."
        );
      }

      const json = await res.json();
      setPreviews(json.previews || []);
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred during processing."
      );
      setPreviews([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIndividualDownload = (dataUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `watermarked_${fileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchDownload = async () => {
    if (previews.length === 0) {
      setError("No watermarked images to download.");
      return;
    }

    const zip = new JSZip();
    previews.forEach((preview) => {
      const base64Data = preview.dataUrl.split(",")[1];
      zip.file(`watermarked_${preview.name}`, base64Data, { base64: true });
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "watermarked_images.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (zipError) {
      setError("Failed to create ZIP file for download.");
      console.error("ZIP generation error:", zipError);
    }
  };

  const handleDeletePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenPreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewImageUrl(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
        Image Watermarker
      </h1>

      <div className="space-y-4">
        {/* ... Watermark and Image upload sections ... */}
        <div>
          <label
            htmlFor="watermark-upload"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            Upload Watermark Image:
          </label>
          <input
            id="watermark-upload"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100 cursor-pointer"
            onChange={(e) => setWatermark(e.target.files?.[0] ?? null)}
          />
          {watermark && (
            <p className="mt-2 text-sm text-gray-600">
              Selected watermark:{" "}
              <span className="font-medium">{watermark.name}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="image-upload"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            Upload Images to Watermark:
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-green-50 file:text-green-700
                         hover:file:bg-green-100 cursor-pointer"
            onChange={(e) => setImages(e.target.files)}
          />
          {images && images.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Selected {images.length} image(s).
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isProcessing || !watermark || !images || images.length === 0}
        className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out
                    ${
                      isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
      >
        {isProcessing ? "Processing Images..." : "Apply Watermark"}
      </button>

      {error && (
        <div
          className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md"
          role="alert"
        >
          {error}
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Watermarked Previews
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {previews.map((preview, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg shadow-md overflow-hidden bg-white relative"
              >
                {preview.dataUrl ? (
                  <Image
                    src={preview.dataUrl}
                    alt={`Watermarked ${preview.name}`}
                    className="w-full h-48 object-contain bg-gray-50 p-2"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500">
                    Image not available
                  </div>
                )}
                <p
                  className="text-sm text-center text-gray-600 p-2 border-t border-gray-100 truncate"
                  title={preview.name}
                >
                  {preview.name}
                </p>
                <div className="p-2 flex gap-2">
                  <button
                    onClick={() => handleOpenPreview(preview.dataUrl)}
                    disabled={!preview.dataUrl}
                    className={`flex-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm ${
                      preview.dataUrl
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-400 cursor-not-allowed text-gray-600"
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() =>
                      handleIndividualDownload(preview.dataUrl, preview.name)
                    }
                    disabled={!preview.dataUrl}
                    className={`flex-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm ${
                      preview.dataUrl
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gray-400 cursor-not-allowed text-gray-600"
                    }`}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDeletePreview(idx)}
                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center focus:outline-none focus:shadow-outline text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Batch Download Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBatchDownload}
              disabled={
                previews.length === 0 || previews.some((p) => !p.dataUrl)
              }
              className={`font-bold py-3 px-6 rounded-lg text-lg focus:outline-none focus:shadow-outline ${
                previews.length === 0 || previews.some((p) => !p.dataUrl)
                  ? "bg-gray-400 cursor-not-allowed text-gray-600"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              Download All Watermarked Images (ZIP)
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {isPreviewOpen && previewImageUrl && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={handleClosePreview}
              className="absolute top-4 right-4 text-gray-700 hover:text-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <Image
              src={previewImageUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
