import React, { useEffect, useRef } from "react";
import { MdOutlineFileDownload } from "react-icons/md";

const Duplicated = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
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
  }, [ref]); // Added ref to dependencies

  if (!open) return null;

  return (
    <div className="absolute inset-0 w-screen h-screen flex items-center justify-center backdrop-blur-[1px]">
      <div ref={ref} className="bg-slate-100 py-7 px-4 rounded-md">
        <label className="font-semibold text-[1.3rem]">
          Template provided to be able to transfer the file.
        </label>
        <a
          href="https://docs.google.com/spreadsheets/d/19PDiHGVhqjs16YI7ILRdDaC6RKV1evzZ/edit?usp=drive_link&ouid=115365859376902920371&rtpof=true&sd=true"
          download
          className="w-full bg-blue-500 justify-center py-2 rounded-md font-bold text-white flex items-center gap-2 hover:bg-blue-700 hover:text-slate-200 duration-300 hover:scale-90 cursor-pointer"
        >
          <MdOutlineFileDownload className="text-[2rem]" />
          DOWNLOAD FILE
        </a>
      </div>
    </div>
  );
};

export default Duplicated;
