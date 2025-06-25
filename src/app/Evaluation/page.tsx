// pages/index.tsx
// This is the main application entry point (for Next.js Pages Router).
"use client"

import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import SheetViewer from './component/SheerViewer'; // Adjust path
import { extractSheetId } from './component/fetcherExcel'; // Import the helper function
import BreadCrumb from '../component/breadcrumb';

const HomePage: React.FC = () => {
  // State for sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // State for user input: Google Sheet URL and Sheet Name
  const [sheetLink, setSheetLink] = useState<string>('');
  const [sheetName, setSheetName] = useState<string>('');
  // State for the actual Sheet ID derived from the link
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  // State to trigger fetching when the user clicks 'Load Data'
  const [loadDataTrigger, setLoadDataTrigger] = useState(0);

  // Effect to update currentSheetId when sheetLink changes
  useEffect(() => {
    setCurrentSheetId(extractSheetId(sheetLink));
  }, [sheetLink]);


  const handleLoadData = () => {
    // Increment trigger to force SheetViewer to re-fetch
    setLoadDataTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex font-inter overflow-hidden">


      {/* Retractable Sidebar (Left Side) */}
      <aside
        className={`bg-slate-100 dark:bg-gray-700 text-slate-200 p-4 flex flex-col transition-all duration-300 ease-in-out
                   ${sidebarOpen ? 'w-64' : 'w-16'} min-h-screen shrink-0 `}
      >
        <BreadCrumb />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 mb-4 rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 self-end"
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {sidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {sidebarOpen && (
          <div className="flex flex-col space-y-4 text-gray-500 ">
            <div>
              <label htmlFor="sheetLink" className="block text-sm font-medium mb-1">
                Google Sheet Link:
              </label>
              <input
                type="text"
                id="sheetLink"
                className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                placeholder="e.g., https://docs.google.com/spreadsheets/d/..."
                value={sheetLink}
                onChange={(e) => setSheetLink(e.target.value)}
              />
              {!currentSheetId && sheetLink && (
                <p className="text-red-300 text-xs mt-1">Invalid Google Sheet URL.</p>
              )}
            </div>

            <div>
              <label htmlFor="sheetName" className="block text-sm font-medium  mb-1">
                Sheet Name:
              </label>
              <input
                type="text"
                id="sheetName"
                className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                placeholder="e.g., Sheet1 or MyDataTab"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
            </div>

            <button
              onClick={handleLoadData}
              disabled={!currentSheetId || !sheetName}
              className="mt-4 w-full p-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              Load Data
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area (Right Side - Preview) */}
      <main className="flex-grow bg-gray-50 p-4 overflow-hidden h-screen">
        <SheetViewer
          key={loadDataTrigger} // Key change forces re-render and re-fetch in SheetViewer
          sheetId={currentSheetId}
          sheetName={sheetName}
        />
      </main>
    </div>
  );
};

export default HomePage;
