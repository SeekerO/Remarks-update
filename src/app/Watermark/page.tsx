"use client";

import { useState, useRef } from "react";

export default function ImageWithFooter() {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [footerImage, setFooterImage] = useState<string | null>(null);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle base image upload
  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBaseImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle footer image upload
  const handleFooterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFooterImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Merge images
  const mergeImages = () => {
    if (!baseImage || !footerImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match the base image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw the footer image at the bottom
      const footerImg = new Image();
      footerImg.onload = () => {
        // Scale footer width to match base image (maintain aspect ratio)
        const footerHeight = (footerImg.height / footerImg.width) * img.width;
        ctx.drawImage(
          footerImg,
          0,
          img.height - footerHeight,
          img.width,
          footerHeight
        );

        // Save the merged image
        setMergedImage(canvas.toDataURL("image/png"));
      };
      footerImg.src = footerImage;
    };
    img.src = baseImage;
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>Custom Footer Upload</h1>

      <div style={{ marginBottom: "20px" }}>
        <h3>Step 1: Upload Base Image</h3>
        <input type="file" accept="image/*" onChange={handleBaseImageUpload} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Step 2: Upload Footer Image</h3>
        <input type="file" accept="image/*" onChange={handleFooterUpload} />
      </div>

      <button
        onClick={mergeImages}
        disabled={!baseImage || !footerImage}
        style={{
          background: "#4F46E5",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Merge Images
      </button>

      <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>
        {baseImage && (
          <div>
            <h3>Base Image</h3>
            <img
              src={baseImage}
              alt="Base"
              style={{ maxWidth: "300px", border: "1px solid #ddd" }}
            />
          </div>
        )}
        {footerImage && (
          <div>
            <h3>Footer Image</h3>
            <img
              src={footerImage}
              alt="Footer"
              style={{ maxWidth: "300px", border: "1px solid #ddd" }}
            />
          </div>
        )}
      </div>

      {mergedImage && (
        <div style={{ marginTop: "30px" }}>
          <h3>Result</h3>
          <img
            src={mergedImage}
            alt="Merged"
            style={{ maxWidth: "100%", border: "1px solid #ddd" }}
          />
          <a
            href={mergedImage}
            download="image-with-custom-footer.png"
            style={{
              display: "inline-block",
              marginTop: "10px",
              background: "#4F46E5",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            Download Merged Image
          </a>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
