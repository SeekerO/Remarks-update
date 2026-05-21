// src/app/api/logbook/route.ts
// Google Sheets CRUD for Document Logbook
// Sheet columns (A–G): Control Number | Date | Doc Type | Subject | Sender | Notes | Received Via

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

type Direction = "OUTGOING" | "INCOMING";

const HEADERS = [
  "Control Number",
  "Date",
  "Doc Type",
  "Subject of the Document",
  "Name of Sender and copy furnished",
  "Notes",
  "Received via",
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
  return `${direction}!A2:G`;
}

function headerRange(direction: Direction) {
  return `${direction}!A1:G1`;
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

// Parse CN to extract type (E/R), year, num
function parseCN(cn: string): { type: "R" | "E"; year: number; num: number } {
  const parts = cn.split("-");
  return {
    type: (parts[1] ?? "E") as "R" | "E",
    year: parseInt(parts[2] ?? "25"),
    num: parseInt(parts[3] ?? "1"),
  };
}

const VALID_DOC_TYPES = ["Memorandum", "Letter", "Case Order"] as const;
type DocType = typeof VALID_DOC_TYPES[number];

function parseDocType(raw: string): DocType {
  return VALID_DOC_TYPES.includes(raw as DocType)
    ? (raw as DocType)
    : "Memorandum";
}

// GET — fetch all entries
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const spreadsheetId = searchParams.get("sheetId");
  const direction = (searchParams.get("direction") ?? "OUTGOING") as Direction;

  if (!spreadsheetId)
    return NextResponse.json({ error: "Missing sheetId parameter." }, { status: 400 });
  if (direction !== "OUTGOING" && direction !== "INCOMING")
    return NextResponse.json({ error: "Invalid direction." }, { status: 400 });

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
        rowIndex: index + 2,
        cn,
        date:        row[1] ?? "",
        docType:     parseDocType(row[2] ?? ""),  // col C
        subject:     row[3] ?? "",                // col D
        sender:      row[4] ?? "",                // col E
        notes:       row[5] ?? "",                // col F
        receivedVia: row[6] ?? "",                // col G
        // derived from CN — not a sheet column
        type: parsed.type,
        year: parsed.year,
        num:  parsed.num,
      };
    });

    return NextResponse.json({ entries });
  } catch (err: any) {
    console.error(`[logbook GET ${direction}]`, err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch." }, { status: 500 });
  }
}

// POST — append a new entry
export async function POST(req: NextRequest) {
  const { spreadsheetId, direction, entry } = await req.json();

  if (!spreadsheetId || !entry || !direction)
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  try {
    const sheets = getSheets();
    await ensureSheet(sheets, spreadsheetId, direction as Direction);

    // A: CN | B: Date | C: Doc Type | D: Subject | E: Sender | F: Notes | G: Received Via
    const row = [
      entry.cn,
      `'${entry.date}`,
      entry.docType ?? "Memorandum",
      entry.subject ?? "",
      entry.sender ?? "",
      entry.notes ?? "",
      entry.receivedVia ?? "",
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
    return NextResponse.json({ error: err?.message ?? "Failed to save." }, { status: 500 });
  }
}

// PUT — update an existing entry by row index
export async function PUT(req: NextRequest) {
  const { spreadsheetId, direction, rowIndex, entry } = await req.json();

  if (!spreadsheetId || !direction || !rowIndex || !entry)
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  try {
    const sheets = getSheets();

    const row = [
      entry.cn,
      entry.date,
      entry.docType ?? "Memorandum",
      entry.subject ?? "",
      entry.sender ?? "",
      entry.notes ?? "",
      entry.receivedVia ?? "",
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${direction}!A${rowIndex}:G${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[logbook PUT ${direction}]`, err);
    return NextResponse.json({ error: err?.message ?? "Failed to update." }, { status: 500 });
  }
}

// DELETE — delete a row
export async function DELETE(req: NextRequest) {
  const { spreadsheetId, direction, rowIndex } = await req.json();

  if (!spreadsheetId || !direction || !rowIndex)
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

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
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[logbook DELETE ${direction}]`, err);
    return NextResponse.json({ error: err?.message ?? "Failed to delete." }, { status: 500 });
  }
}