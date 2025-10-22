'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchSheetData, updateSheetData } from './actions'; // Server Actions
import Modal from './components/Modal_Edit_User'; // Assuming this path is correct
import { HiInformationCircle } from "react-icons/hi";
import { IoSearchOutline } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import BreadCrumb from '../component/breadcrumb';
import extractIdFromUrl from '@/lib/util/extractIdFromURL';
import { useAuth } from '../Chat/AuthContext';
import Link from 'next/link';
// Define the shape of a row dynamically
interface SheetRow extends Record<string, string> {
    id: string; // Assuming the first column serves as a unique identifier
}

type SheetRange = {
    sheetName: string,
    sheetID: string,
    colRangeFrom: string,
    colRangeTo: string,
    colShowFrom: number,
    colShowTo: number

}

export default function App() {

    const { user } = useAuth();
    const [data, setData] = useState<SheetRow[]>([]);
    const [loading, setLoading] = useState(false); // Changed to false, as data won't load on initial render
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const [editedRow, setEditedRow] = useState<SheetRow | null>(null);
    const [message, setMessage] = useState('');
    const [headers, setHeaders] = useState<string[]>([]); // To store dynamic headers
    const [sheetRange, setSheetRange] = useState<SheetRange>({
        sheetName: "", sheetID: "", colRangeFrom: "A", colRangeTo: "Z", colShowFrom: 6,
        colShowTo: 7
    })

    const [searchTerm, setSearchTerm] = useState<string>("")
    const [inputError, setInputError] = useState<string>(""); // New state for input validation error


    useEffect(() => { // Changed to useEffect
        const meta_data = sessionStorage.getItem("meta_data");
        if (meta_data === null) { // Corrected condition
            return;
        } else {
            try {
                setSheetRange(JSON.parse(meta_data));
            } catch (error) {
                console.error("Error parsing meta_data from localStorage:", error);
            }
        }
    }, []);

    // Function to fetch data from Google Sheets
    const loadSheetData = useCallback(async () => {
        setLoading(true);
        setMessage('');
        setInputError(''); // Clear any previous input errors

        try {
            // Adjust '(OLD)REGION V!A:Z' if your sheet has more columns or a different name.
            const sheetNameCombinedRange = sheetRange.sheetName + "!" + sheetRange.colRangeFrom + ":" + sheetRange.colRangeTo


            const allSheetData = await fetchSheetData(sheetNameCombinedRange, extractIdFromUrl(sheetRange.sheetID.toString()));

            if (allSheetData && allSheetData.length > 0) {
                // The first row contains the headers
                const fetchedHeaders = allSheetData[0];
                setHeaders(fetchedHeaders);

                // Map the rest of the rows (data) using the fetched headers
                const parsedData: SheetRow[] = allSheetData.slice(1).map((row, rowIndex) => {
                    const rowObject: Partial<SheetRow> = {};
                    fetchedHeaders.forEach((header, colIndex) => {
                        // Use the header as the key and the corresponding cell value
                        rowObject[header] = row[colIndex] || '';
                    });
                    // Ensure 'id' is always present, using the value from the first column or generating one
                    // Using a combination of first column and row index for a more robust ID
                    rowObject.id = `${rowObject[fetchedHeaders[0]] || 'no-id'}-${rowIndex}`;
                    return rowObject as SheetRow;
                });
                setData(parsedData);
            } else {
                setData([]);
                setHeaders([]);
                setMessage('No data found in the Google Sheet, or the sheet is empty.');
            }
            sessionStorage.setItem("meta_data", JSON.stringify(sheetRange))
        } catch (error: any) {
            console.error('Error fetching sheet data:', error);
            setMessage(`Failed to fetch data: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);

        }
    }, [sheetRange.sheetName, sheetRange.sheetID]); // Depend on sheetRange values

    // Handle the click event for loading data
    const handleLoadDataClick = () => {
        if (!sheetRange.sheetID || !sheetRange.sheetName) {
            setInputError('Please enter both Google Sheet ID and Sheet Name.');
            setData([]); // Clear data if inputs are not filled
            setMessage(''); // Clear any previous messages
            return;
        }
        sessionStorage.setItem("meta_data", JSON.stringify(sheetRange))
        setInputError(''); // Clear error if inputs are filled
        loadSheetData();
    };

    // Handle opening the modal for editing a row
    const handleEdit = (row: SheetRow) => {
        setEditedRow({ ...row }); // Create a copy to edit
        setIsModalOpen(true); // Open the modal
    };

    // Handle input changes in the editing modal
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editedRow) {
            setEditedRow({
                ...editedRow,
                [e.target.name]: e.target.value,
            });
        }
    };

    // Handle saving changes to Google Sheets
    const handleSave = async () => {
        if (!editedRow || headers.length === 0) return;

        setLoading(true);
        setMessage('');
        setIsModalOpen(false); // Close modal immediately

        try {
            // Find the original row index based on the ID (assuming IDs are unique)
            // This is crucial because Google Sheets API updates by row index.
            const originalIndex = data.findIndex(row => row.id === editedRow.id);
            if (originalIndex === -1) {
                throw new Error('Original row not found for update.');
            }

            // Google Sheets rows are 1-indexed, and we skipped the header row,
            // so add 2 to get the correct sheet row number (1 for 1-indexing, 1 for header)
            const sheetRowNumber = originalIndex + 2;

            // Prepare the data to send to Google Sheets based on the current headers order.
            const valuesToUpdate: string[] = headers.map(header => editedRow[header] || '');

            // The range 'Sheet1!A${sheetRowNumber}' means update from column A
            // of the specific row number for the entire row based on the number of headers.

            const sheetRowToUpdate = sheetRange.sheetName + `!A` + sheetRowNumber


            await updateSheetData(sheetRowToUpdate, sheetRange.sheetID, [valuesToUpdate]); // Use the correct sheet name

            // Update the local state with the saved data
            setData(prevData =>
                prevData.map(row => (row.id === editedRow.id ? editedRow : row))
            );
            setMessage('Sheet updated successfully!');
        } catch (error: any) {
            console.error('Error updating sheet data:', error);
            setMessage(`Failed to update sheet: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
            setEditedRow(null); // Clear edited row data
        }
    };

    // Handle canceling edit
    const handleCancel = () => {
        setIsModalOpen(false); // Close the modal
        setEditedRow(null); // Clear edited row data
        setMessage(''); // Clear any messages
    };

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) {
            return data;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return data.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(lowerCaseSearchTerm)
            )
        );
    }, [data, searchTerm]);

    const handleChangeRange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "sheetID" || "sheetName" || "colShowFrom" || "colShowTo") {
            setSheetRange(prevRange => ({
                ...prevRange, // This spreads all existing properties of sheetRange
                [name]: value // This updates the specific property (from or to) that changed
            }));

        }
        else {
            setSheetRange(prevRange => ({
                ...prevRange, // This spreads all existing properties of sheetRange
                [name]: value.toUpperCase() // This updates the specific property (from or to) that changed
            }));
        }
    };

    const DeleteSavedData = () => {
        sessionStorage.removeItem("meta_data")
        window.location.reload()
    }




    if (!user || (user as any).canChat === false) {

        window.location.href = "/";

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Link href={"/"} className="text-gray-600 dark:text-gray-400 text-center px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md text-base font-medium transition-colors duration-300">
                    Please log in to access the Evaluation.
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen flex gap-2 justify-center py-10 px-4 sm:px-6 lg:px-8 font-inter">

            {/* SETTINGS    */}
            <div className='bg-gray-300 dark:bg-gray-700 h-fit w-[400px] rounded-md p-2 flex flex-col '>
                <div className='flex justify-between items-center mb-5'>
                    <label className='text-2xl font-bold text-gray-800 dark:text-white tracking-wider'>GOOGLE SHEET INFO</label>
                    <button onClick={DeleteSavedData} className='outline-none hover:text-red-500 text-2xl'>
                        <MdDelete />
                    </button>
                </div>
                <div className='w-full flex flex-col gap-2'>
                    <label htmlFor="sheetID" className='font-semibold text-gray-700 dark:text-gray-200'>Enter Google Sheet ID</label>
                    <input
                        id="sheetID"
                        type='text'
                        className='rounded-md py-2 px-3 text-black outline-none focus:ring-2 focus:ring-blue-500'
                        name='sheetID'
                        value={sheetRange.sheetID}
                        onChange={handleChangeRange}
                        placeholder='e.g., 1_AbcDEfGHIjKlMnoPqRsTuvWxyz'
                    />
                    <label htmlFor="sheetName" className='font-semibold text-gray-700 dark:text-gray-200'>Enter Google Sheet Name</label>
                    <input
                        id="sheetName"
                        type='text'
                        className='rounded-md py-2 px-3 text-black outline-none focus:ring-2 focus:ring-blue-500'
                        name='sheetName'
                        value={sheetRange.sheetName}
                        onChange={handleChangeRange}
                        placeholder='e.g., Sheet1 or MyDataTab'
                    />

                    <h3 className=' font-semibold text-gray-700 dark:text-gray-200 mt-2'>Sheet Column Range {`(Optional)`}</h3>
                    <div className='flex gap-2 items-center'>
                        <input
                            type='text'
                            className='py-1 px-3 w-[90px] rounded-md outline-none text-black focus:ring-2 focus:ring-blue-500'
                            onChange={handleChangeRange}
                            name='colRangeFrom'
                            value={sheetRange.colRangeFrom}
                            placeholder='A'
                        />
                        <span className='text-gray-700 dark:text-gray-200'>-</span>
                        <input
                            type='text'
                            className='py-1 px-3 w-[90px] rounded-md outline-none text-black focus:ring-2 focus:ring-blue-500'
                            onChange={handleChangeRange}
                            name='colRangeTo'
                            value={sheetRange.colRangeTo}
                            placeholder='Z'
                        />
                    </div>

                    <div className='border-t-2 border-slate-600 mt-2 flex flex-col gap-2 p-4 bg-slate-600 rounded-md'>
                        <label htmlFor="sheetName" className='font-semibold text-gray-700 dark:text-gray-200'>
                            Show Column From {`(Optional)`}
                        </label>
                        <input
                            id="sheetName"
                            type='number'
                            min={0}
                            className='rounded-md py-2 px-3 text-black outline-none focus:ring-2 focus:ring-blue-500'
                            name='colShowFrom'
                            value={sheetRange.colShowFrom}
                            onChange={handleChangeRange}
                            placeholder='e.g., 1 '
                        />
                        <label htmlFor="sheetName" className='font-semibold text-gray-700 dark:text-gray-200'>
                            Show Column To {`(Optional)`}
                        </label>
                        <input
                            id="sheetName"
                            type='number'
                            min={1}
                            className='rounded-md py-2 px-3 text-black outline-none focus:ring-2 focus:ring-blue-500'
                            name='colShowTo'
                            value={sheetRange.colShowTo}
                            onChange={handleChangeRange}
                            placeholder='e.g., 1 '
                        />
                        <span className='italic text-gray-200 tracking-wider'>{`Don't edit if not needed`}</span>
                    </div>
                    {inputError && (
                        <p className="text-red-500 text-sm mt-2">{inputError}</p>
                    )}
                    <button
                        onClick={handleLoadDataClick}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'LOAD DATA'}
                    </button>


                    {/* <pre className='w-full overflow-hidden'>{JSON.stringify(sheetRange, null, 2)}</pre> */}

                </div>
            </div>

            {/* DISPLAY    */}
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-7xl h-[90vh] overflow-auto">
                <BreadCrumb />
                <div className='flex justify-between items-center mb-6'>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white flex">
                        Google Sheets Data Editor
                    </h1>
                    <div className='flex items-center gap-2 border border-slate-300 dark:border-gray-600 p-1 rounded-md text-white px-2'>
                        <IoSearchOutline className='text-2xl text-gray-700 dark:text-gray-300' />
                        <input
                            type='search'
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='p-2 outline-none bg-transparent w-[20rem] text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
                            placeholder='Search all columns...'
                        />
                    </div>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 dark:border-blue-300"></div>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading data...</p>
                    </div>
                )}

                {message && (
                    <div className={`p-4 rounded-md mb-6 text-center text-lg ${message.includes('Failed') || message.includes('No data found') ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}`}>
                        {message}
                    </div>
                )}

                {!loading && data.length === 0 && !message && !inputError && (
                    <p className="text-center text-gray-600 dark:text-gray-300 text-lg py-8">
                        Enter Google Sheet ID and Sheet Name to load data.
                    </p>
                )}

                {!loading && data.length > 0 && (
                    <div className="overflow-x-auto rounded-lg shadow-md h-[65vh] overflow-auto">
                        <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                            <thead>
                                <th className='py-2 font-bold text-xl'>
                                    ACTION
                                </th>
                                <th className='py-2 font-semibold text-xl'>

                                </th>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {filteredData.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-gray-50  dark:hover:bg-gray-700 transition-colors text-center">
                                        <td className=" whitespace-nowrap text-gray-900 dark:text-gray-100 py-2.5">
                                            <button
                                                onClick={() => handleEdit(row)}
                                                className="inline-flex items-center text-md font-medium text-center w-[100px] h-[30px] justify-center border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors dark:bg-indigo-700 dark:hover:bg-indigo-800 gap-2"
                                            >
                                                <HiInformationCircle />View
                                            </button>
                                        </td>
                                        {headers.slice(sheetRange.colShowFrom, sheetRange.colShowTo).map((header) => (
                                            <td key={`${row.id}-${header}`} className="py-3 px-4 whitespace-nowrap text-gray-700 dark:text-gray-300 text-lg">
                                                {row[header]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-8 text-center">
                    <button
                        onClick={handleLoadDataClick} // Now calls handleLoadDataClick
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-800"
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            {/* Modal for editing */}
            {isModalOpen && editedRow && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCancel}
                    onSave={handleSave}
                    editedRow={editedRow}
                    handleChange={handleChange}
                    headers={headers}
                />
            )}
        </div>
    );
}
