const ModalLoading = ({ open, cancelProcess, progress, totalImages }: {
    open: boolean,
    cancelProcess: () => void,
    progress: number,
    totalImages: number
}) => {
    if (!open) return null;

    const percentage = totalImages > 0 ? Math.round((progress / totalImages) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative w-[420px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 border border-gray-100 dark:border-gray-800">

                {/* Spinner + icon */}
                <div className="relative flex items-center justify-center w-16 h-16">
                    <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                        <circle
                            cx="32" cy="32" r="28"
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
                            className="transition-all duration-300"
                        />
                    </svg>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
                </div>

                {/* Text */}
                <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Processing images
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {progress} of {totalImages} complete
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {/* Cancel */}
                <button
                    onClick={cancelProcess}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default ModalLoading;