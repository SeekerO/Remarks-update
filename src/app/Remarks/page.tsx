"use client"

import DynamicColumn from "./component/dynamicColumn";
import BreadCrumb from "../component/breadcrumb";
import { useKeySequence } from "../component/keySequence";
import { useState } from "react";
import AdminUI from "../component/adminUI";

const Remarks = () => {

  const [open, setOpen] = useState<boolean>(false)

  useKeySequence(() => {
    setOpen(!open)
  });


  return (
    <div className="h-screen w-screen  py-5 flex flex-col gap-y-4 dark:bg-slate-800">
      <div className="flex justify-between px-10">
        <BreadCrumb />
      </div>
      <DynamicColumn />
      {open && <AdminUI />}
    </div>
  );
};

export default Remarks;
