"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useRef, useEffect, useState } from "react";

const GdriveModal = ({
  cellValue,
  cellIndex,
  open,
  setOpen,
}: {
  cellValue: string | null;
  cellIndex: number;
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    const fetchPreviewLink = async () => {
      if (
        [13, 14, 15, 16, 17].includes(cellIndex) &&
        typeof cellValue === "string"
      ) {
        const link = await convertToPreviewLink(cellValue);
        setPreview(link);
      }
    };

    fetchPreviewLink();
  }, [cellValue, cellIndex]);

  const expandUrl = async (shortUrl: string): Promise<string> => {
    try {
      const res = await fetch(
        `https://unshorten.me/json/${encodeURIComponent(shortUrl)}`
      );
      const data = await res.json();
      return data.resolved_url || shortUrl;
    } catch (error) {
      console.error("Error expanding URL:", error);
      return shortUrl;
    }
  };

  const convertToPreviewLink = async (url: string): Promise<string> => {
    if (typeof url !== "string") return url;

    if (url.includes("view")) {
      return url.replace(/\/view?.*$/, "/preview");
    } else if (url.includes("https://bit.ly")) {
      const expandedURL = await expandUrl(url);
      return convertBitLinkToPreview(expandedURL);
    } else {
      return convertFolderToPreview(url);
    }
  };

  const convertFolderToPreview = (url: string): string => {
    const match = url?.match(/folders\/([^?]+)/);
    return `https://drive.google.com/embeddedfolderview?id=${
      match ? match[1] : ""
    }#list`;
  };

  const convertBitLinkToPreview = (url: string): string => {
    const match = url?.match(/folders\/(.+)/);
    return `https://drive.google.com/embeddedfolderview?id=${
      match ? match[1] : ""
    }#list`;
  };

  const ref = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={ref}
        className="w-[80vw] h-[90vh] bg-white p-4 rounded-lg shadow-lg relative"
      >
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-black"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        {preview && (
          <div className="w-full h-full flex justify-center">
            <iframe
              src={preview}
              width="100%"
              height="100%"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg border"
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
};

export default GdriveModal;
