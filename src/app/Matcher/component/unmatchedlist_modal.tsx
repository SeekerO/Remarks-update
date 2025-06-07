"use client";

import React, { useRef, useEffect, useState } from "react";
import SearchBar from "@/lib/components/searchbar";
import { IoSearch } from "react-icons/io5";

type Props = {
  data: any;
  open: boolean;
  set: React.Dispatch<React.SetStateAction<boolean>>;
};

const UnmatchedList = ({ data, open, set }: Props) => {
  const [inputSearch, setInputSearch] = useState<string>("");
  const ref = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      set(false);
    }
  };

  const filteredItems = data.filter((item: string) =>
    item[0].toLowerCase().includes(inputSearch.toLowerCase())
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!open) return null;

  return (
    <div className=" fixed inset-0 z-50 backdrop-blur-sm h-screen w-screen flex items-center justify-center">
      <div
        ref={ref}
        className="h-[80vh] w-[70vh] bg-slate-100 dark:bg-slate-900 shadow-inner rounded-md overflow-hidden p-5"
      >
        <div className="flex items-center gap-1 p-1 bg-gray-300 dark:bg-gray-600 rounded-md">
          <IoSearch className="text-white text-[1.2rem]" />
          <SearchBar searchText={inputSearch} searchSetter={setInputSearch} />
        </div>
        <div className="h-full overflow-y-auto overflow-x-hidden flex flex-col gap-y-2 mt-2">
          {filteredItems.map((value: string, index: number) => (
            <div
              key={index}
              className="justify-between flex gap-5 border border-1 border-slate-600 px-2 py-1 rounded-md"
            >
              <label className="font-bold">{value[0]}</label>
              <label className="font-thin">{value[1]}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UnmatchedList;
