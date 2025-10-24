"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */


import { useAuth } from "../Chat/AuthContext";
import DynamicColumn from "./component/dynamicColumn";
import BreadCrumb from "../component/breadcrumb";

const Remarks = () => {

  const { user } = useAuth();

  if (user || (user as any)?.canChat === true)

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
