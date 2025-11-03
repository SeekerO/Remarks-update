
// Ensure all props are correctly typed
const ModalLoading = ({ open, cancelProcess, progress, totalImages }: { open: boolean, cancelProcess: () => void, progress: number, totalImages: number }) => {
    if (!open) return null

    // Calculate percentage, handling division by zero
    const percentage = totalImages > 0 ? Math.round((progress / totalImages) * 100) : 0;

    return (
        <div className="h-[100vh] w-auto absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
            <div className="h-[200px] w-[400px] flex flex-col items-center justify-center bg-white dark:bg-gray-900 shadow-lg shadow-gray-600 dark:shadow-black rounded-lg ">
                <div className="flex flex-col items-center gap-4">
                    <label className="text-[20px] font-semibold text-gray-800 dark:text-gray-100">
                        Processing images... ({progress}/{totalImages})
                    </label>
                    <div className="w-64 bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                        <div
                            className="bg-blue-600 h-4 rounded-full"
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <label className="text-[16px] font-medium text-gray-600 dark:text-gray-300">
                        {percentage}% Complete
                    </label>
                </div>
                <button onClick={cancelProcess} className="mt-7 text-white bg-red-700 px-7 py-0.5 rounded-xl font-semibold">CANCEL</button>
            </div>
        </div>
    )
}

export default ModalLoading;