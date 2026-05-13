import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
    try {
        const { rows, sheetId, sheetName, date, name, supervisor } = await req.json();

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Fetch the sheet including GridData to check colors for the DTR range
        const response = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
            ranges: [`${sheetName}!A12:R42`],
            includeGridData: true,
        });

        const rowDataList = response.data.sheets?.[0].data?.[0].rowData || [];

        // 2. Process the DTR Table Data (Rows 12-42)
        const updatedDtrValues = Array.from({ length: 31 }, (_, i) => {
            const gridRow = rowDataList[i]?.values || [];
            const rowArray = Array.from({ length: 8 }, (_, colIdx) => gridRow[colIdx]?.formattedValue || "");

            const day = i + 1;
            const extractedRow = rows.find((r: any) => Number(r.day) === day);

            const dayTypeLabel = String(rowArray[1] || "").toUpperCase();
            const isWeekendText = dayTypeLabel.includes("SUNDAY") || dayTypeLabel.includes("SATURDAY");

            const hasColor = gridRow.slice(2, 6).some(cell => {
                const bg = cell?.effectiveFormat?.backgroundColor;
                if (!bg) return false;
                const isWhite = (bg.red === 1 || bg.red === undefined) &&
                    (bg.green === 1 || bg.green === undefined) &&
                    (bg.blue === 1 || bg.blue === undefined);
                return !isWhite;
            });

            const isSpecialDay = isWeekendText || hasColor;

            if (extractedRow) {
                if (isSpecialDay) {
                    if (extractedRow.morningIn) rowArray[6] = extractedRow.morningIn;
                    if (extractedRow.afternoonOut) rowArray[7] = extractedRow.afternoonOut;
                } else {
                    if (extractedRow.morningIn) rowArray[2] = extractedRow.morningIn;
                    if (extractedRow.lunchOut) {
                        rowArray[4] = extractedRow.lunchOut;
                        rowArray[3] = extractedRow.lunchOut;
                    }
                    rowArray[5] = "4:00";
                    rowArray[6] = "4:30";
                    if (extractedRow.afternoonOut) rowArray[7] = extractedRow.afternoonOut;
                }
            }
            return rowArray;
        });

        // 3. Perform a BATCH UPDATE to handle multiple ranges at once
        // This updates B6, B8, and the DTR table in one network request
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: {
                valueInputOption: 'USER_ENTERED',
                data: [
                    {
                        range: `${sheetName}!R3`,
                        values: [[date]]
                    },
                    {
                        range: `${sheetName}!B8`,
                        values: [[name]]
                    },
                    {
                        range: `${sheetName}!H51`,
                        values: [[name]]
                    },
                    {
                        range: `${sheetName}!A52`,
                        values: [[supervisor]]
                    },
                    {
                        range: `${sheetName}!A12:H42`,
                        values: updatedDtrValues
                    }
                ]
            }
        });

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Sheets Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}