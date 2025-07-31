"use client"

import DynamicColumn from "./component/dynamicColumn";
import BreadCrumb from "../component/breadcrumb";

const Remarks = () => {
  // const [open, setOpen] = useState<boolean>(false)

  // useKeySequence(() => {
  //   setOpen(!open)
  // });


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
