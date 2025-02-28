"use client";

import React, { useState, useEffect, useRef } from "react";

const SocialModal = ({
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
  const [link, setLink] = useState<string>("");

  // List of sites that block iframe embedding
  const blockedSites = [
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "tiktok.com",
    "threads.net",
  ];

  // Check if the link contains a blocked site
  const isBlocked = blockedSites.some((site) => link.includes(site));

  useEffect(() => {
    if (!cellValue) {
      setLink("");
      return;
    }

    let formattedLink = "";
    switch (cellIndex) {
      case 19:
        formattedLink =
          cellValue.startsWith("http") || cellValue.startsWith("www")
            ? cellValue
            : `https://www.facebook.com/${cellValue}`;
        break;
        break;
      case 20:
        formattedLink = `https://www.facebook.com/${cellValue}`;
        break;
      case 21:
        formattedLink = cellValue.startsWith("http")
          ? cellValue
          : `https://${cellValue}`;
        break;
      case 22:
        formattedLink = `https://www.instagram.com/${cellValue}/`;
        break;
      case 23:
        formattedLink = `https://www.threads.net/@${cellValue}`;
        break;
      case 24:
        formattedLink = `https://twitter.com/${cellValue}`;
        break;
      case 25:
        formattedLink = `https://www.tiktok.com/@${cellValue}`;
        break;
      case 26:
        formattedLink = `https://www.youtube.com/c/${cellValue}`;
        break;
      case 27:
        formattedLink = `https://www.kumu.ph/${cellValue}`;
        break;
      case 28:
        formattedLink = `https://open.spotify.com/user/${cellValue}`;
        break;
      case 29:
        formattedLink = `https://www.dailymotion.com/${cellValue}`;
        break;
      case 30:
        formattedLink = `https://vimeo.com/${cellValue}`;
        break;
      case 31:
        formattedLink = `https://www.twitch.tv/${cellValue}`;
        break;
      default:
        formattedLink = "";
        break;
    }

    setLink(formattedLink);
  }, [cellIndex, cellValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-[80vw] h-[90vh] bg-white p-4 rounded-lg shadow-lg relative">
        {link ? (
          <div className="w-full h-full flex justify-center">
            {isBlocked ? (
              <p className="text-center mb-4">
                This site cannot be embedded.{" "}
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Click here to open in a new tab
                </a>
              </p>
            ) : (
              <iframe
                src={link}
                width="100%"
                height="100%"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg border"
              ></iframe>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500">No valid link available.</p>
        )}
      </div>
    </div>
  );
};

export default SocialModal;
