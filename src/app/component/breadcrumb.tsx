"use client";

import React, { useState, useLayoutEffect } from "react";
import Link from "next/link";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { IoHome } from "react-icons/io5";

const BreadCrumb = () => {
  const [pathname, setPathName] = useState<string>("");

  useLayoutEffect(() => {
    const path = window.location.pathname;
    const text = path.replace(/^\/+/, "");
    setPathName(text);
  }, []);

  return (
    <div className="flex gap-1 items-center text-blue-500">
      <Link href="/">
        <IoHome className="text-[25px] hover:scale-110 duration-300" />
      </Link>
      <MdOutlineKeyboardArrowRight className="text-[20px]" />
      <a
        onClick={() => window.location.reload}
        className="font-semibold hover:underline tracking-wider duration-300 cursor-pointer"
      >
        {pathname}
      </a>
    </div>
  );
};

export default BreadCrumb;
