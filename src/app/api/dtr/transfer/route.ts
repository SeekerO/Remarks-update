import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
    try {
        const { rows, sheetId, sheetName } = await req.json();

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Fetch the sheet including GridData to check colors
        const response = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
            ranges: [`${sheetName}!A12:H42`],
            includeGridData: true,
        });

        const rowDataList = response.data.sheets?.[0].data?.[0].rowData || [];


        const updatedValues = Array.from({ length: 31 }, (_, i) => {
            const gridRow = rowDataList[i]?.values || [];

            // 1. Extract current text values to preserve existing content (like day names)
            const rowArray = Array.from({ length: 8 }, (_, colIdx) => {
                return gridRow[colIdx]?.formattedValue || "";
            });

            const day = i + 1;
            const extractedRow = rows.find((r: any) => Number(r.day) === day);

            // 2. Identify the Day Type from Column B (index 1)
            const dayTypeLabel = String(rowArray[1] || "").toUpperCase();
            const isWeekendText = dayTypeLabel.includes("SUNDAY") || dayTypeLabel.includes("SATURDAY");

            // 3. Check if cells in Column C to F (indices 2 to 5) are NOT white
            // In Google Sheets API: {red: 1, green: 1, blue: 1} is pure white.
            // If backgroundColor is missing, it's usually the default white/empty.
            const hasColor = gridRow.slice(2, 6).some(cell => {
                const bg = cell?.effectiveFormat?.backgroundColor;
                if (!bg) return false;

                // Return true if the color is NOT white (meaning it's gray, blue, etc.)
                const isWhite = (bg.red === 1 || bg.red === undefined) &&
                    (bg.green === 1 || bg.green === undefined) &&
                    (bg.blue === 1 || bg.blue === undefined);
                return !isWhite;
            });

            // --- THE CONDITION ---
            // Trigger "Column G" logic if it's weekend text OR if the cells are colored
            const isSpecialDay = isWeekendText || hasColor;

            if (extractedRow) {
                if (isSpecialDay) {
                    // --- SPECIAL DAY LOGIC (Weekend or Colored/Gray) ---
                    // Morning In -> Column G (index 6) [OT IN]
                    if (extractedRow.morningIn) rowArray[6] = extractedRow.morningIn;
                    // Afternoon Out -> Column H (index 7) [OT OUT]
                    if (extractedRow.afternoonOut) rowArray[7] = extractedRow.afternoonOut;

                    // Note: We leave C, D, E, F as they are (usually empty or shaded)
                } else {
                    // --- REGULAR WEEKDAY LOGIC ---
                    // Morning In -> Column C (index 2)
                    if (extractedRow.morningIn) rowArray[2] = extractedRow.morningIn;

                    // Lunch Out -> Column E (index 4) AND Duplicate to Column D (index 3)
                    if (extractedRow.lunchOut) {
                        rowArray[4] = extractedRow.lunchOut;
                        rowArray[3] = extractedRow.lunchOut;
                    }

                    // Fixed OT markers
                    rowArray[5] = "4:00"; // Column F
                    rowArray[6] = "4:30"; // Column G

                    // Afternoon Out -> Column H (index 7)
                    if (extractedRow.afternoonOut) rowArray[7] = extractedRow.afternoonOut;
                }
            }
            return rowArray;
        });


        // 3. Batch Update the values
        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${sheetName}!A12:H42`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: updatedValues },
        });

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}