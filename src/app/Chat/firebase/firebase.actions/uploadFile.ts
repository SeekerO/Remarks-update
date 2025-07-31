// uploadFile.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/**
 * Uploads a file to Firebase Storage and returns its download URL.
 * Includes basic progress tracking (though not explicitly used in ChatRoom for UI,
 * it's good practice for larger files).
 * @param file The File object to upload.
 * @param chatId The ID of the chat, used to organize files in storage (e.g., chats/{chatId}/files/{fileName}).
 * @returns A Promise that resolves with the download URL of the uploaded file.
 * @throws Error if the upload fails.
 */
export async function uploadFile(file: File, chatId: string): Promise<string> {
  // Create a storage reference with a unique path for the file
  // Using Date.now() and original file name to ensure uniqueness and readability
  const storageRef = ref(
    storage,
    `chats/${chatId}/files/${Date.now()}_${file.name}`
  );

  // Upload the file using uploadBytesResumable for better handling of large files
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        // You could update a progress bar in the UI here
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error("File upload failed:", error);
        reject(new Error("Failed to upload file."));
      },
      async () => {
        // Handle successful uploads on complete
        // Get the download URL
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("File available at", downloadURL);
          resolve(downloadURL);
        } catch (error) {
          console.error("Error getting download URL:", error);
          reject(new Error("Failed to get file download URL."));
        }
      }
    );
  });
}
