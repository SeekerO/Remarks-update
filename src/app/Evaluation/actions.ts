// app/actions.ts
"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { google } from "googleapis";

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

// Ensure all required environment variables are set
if (!clientEmail || !privateKey) {
  console.error(
    "Missing Google Sheets API credentials or Spreadsheet ID in environment variables."
  );
}

// Initialize Google Sheets API client
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
  // Define the scope for read/write access to spreadsheets
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export async function fetchSheetData(
  range: string,
  spreadsheetId: string
): Promise<string[][] | null> {
  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is not configured.");
  }
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response?.data.values || null;
  } catch (error: any) {
    console.error("Error from Google Sheets API:", error); // <-- Change error.message to error
    throw new Error(`Failed to fetch sheet data: ${error.message}`); // Keep this line as is for client-side message
  }
}

export async function updateSheetData(
  range: string,
  spreadsheetId: string,
  values: string[][]
): Promise<void> {
  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is not configured.");
  }
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range,
      valueInputOption: "RAW", // How the input data should be interpreted.
      // 'RAW' means the values are inserted exactly as they are.
      // 'USER_ENTERED' means the values will be parsed as if entered into the UI
      // (e.g., "1/2" becomes a date, "=SUM(A1:A2)" becomes a formula).
      requestBody: {
        values: values,
      },
    });
  } catch (error: any) {
    console.error("Error updating data in Google Sheets:", error.message);
    throw new Error(`Failed to update sheet data: ${error.message}`);
  }
}
