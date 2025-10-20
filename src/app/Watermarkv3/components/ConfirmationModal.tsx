import React from "react";

const ConfirmationModal = ({ open, setOpen, UsePreivew }: { open: boolean, setOpen: () => void, UsePreivew: () => void }) => {

    if (!open) return

    return (
        <div className="z-50 fixed inset-0 h-screen w-screen justify-center items-center flex backdrop-blur-[1px] bg-black/20">
            <div className="bg-slate-900 w-[350px] h-[150px] rounded-md shadow-md flex flex-col items-center relative">
                <p className="mt-10">Do you want to use your previews template?</p>
                <div className="border-t-[1px] border-gray-700 w-full absolute grid grid-cols-2 bottom-0">
                    <button onClick={() => UsePreivew()} className="text-green-500 w-full h-full hover:bg-blue-500 hover:text-white py-3">YES</button>
                    <button onClick={() => setOpen()} className="text-red-500 w-full h-full hover:bg-blue-500 hover:text-white py-3">NO</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
