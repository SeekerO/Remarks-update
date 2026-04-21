// File: TimerSettingsModal.tsx

import React from 'react';

interface TimerSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    hours: string;
    setHours: (value: string) => void;
    minutes: string;
    setMinutes: (value: string) => void;
    seconds: string;
    setSeconds: (value: string) => void;
    onApply: () => void;
}

const TimerSettingsModal: React.FC<TimerSettingsModalProps> = ({
    isOpen,
    onClose,
    hours,
    setHours,
    minutes,
    setMinutes,
    seconds,
    setSeconds,
    onApply,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Set Global Timer</h2>

                <div className="flex items-center space-x-2 mb-6">
                    <input
                        type="number"
                        placeholder="HH"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="w-1/3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-center"
                        min="0"
                        max="99"
                    />
                    <span className="text-xl dark:text-gray-400">:</span>
                    <input
                        type="number"
                        placeholder="MM"
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        className="w-1/3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-center"
                        min="0"
                        max="59"
                    />
                    <span className="text-xl dark:text-gray-400">:</span>
                    <input
                        type="number"
                        placeholder="SS"
                        value={seconds}
                        onChange={(e) => setSeconds(e.target.value)}
                        className="w-1/3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-center"
                        min="0"
                        max="59"
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onApply}
                        className="bg-purple-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-purple-700 transition-colors duration-200"
                    >
                        Apply Timer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimerSettingsModal;