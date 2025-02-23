"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface ExcelRow {
    [key: string]: string;
}

export default function ExcelUploader() {
    const [data, setData] = useState<ExcelRow[]>([]);

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const binaryString = e.target?.result;
            if (!binaryString) return;

            const workbook = XLSX.read(binaryString, { type: "binary" });

            // Get first sheet name
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON with empty cells replaced by a space
            let jsonData: ExcelRow[] = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });

            // Ensure all values are strings and replace empty values with a space
            jsonData = jsonData.map((row) =>
                Object.fromEntries(
                    Object.entries(row).map(([key, value]) => [
                        key,
                        typeof value === "string" ? value.trim() || " " : value !== undefined ? String(value) : " ",
                    ])
                )
            );

            setData(jsonData);

            // Save to localStorage
            localStorage.setItem("excelData", JSON.stringify(jsonData));
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="p-4 w-screen overflow-auto">
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="mb-4" />

            {data.length > 0 && (
                <table className="w-full border border-gray-300 mt-4">
                    <thead>
                        <tr className="bg-gray-200">
                            {Object.keys(data[0]).map((key) => (
                                <th key={key} className="border px-2 py-1">{key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border">
                                {Object.values(row).map((cell, cellIndex) => {
                                    let textColor = "";

                                    // Apply color only to the first column
                                    if (cellIndex === 0) {
                                        const cellValue = cell?.toString().toLowerCase().trim() || "";
                                        if (cellValue.includes("full")) textColor = "text-green-600";
                                        else if (cellValue.includes("non")) textColor = "text-red-600";
                                        else if (cellValue.includes("partial")) textColor = "text-yellow-600";
                                    }

                                    return (
                                        <td key={cellIndex} className={`border px-2 py-1 ${textColor}`}>
                                            {cell}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
