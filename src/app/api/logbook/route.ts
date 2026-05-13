// src/app/api/logbook/route.ts
// Google Sheets CRUD for Document Logbook
// Supports two sheets: OUTGOING and INCOMING
// Sheet columns (A–F): Control Number | Date | Type | Subject of the Document | Name of Sender and Copy Furnished | Notes

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { tryAuth } from "@/lib/auth/requireAuth";

type Direction = "OUTGOING" | "INCOMING";

const HEADERS = [
  "Control Number",
  "Date",
  "Type",
  "Subject of the Document",
  "Name of Sender and Copy Furnished",
  "Notes",
];

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

function dataRange(direction: Direction) {
  return `${direction}!A2:F`;
}

function headerRange(direction: Direction) {
  return `${direction}!A1:F1`;
}

async function ensureSheet(
  sheets: any,
  spreadsheetId: string,
  direction: Direction,
) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.find(
    (s: any) => s.properties?.title === direction,
  );

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: direction } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange(direction),
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [HEADERS] },
    });
  }
}

// Helper: parse control number back to type/year/num
function parseCN(cn: string): { type: "R" | "E"; year: number; num: number } {
  // format: KKK-E-25-0001
  const parts = cn.split("-");
  return {
    type: (parts[1] ?? "E") as "R" | "E",
    year: parseInt(parts[2] ?? "25"),
    num: parseInt(parts[3] ?? "1"),
  };
}

// GET — fetch all entries from a specific direction sheet
export async function GET(req: NextRequest) {
  const [user, errRes] = await tryAuth();
  if (errRes) return errRes;

  const { searchParams } = new URL(req.url);
  const spreadsheetId = searchParams.get("sheetId");
  const direction = (searchParams.get("direction") ?? "OUTGOING") as Direction;

  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "Missing sheetId parameter." },
      { status: 400 },
    );
  }
  if (direction !== "OUTGOING" && direction !== "INCOMING") {
    return NextResponse.json({ error: "Invalid direction." }, { status: 400 });
  }

  try {
    const sheets = getSheets();
    await ensureSheet(sheets, spreadsheetId, direction);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: dataRange(direction),
    });

    const rows = (res.data.values ?? []) as string[][];
    const entries = rows.map((row, index) => {
      const cn = row[0] ?? "";
      const parsed = parseCN(cn);
      return {
        rowIndex: index + 2, // 1-based, row 1 = header
        cn,
        date: row[1] ?? "",
        type: parsed.type,
        year: parsed.year,
        num: parsed.num,
        subject: row[3] ?? "",
        sender: row[4] ?? "",
        notes: row[5] ?? "",
      };
    });

    return NextResponse.json({ entries });
  } catch (err: any) {
    console.error(`[logbook GET ${direction}]`, err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch logbook." },
      { status: 500 },
    );
  }
}

// POST — append a new entry to the correct direction sheet
export async function POST(req: NextRequest) {
  const [user, errRes] = await tryAuth();
  if (errRes) return errRes;

  const { spreadsheetId, direction, entry } = await req.json();

  if (!spreadsheetId || !entry || !direction) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  try {
    const sheets = getSheets();
    await ensureSheet(sheets, spreadsheetId, direction as Direction);

    // Columns: Control Number | Date | Type | Subject | Sender | Notes
    const row = [
      entry.cn,
      `'${entry.date}`, // ← apostrophe prefix forces plain text in Sheets
      entry.type,
      entry.subject,
      entry.sender,
      entry.notes ?? "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: dataRange(direction),
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[logbook POST ${direction}]`, err);
    return NextResponse.json( 
      { error: err?.message ?? "Failed to save entry." },
      { status: 500 },
    );
  }
}

// PUT — update an existing entry by row index in the correct direction sheet
export async function PUT(req: NextRequest) {
  const [user, errRes] = await tryAuth();
  if (errRes) return errRes;

  const { spreadsheetId, direction, rowIndex, entry } = await req.json();

  if (!spreadsheetId || !direction || !rowIndex || !entry) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  try {
    const sheets = getSheets();

    const row = [
      entry.cn,
      entry.date,
      entry.type,
      entry.subject,
      entry.sender,
      entry.notes ?? "",
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${direction}!A${rowIndex}:F${rowIndex}`,
      valueInputOption: "RAW", // ← was "USER_ENTERED"
      requestBody: { values: [row] },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[logbook PUT ${direction}]`, err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to update entry." },
      { status: 500 },
    );
  }
}

// DELETE — delete a row from the correct direction sheet
export async function DELETE(req: NextRequest) {
  const [user, errRes] = await tryAuth();
  if (errRes) return errRes;

  const { spreadsheetId, direction, rowIndex } = await req.json();

  if (!spreadsheetId || !direction || !rowIndex) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  try {
    const sheets = getSheets();

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = meta.data.sheets?.find(
      (s: any) => s.properties?.title === direction,
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
                endIndex: rowIndex, // exclusive
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[logbook DELETE ${direction}]`, err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to delete entry." },
      { status: 500 },
    );
  }
}
