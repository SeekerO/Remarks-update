// pages/api/process.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import sharp from "sharp";
import { promises as fs } from "fs"; // For file system operations
import path from "path"; // For path manipulation

// This is crucial for formidable to handle the request body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Ensure the temporary directory exists
  const tmpDir = path.join(process.cwd(), "tmp");
  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch (dirErr) {
    console.error("Failed to create temporary directory:", dirErr);
    return res
      .status(500)
      .json({ error: "Server error: Could not prepare upload directory." });
  }

  const form = formidable({
    multiples: true, // Allows multiple files for fields like 'images'
    uploadDir: tmpDir, // Specify the temporary directory for uploads
    keepExtensions: true, // Keep the original file extensions
  });

  const uploadedFilePaths: string[] = []; // To keep track of files to clean up

  try {
    const { files } = await new Promise<{
      fields: formidable.Fields;
      files: formidable.Files;
    }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Form parsing error:", err);
          return reject(err);
        }
        resolve({ fields, files });
      });
    });

    const watermarkFile = Array.isArray(files.watermark)
      ? files.watermark[0] // formidable returns an array even for single files if multiples: true is set
      : files.watermark;

    const imageFiles = Array.isArray(files.images)
      ? files.images
      : files.images
      ? [files.images]
      : [];

    if (!watermarkFile || imageFiles.length === 0) {
      // Clean up files that might have been partially uploaded before the check
      if (watermarkFile)
        uploadedFilePaths.push(watermarkFile.filepath as string);
      imageFiles.forEach((file) =>
        uploadedFilePaths.push(file.filepath as string)
      );

      return res
        .status(400)
        .json({ error: "Please upload a watermark and at least one image." });
    }

    const watermarkPath = watermarkFile.filepath as string;
    uploadedFilePaths.push(watermarkPath); // Add watermark to cleanup list

    // Read watermark buffer once outside the loop for efficiency
    const watermarkBuffer = await fs.readFile(watermarkPath);

    const previews: { name: string; dataUrl: string }[] = [];

    for (const image of imageFiles) {
      const imagePath = image.filepath as string;
      const imageName =
        image.originalFilename || `watermarked_image_${Date.now()}.jpg`; // Fallback name
      uploadedFilePaths.push(imagePath); // Add current image to cleanup list

      try {
        const watermarkedBuffer = await sharp(imagePath)
          .composite([
            {
              input: watermarkBuffer,
              gravity: "southeast", // Placed at bottom-right. Other options: "north", "southwest", "center", etc.
              // You can also use explicit positions:
              // left: 20,
              // top: 20,
              // You can also add opacity:
              // raw: { width: ..., height: ..., channels: ... }, // if you want to control raw pixel data directly
              // blend: 'overlay', // or 'multiply', 'screen', etc. for blending modes
              // tile: true, // if you want to tile the watermark
              // density: 72 // DPI of the watermark, useful for vector watermarks
            },
          ])
          .jpeg({ quality: 90 }) // Adjust quality as needed (0-100)
          .toBuffer();

        const base64 = watermarkedBuffer.toString("base64");
        // Use the original image's mimetype or default to jpeg if unknown
        const mimeType = image.mimetype || "image/jpeg";
        const dataUrl = `data:${mimeType};base64,${base64}`;

        previews.push({ name: imageName, dataUrl });
      } catch (sharpErr) {
        console.error(`Error watermarking image ${imageName}:`, sharpErr);
        // Add a placeholder for failed images or skip them
        previews.push({ name: `${imageName} (Failed)`, dataUrl: "" });
      }
    }

    res.status(200).json({ previews });
  } catch (error) {
    console.error("Overall processing error:", error);
    res.status(500).json({
      error:
        "Failed to process images. Please try again with valid image files.",
    });
  } finally {
    // Clean up all temporary files created by formidable
    for (const filePath of uploadedFilePaths) {
      try {
        await fs.unlink(filePath);
        console.log(`Cleaned up temp file: ${filePath}`);
      } catch (cleanupErr) {
        console.warn(
          `Failed to delete temporary file ${filePath}:`,
          cleanupErr
        );
      }
    }
  }
}
