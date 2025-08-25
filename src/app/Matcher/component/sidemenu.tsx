/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { AiOutlineMenuFold } from "react-icons/ai";
import { RiCloseFill } from "react-icons/ri";
import UnmatchedList from "./unmatchedlist_modal"; // Adjust the path as needed

const SideMenu = ({
  res,
  threshold,
  SetThreshold,
}: {
  res: any;
  threshold: number;
  SetThreshold: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const [side, setSide] = useState<boolean>(false);
  const [openUnmatchedList, setOpenUnmatchedList] = useState<boolean>(false);

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setSide(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setSide(!side)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={side ? "Close menu" : "Open menu"}
      >
        {!side ? (
          <AiOutlineMenuFold className="text-2xl" />
        ) : (
          <RiCloseFill className="text-2xl text-red-500" />
        )}
      </button>

      <UnmatchedList
        data={res?.unmatched}
        open={openUnmatchedList}
        set={setOpenUnmatchedList}
      />

      {/* Side Menu */}
      <div
        ref={ref}
        className={`absolute top-20 right-4 lg:right-8 w-64 lg:w-72 bg-white dark:bg-gray-800 shadow-xl shadow-gray-800 rounded-lg p-6 flex flex-col gap-6 transition-all duration-500 transform
          ${side ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
          } z-40`}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="threshold" className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
            Fuzzy Match Threshold
          </label>
          <div className="flex items-center gap-2">
            <input
              id="threshold"
              type="number"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
              value={threshold}
              onChange={(e) => SetThreshold(Number(e.target.value))}
              min={0}
              max={100}
            />
            <span className="text-gray-600 dark:text-gray-400 font-medium">%</span>
          </div>
        </div>

        {res?.unmatched?.length > 0 ? (
          <div className="w-full flex justify-center">
            <button
              onClick={() => setOpenUnmatchedList(true)}
              className="w-full px-4 py-2 text-sm font-medium rounded-md text-blue-600 border border-blue-600 transition-all duration-300 hover:bg-blue-600 hover:text-white dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-400 dark:hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View Unmatched List ({res.unmatched.length})
            </button>

          </div>
        ) : (
          <div className="w-full text-center p-4">
            <p className="italic text-gray-500 dark:text-gray-400 text-sm">
              No unmatched data to display.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default SideMenu;