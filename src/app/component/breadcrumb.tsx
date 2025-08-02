"use client";

import React, { useState, useLayoutEffect } from "react";
import Link from "next/link";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { IoHome } from "react-icons/io5";

const BreadCrumb = () => {
  const [pathSegments, setPathSegments] = useState<string[]>([]);

  useLayoutEffect(() => {
    const path = window.location.pathname;
    // Remove leading/trailing slashes and split by '/'
    const segments = path.replace(/^\/|\/$/g, "").split("/");
    setPathSegments(segments.filter(segment => segment !== '')); // Filter out empty segments
  }, []);

  return (
    <div className="flex gap-1 items-center text-blue-500">
      <Link href="/">
        <IoHome className="text-[25px] hover:scale-110 duration-300" />
      </Link>
      {pathSegments.map((segment, index) => {
        // Construct the href for each segment
        const href = "/" + pathSegments.slice(0, index + 1).join("/");
        const isLastSegment = index === pathSegments.length - 1;

        return (
          <React.Fragment key={segment}>
            <MdOutlineKeyboardArrowRight className="text-[20px]" />
            {isLastSegment ? (
              // Last segment is not a link, just display the text
              <span className="font-semibold tracking-wider">
                {decodeURIComponent(segment.replace(/-/g, ' '))}
              </span>
            ) : (
              // Other segments are links
              <Link href={href} className="font-semibold hover:underline tracking-wider duration-300 cursor-pointer">
                {decodeURIComponent(segment.replace(/-/g, ' '))}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default BreadCrumb;