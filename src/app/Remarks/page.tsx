import DynamicColumn from "./component/dynamicColumn";
import BreadCrumb from "../component/breadcrumb";
import Image from "next/image";
import kkk from "../../lib/image/KKK.png";

const Remarks = () => {
  return (
    <div className="h-screen w-screen  py-5 flex flex-col gap-y-4 dark:bg-slate-800">
      <div className="flex justify-between px-10">
        <BreadCrumb />
        <Image src={kkk} alt="Description of image" width={60} height={30} />
      </div>
      <DynamicColumn />
    </div>
  );
};

export default Remarks;
