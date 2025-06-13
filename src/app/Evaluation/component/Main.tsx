"use client";

import { useEffect, useState } from "react";
import { fetchSheetData } from "./fetcherExcel";

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

const Main = () => {
  const [data, setData] = useState<
    Record<string, string | number | boolean | null>[] | null
  >(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingState({ isLoading: true, error: null });

        const originalLog = console.log;
        const logs: string[] = [];
        console.log = (...args) => {
          logs.push(args.join(" "));
          originalLog(...args);
        };

        const rows = await fetchSheetData();

        console.log = originalLog;
        setDebugInfo(logs.join("\n"));

        setData(rows);
        setLoadingState({ isLoading: false, error: null });
      } catch (error) {
        setLoadingState({
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    };

    loadData();
  }, []);

  if (loadingState.isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <span>Loading sheet data...</span>
        </div>
      </div>
    );
  }

  if (loadingState.error) {
    return (
      <div className="p-4">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-bold text-lg mb-2">Error Loading Data</h3>
          <p className="mb-4">{loadingState.error}</p>
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">Troubleshooting:</h4>
            <ul className="list-disc ml-4 space-y-1">
              <li>Make sure your Google Sheet is publicly accessible</li>
              <li>Verify the SHEET_ID and SHEET_NAME are correct</li>
              <li>Check that the sheet contains data</li>
              <li>
                Ensure the sheet is published to web (File → Share → Publish to
                web)
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>

        {debugInfo && (
          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              View Debug Information
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
              {debugInfo}
            </pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full">
      <h1 className="text-2xl font-bold mb-4">Google Sheets Data</h1>

      {data && data.length > 0 ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">Found {data.length} rows</p>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto mb-6 border border-gray-200 rounded-lg">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(data[0]).map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left border-b border-gray-200 font-medium text-gray-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-3 text-sm text-gray-900"
                      >
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {debugInfo && (
            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                View Debug Information
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                {debugInfo}
              </pre>
            </details>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              View Raw JSON Data
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg">No data found</div>
          <p className="text-sm text-gray-400 mt-2">
            Make sure your sheet has data and is properly configured
          </p>
        </div>
      )}
    </div>
  );
};

export default Main;
