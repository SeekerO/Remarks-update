"use client"

import DynamicColumn from "./component/dynamicColumn";

const Remarks = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-[#070710] text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">
      {/* Radial glow - Adjusted for light mode visibility */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 dark:opacity-15"
          style={{ background: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.5) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 dark:opacity-10"
          style={{ background: "radial-gradient(circle at 0% 100%, rgba(20,184,166,0.4) 0%, transparent 60%)" }} />
      </div>
      <div className="relative z-10 p-5 h-full w-full">
        <DynamicColumn />
      </div>
    </div>
  );
};

export default Remarks;