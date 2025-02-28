/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import convertExcelTimestamp from "../../../../lib/util/convertExcelTimestamp";
import GdriveModal from "../Modal/gdriveModal";
import SocialModal from "../Modal/socialModal";

const CellItem = ({ cell, cellIndex }: { cell: any; cellIndex: number }) => {
  const [openGdriveModal, setOpenGdriveModal] = useState<boolean>(false);
  const [openSocialModal, setOpenSocialModal] = useState<boolean>(false);

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

  const handleOpenModal = () => {
    if (
      cellValue.includes("https://") &&
      [13, 14, 15, 16, 17].includes(cellIndex)
    ) {
      setOpenGdriveModal(!openGdriveModal);
    } else if (
      [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].includes(cellIndex)
    ) {
      setOpenSocialModal(!openSocialModal);
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
        {[13, 14, 15, 16, 17].includes(cellIndex) && (
          <GdriveModal
            cellValue={cellValue}
            cellIndex={cellIndex}
            open={openGdriveModal}
            setOpen={setOpenGdriveModal}
          />
        )}
        {[19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].includes(
          cellIndex
        ) && (
          <SocialModal
            cellValue={cellValue}
            cellIndex={cellIndex}
            open={openSocialModal}
            setOpen={setOpenSocialModal}
          />
        )}
      </div>
    </td>
  );
};

export default CellItem;
