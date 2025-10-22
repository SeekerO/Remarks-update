"use client"

import { useAuth } from "../Chat/AuthContext";
import Link from "next/link";
import DynamicColumn from "./component/dynamicColumn";
import BreadCrumb from "../component/breadcrumb";

const Remarks = () => {

  const { user } = useAuth();

  if (!user || (user as any).canChat === false) {

    window.location.href = "/";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Link href={"/"} className="text-gray-600 dark:text-gray-400 text-center px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md text-base font-medium transition-colors duration-300">
          Please log in to access the Remarks.
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col ">
      <div className="flex justify-between px-4 py-5">
        <BreadCrumb />
      </div>
      <div className="p-5">
        <DynamicColumn />
      </div>
    </div>
  );
};

export default Remarks;
