// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-unused-vars

export interface SheetRow {
  [key: string]: string | number | boolean | null;
}

// fetcherExcel.ts
const SHEET_ID = "1CCOXZ_ZMMSoRQltEIfZ6VOBfQc9RhjoJoGcXTsKe0gQ";
const SHEET_NAME = "REGION V"; // or your sheet name

export async function fetchSheetData(): Promise<SheetRow[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
      SHEET_NAME
    )}`;

    console.log("Fetching from URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log("Raw response:", text.substring(0, 200) + "...");

    // Google Sheets returns JSONP, we need to extract the JSON part
    // The response format is: google.visualization.Query.setResponse({...});
    let jsonString = text;

    // Remove the JSONP wrapper if it exists
    if (text.includes("google.visualization.Query.setResponse(")) {
      const start = text.indexOf("(") + 1;
      const end = text.lastIndexOf(")");
      jsonString = text.substring(start, end);
    } else {
      // Alternative method: find JSON object
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("No JSON found in response");
      }
      jsonString = text.substring(jsonStart, jsonEnd);
    }

    console.log("Extracted JSON:", jsonString.substring(0, 200) + "...");

    const json = JSON.parse(jsonString);
    console.log("Parsed JSON structure:", json);

    // Check if there's an error in the response
    if (json.status === "error") {
      throw new Error(
        `Google Sheets API error: ${
          json.errors?.[0]?.detailed_message || "Unknown error"
        }`
      );
    }

    // Check if the response has the expected structure
    if (!json.table || !json.table.rows) {
      console.log("Available keys:", Object.keys(json));
      throw new Error("Unexpected response structure - no table.rows found");
    }

    console.log("Number of rows:", json.table.rows.length);
    console.log("First few rows:", json.table.rows.slice(0, 3));

    // Process the rows
    const processedRows = json.table.rows.map((row: any, index: number) => {
      const cells = row.c || [];
      console.log(`Row ${index} cells:`, cells);

      return cells.map((cell: any) => {
        if (!cell) return "";

        // Handle different value types
        if (cell.v !== undefined && cell.v !== null) {
          return cell.v;
        }

        if (cell.f !== undefined) {
          return cell.f; // formatted value
        }

        return "";
      });
    });

    console.log("Processed rows:", processedRows);

    if (processedRows.length === 0) {
      return [];
    }

    // First row should be headers
    const headers = processedRows[0].map((header: any) =>
      header
        ? header.toString().trim()
        : `Column_${Math.random().toString(36).substr(2, 9)}`
    );

    console.log("Headers:", headers);

    // Convert remaining rows to objects
    const dataRows = processedRows.slice(1);

    const result = dataRows.map((row: any[]) => {
      const obj: SheetRow = {};

      headers.forEach((header: string, colIndex: number) => {
        const value = row[colIndex];

        // Handle different data types properly
        if (value === undefined || value === null || value === "") {
          obj[header] = "";
        } else if (typeof value === "string") {
          obj[header] = value;
        } else if (typeof value === "number") {
          obj[header] = value;
        } else if (typeof value === "boolean") {
          obj[header] = value;
        } else {
          obj[header] = String(value);
        }
      });

      return obj;
    });

    console.log("Final result:", result);
    return result;
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw error;
  }
}
