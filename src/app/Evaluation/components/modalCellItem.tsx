"use client"

import { useRef, useEffect } from "react";

const ModalCell = ({
  previewLink,
  open,
  setOpen,
}: {
  previewLink: string | null;
  open: boolean;
  setOpen: (value: boolean) => void;
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
    <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-[80vw] h-[90vh] bg-white p-4 rounded-lg shadow-lg">
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-black"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        {previewLink && (
          <div className="w-full h-full flex justify-center">
            <iframe
              src={previewLink}
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

export default ModalCell;
