// src/app/Edit/Watermarkv5/hooks/useAutoSaveToDrive.ts
// Fire-and-forget: silently uploads a Blob to the user's Drive directory
// after a successful ZIP export from the watermark editor.
// No loading state exposed — caller doesn't need to await.

"use client";

import { useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

interface AutoSaveOptions {
    /** Override the user name used as the Drive folder name */
    userNameOverride?: string;
}

export function useAutoSaveToDrive(options: AutoSaveOptions = {}) {
    const { user } = useAuth();
    const inFlight = useRef<Set<string>>(new Set());

    /**
     * Silently uploads `blob` with `fileName` to Drive.
     * Safe to call without awaiting — errors are swallowed and logged.
     */
    const autoSave = useCallback(
        (blob: Blob, fileName: string): void => {
            if (!user) return;

            // Deduplicate concurrent uploads of the same file
            if (inFlight.current.has(fileName)) return;
            inFlight.current.add(fileName);

            const userId = user.uid;
            const userName = options.userNameOverride
                || user.displayName
                || user.email
                || "Unknown";

            const formData = new FormData();
            formData.append("file", new File([blob], fileName, { type: blob.type }));
            formData.append("userId", userId);
            formData.append("userName", userName);
            formData.append("uploadedBy", userId);

            fetch("/api/directory/upload", { method: "POST", body: formData })
                .then((res) => {
                    if (!res.ok) console.warn(`[autoSave] Upload failed: ${res.status}`);
                })
                .catch((err) => {
                    console.warn("[autoSave] Upload error:", err);
                })
                .finally(() => {
                    inFlight.current.delete(fileName);
                });
        },
        [user, options.userNameOverride]
    );

    return { autoSave };
}