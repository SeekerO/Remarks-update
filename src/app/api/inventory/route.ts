// src/app/api/inventory/route.ts
// Google Sheets CRUD for Property Inventory
//
// Fixed columns (A–I):
// Serial Number | Property Number | Article | Description | Unit Price |
// Date Purchased | Location | Using By | Committee/Department
//
// Dynamic extra columns (J onwards) are appended as needed based on request payload.
// The sheet header row is kept in sync automatically — new columns are added when first used.

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SHEET_NAME = "Inventory";

const CORE_HEADERS = [
  "Serial Number",
  "Property Number",
  "Article",
  "Description",
  "Unit Price",
  "Date Purchased",
  "Location",
  "Using By",
  "Committee/Department",
] as const;

const CORE_COUNT = CORE_HEADERS.length; // 9

// ── Auth ───────────────────────────────────────────────────────────────────────

function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// ── Column letter helpers ──────────────────────────────────────────────────────

/** Convert 0-based column index → spreadsheet letter (0→A, 25→Z, 26→AA …) */
function colLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

function dataRange(totalCols: number): string {
  return `${SHEET_NAME}!A2:${colLetter(totalCols - 1)}`;
}

function headerRange(totalCols: number): string {
  return `${SHEET_NAME}!A1:${colLetter(totalCols - 1)}1`;
}

// ── Sheet / header bootstrap ───────────────────────────────────────────────────

/**
 * Ensures the Inventory sheet tab exists.
 * Returns the current header row (may be empty if brand new).
 */
async function ensureSheet(sheets: any, spreadsheetId: string): Promise<string[]> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.find(
    (s: any) => s.properties?.title === SHEET_NAME
  );

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
      },
    });
    // Write core headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:${colLetter(CORE_COUNT - 1)}1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [CORE_HEADERS] },
    });
    return [...CORE_HEADERS];
  }

  // Read existing headers
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!1:1`,
  });
  return (headerRes.data.values?.[0] ?? []) as string[];
}

/**
 * Adds any missing extra column headers to the sheet and returns the full
 * updated header list.
 */
async function syncHeaders(
  sheets: any,
  spreadsheetId: string,
  currentHeaders: string[],
  extraLabels: string[]
): Promise<string[]> {
  const missing = extraLabels.filter((l) => !currentHeaders.includes(l));
  if (missing.length === 0) return currentHeaders;

  const updated = [...currentHeaders, ...missing];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:${colLetter(updated.length - 1)}1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [updated] },
  });
  return updated;
}

// ── Row builder ────────────────────────────────────────────────────────────────

/**
 * Builds a full row array aligned to `headers`.
 * Core fields occupy cols 0-8; extra columns occupy 9+.
 */
function buildRow(
  entry: Record<string, string>,
  extraColumns: { label: string; value: string }[],
  headers: string[]
): string[] {
  const row: string[] = new Array(headers.length).fill("");

  // Core fields — always at fixed positions 0-8
  row[0] = entry.serialNumber ?? "";
  row[1] = entry.propertyNumber ?? "";
  row[2] = entry.article ?? "";
  row[3] = entry.description ?? "";
  row[4] = entry.unitPrice ?? "";
  row[5] = entry.datePurchased ?? "";
  row[6] = entry.location ?? "";
  row[7] = entry.usingBy ?? "";
  row[8] = entry.department ?? "";

  // Extra fields — look up position by label in headers
  for (const { label, value } of extraColumns) {
    const idx = headers.indexOf(label);
    if (idx !== -1) row[idx] = value ?? "";
  }

  return row;
}

// ── GET — fetch all inventory entries ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const spreadsheetId = searchParams.get("sheetId");
  // Optional: list of extra column labels the UI knows about (for reference)
  // Not strictly required for GET — we return whatever columns the sheet has.

  if (!spreadsheetId) {
    return NextResponse.json({ error: "Missing sheetId parameter." }, { status: 400 });
  }

  try {
    const sheets = getSheets();
    const headers = await ensureSheet(sheets, spreadsheetId);
    const totalCols = Math.max(headers.length, CORE_COUNT);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: dataRange(totalCols),
    });

    const rows = (res.data.values ?? []) as string[][];

    const entries = rows.map((row, index) => {
      // Build extra fields map from columns beyond core 9
      const extra: Record<string, string> = {};
      for (let i = CORE_COUNT; i < headers.length; i++) {
        const label = headers[i];
        if (label) extra[label] = row[i] ?? "";
      }

      return {
        rowIndex: index + 2, // row 1 = header
        serialNumber: row[0] ?? "",
        propertyNumber: row[1] ?? "",
        article: row[2] ?? "",
        description: row[3] ?? "",
        unitPrice: row[4] ?? "",
        datePurchased: row[5] ?? "",
        location: row[6] ?? "",
        usingBy: row[7] ?? "",
        department: row[8] ?? "",
        extra,
      };
    });

    return NextResponse.json({ entries, headers });
  } catch (err: any) {
    console.error("[inventory GET]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch inventory." },
      { status: 500 }
    );
  }
}

// ── POST — append a new inventory entry ───────────────────────────────────────

export async function POST(req: NextRequest) {
  const { spreadsheetId, entry, extraColumns = [] } = await req.json();
  // extraColumns: { label: string; value: string }[]

  if (!spreadsheetId || !entry) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }
  if (!entry.serialNumber || !entry.propertyNumber || !entry.article) {
    return NextResponse.json(
      { error: "Serial Number, Property Number, and Article are required." },
      { status: 400 }
    );
  }

  try {
    const sheets = getSheets();
    let headers = await ensureSheet(sheets, spreadsheetId);

    // Add any new extra column headers to the sheet
    const extraLabels = extraColumns.map((c: { label: string }) => c.label);
    headers = await syncHeaders(sheets, spreadsheetId, headers, extraLabels);

    const row = buildRow(entry, extraColumns, headers);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: dataRange(headers.length),
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[inventory POST]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to save entry." },
      { status: 500 }
    );
  }
}

// ── PUT — update an existing entry by row index ───────────────────────────────

export async function PUT(req: NextRequest) {
  const { spreadsheetId, rowIndex, entry, extraColumns = [] } = await req.json();

  if (!spreadsheetId || !rowIndex || !entry) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  try {
    const sheets = getSheets();
    let headers = await ensureSheet(sheets, spreadsheetId);

    // Sync any new columns
    const extraLabels = extraColumns.map((c: { label: string }) => c.label);
    headers = await syncHeaders(sheets, spreadsheetId, headers, extraLabels);

    const row = buildRow(entry, extraColumns, headers);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A${rowIndex}:${colLetter(headers.length - 1)}${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[inventory PUT]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to update entry." },
      { status: 500 }
    );
  }
}

// ── DELETE — remove a row by index ────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { spreadsheetId, rowIndex } = await req.json();

  if (!spreadsheetId || !rowIndex) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  try {
    const sheets = getSheets();

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = meta.data.sheets?.find(
      (s: any) => s.properties?.title === SHEET_NAME
    );
    const sheetId = sheet?.properties?.sheetId ?? 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowIndex - 1, // 0-based
                endIndex: rowIndex,       // exclusive
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[inventory DELETE]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to delete entry." },
      { status: 500 }
    );
  }
}