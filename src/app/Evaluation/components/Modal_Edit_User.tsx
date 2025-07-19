'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import extractIdFromUrl from '@/lib/util/extractIdFromURL';
import React, { useRef, useEffect, useState } from 'react';
import { IoMdClose } from "react-icons/io";
import { IoOpenOutline } from "react-icons/io5";
// Define the shape of a row dynamically
interface SheetRow extends Record<string, string> {
    id: string;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editedRow: SheetRow | null;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    headers: string[]; // Pass headers to dynamically render input fields
}

export default function Modal({ isOpen, onClose, onSave, editedRow, handleChange, headers }: ModalProps) {
    // const ref = useRef<HTMLDivElement>(null)
    const [url, setURL] = useState<string>("")
    const [open, setOpen] = useState<boolean>(false)
    const [prevData, setPrevData] = useState<any>("")


    useEffect(() => {
        setPrevData(editedRow)
    }, [])


    const handleCloseModal = () => {
        if (JSON.stringify(editedRow) !== JSON.stringify(prevData)) {
            const userConfirmed = confirm("It seems like you have edited data. Do you still want to continue without saving?");
            if (userConfirmed) {
                onClose();
            }

        } else {
            onClose();
        };
    }


    const handleClose = () => {
        setOpen(false)
    }

    const handleOpen = (link: string) => {
        setURL(link)
        setOpen(true)
    }


    if (!isOpen || !editedRow) return null;



    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 font-inter">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className='flex items-center justify-between mb-6 '>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Edit Record</h2>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            Cancel
                        </button>
                        {JSON.stringify(prevData) !== JSON.stringify(editedRow) && <button
                            type="button"
                            onClick={onSave}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                            Save Changes
                        </button>}

                    </div>
                </div>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {headers.map((header) => (
                        <div key={header} className="mb-4">
                            <label htmlFor={header} className="block text-sm font-medium text-gray-200 dark:text-gray-400 mb-2  bg-slate-500 dark:bg-slate-700 p-2 rounded-md">
                                {header}
                            </label>
                            <div className='flex gap-2 items-center'>
                                <input
                                    type={header.toLowerCase().includes('email') ? 'email' : 'text'} // Basic type inference
                                    id={header}
                                    name={header}
                                    value={editedRow[header] || ''}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                />
                                {editedRow[header].includes("https://") &&
                                    <a onClick={() => handleOpen(editedRow[header])}><IoOpenOutline size={30} className='cursor-pointer' /></a>
                                }

                            </div>
                        </div>
                    ))}
                </form>

            </div>
            <ViewModal url={url} isOpen={open} onClose={handleClose} />
        </div>
    );
}

function ViewModal({ isOpen, onClose, url }: { isOpen: boolean, onClose: () => void, url: string }) {
    const ref = useRef<HTMLDivElement>(null);

    const id = extractIdFromUrl(url)

    const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[60] p-4 font-inter">
            <div ref={ref} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">View Content</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                    >
                        <IoMdClose size={30} />
                    </button>
                </div>

                <div className="flex-grow">
                    {/* Ensure the URL uses HTTPS */}
                    <iframe
                        src={`https://drive.google.com/file/d/${id}/preview`}
                        title="Embedded Content"
                        className="w-full h-full border-0 rounded-md"
                        allowFullScreen
                    >
                        Your browser does not support iframes.
                    </iframe>
                </div>
            </div>
        </div>
    );
}