/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import convertExcelTimestamp from "../../../lib/util/convertExcelTimestamp";
import ModalCell from "./modalCellItem";
const CellItem = ({ cell, cellIndex }: { cell: any; cellIndex: number }) => {
  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);

  let textColor = "";
  let cellValue = cell ? cell.toString().trim() : " ";

  // Convert Excel timestamp if applicable
  if ([2, 3].includes(cellIndex)) {
    cellValue = convertExcelTimestamp(cell);
  }

  // Apply color styling for first column
  if (cellIndex === 0 && typeof cell === "string") {
    const lowerCell = cell.toLowerCase();
    if (lowerCell.includes("full")) textColor = "text-green-600 font-semibold";
    else if (lowerCell.includes("non"))
      textColor = "text-red-600 font-semibold";
    else if (lowerCell.includes("partial"))
      textColor = "text-yellow-600 font-semibold";
  }

  const convertToPreviewLink = useCallback(
    async (url: string): Promise<string> => {
      if (typeof url !== "string") return url;

      if (url.includes("view")) {
        return url.replace(/\/view?.*$/, "/preview");
      } else if (url.includes("https://bit.ly")) {
        const expandedURL = await expandUrl(url);
        console.log(expandedURL);
        return convertBitLinkToPreview(expandedURL);
      } else {
        return convertFolderToPreview(url);
      }
    },
    []
  );

  useEffect(() => {
    const fetchPreviewLink = async () => {
      if (
        [13, 14, 15, 16, 17].includes(cellIndex) &&
        typeof cell === "string"
      ) {
        const link = await convertToPreviewLink(cell);
        setPreviewLink(link);
      }
    };

    fetchPreviewLink();
  }, [cell, cellIndex, convertToPreviewLink]); // Now safe to include

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

  const handleOpenModal = () => {
    if (cellValue.includes("https://")) {
      setOpenModal(!openModal);
    }
  };

  return (
    <td
      key={cellIndex}
      onClick={handleOpenModal}
      className={`border border-gray-950 px-4 py-2 text-center `}
    >
      <div
        className={`${textColor} ${
          [13, 14, 15, 16, 17].includes(cellIndex) &&
          "hover:text-blue-500 cursor-pointer hover:underline"
        } `}
      >
        {cellValue}
        <ModalCell
          previewLink={previewLink}
          open={openModal}
          setOpen={setOpenModal}
        />
      </div>
    </td>
  );
};

export default CellItem;
