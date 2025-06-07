// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-unused-vars

"use client";

import { useState, useEffect } from "react";
import { ChromePicker } from "react-color";

export default function ColorPicker({ onChange, setColumnColor }) {
  const [color, setColor] = useState("#3498db");
  const [open, setOpen] = useState(false);

  const handleChange = (newColor) => {
    setColor(newColor.hex);
    if (onChange) onChange(newColor.hex);
    if (setColumnColor) setColumnColor(newColor.hex);
  };

  useEffect(() => {
    if (setColumnColor) {
      setColumnColor(color);
    }
  }, [color, setColumnColor]);

  return (
    <div className="p-2 outline-1 outline-slate-300 rounded relative gap-y-2">
      <div className="flex gap-2">
        <div className="flex flex-col items-center">
          <p className="text-sm">Selected color:</p>
          <p className="text-sm mt-1 italic">{color}</p>
        </div>
        <div
          onClick={() => setOpen(!open)}
          className="flex-1 h-10 border rounded cursor-pointer"
          style={{ backgroundColor: color }}
        />
      </div>

      {open && (
        <div className="absolute top-0 left-0 p-2 rounded-md z-50 bg-white shadow-lg border">
          <ChromePicker
            color={color}
            onChange={handleChange}
            disableAlpha={true}
          />
          <button
            onClick={() => setOpen(false)}
            className="mt-2 bg-blue-500 px-4 py-2 text-white font-semibold rounded-md cursor-pointer hover:shadow-md hover:bg-blue-600 duration-300 w-full"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
