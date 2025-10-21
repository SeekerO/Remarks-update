"use client"

import { useAuth } from "../Chat/AuthContext";
import Link from "next/link";
import DynamicColumn from "./component/dynamicColumn";
import BreadCrumb from "../component/breadcrumb";

const Remarks = () => {

  const { user } = useAuth();

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Link href={"/"} className="text-gray-600 dark:text-gray-400 text-center px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md text-base font-medium transition-colors duration-300">
          Please log in to access the Remarks.
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen  py-5 flex flex-col gap-y-4 dark:bg-slate-800">
      <div className="flex justify-between px-10">
        <BreadCrumb />
      </div>
      <DynamicColumn />
    </div>
  );
};

export default Remarks;
