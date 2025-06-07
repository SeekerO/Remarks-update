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
        className="hover:scale-110 duration-300 hover:rotate-210 relative w-fit z-50"
      >
        {!side ? (
          <AiOutlineMenuFold className="text-[1.5rem] text-gray-700 dark:text-gray-300" />
        ) : (
          <RiCloseFill className="text-[1.5rem] text-red-700" />
        )}
      </button>

      {/* Side Menu */}
      <div
        ref={ref}
        className={`absolute duration-500 overflow-hidden justify-between flex flex-col right-0 mr-10 w-[200px] bg-slate-200 dark:bg-slate-700 shadow-md rounded-l-md ${side ? "h-[300px] px-2 py-2" : "h-[0px]"
          }`}
      >
        <div className="flex gap-1 items-center mt-5">
          <label className="font-semibold tracking-wide">Threshold</label>
          <input
            type="number"
            className="text-center rounded-sm w-full px-1 py-0.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={threshold}
            onChange={(e) => SetThreshold(Number(e.target.value))}
            min={0}
            max={100}
          />
        </div>

        {res?.unmatched?.length > 0 ? (
          <div className="w-full flex items-center justify-center mt-4">
            <button
              onClick={() => setOpenUnmatchedList(true)}
              className="border px-3 rounded-md border-blue-600 text-blue-600 hover:text-white hover:bg-blue-500 hover:scale-110 duration-500"
            >
              UnMatched List
            </button>
            <UnmatchedList
              data={res.unmatched}
              open={openUnmatchedList}
              set={setOpenUnmatchedList}
            />
          </div>
        ) : <label className="w-full italic font-thin text-center">No Unmatched Data</label>}
      </div>
    </>
  );
};

export default SideMenu;
