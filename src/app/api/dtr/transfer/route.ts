// app/api/sheets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
    try {
        const { rows, sheetId, sheetName } = await req.json();

        if (!rows || !sheetId || !sheetName) {
            return NextResponse.json({ error: 'Missing rows, sheetId, or sheetName' }, { status: 400 });
        }

        // Auth via service account key in env
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Header row + data rows
        const values = [
            ['Day', 'Morning In', 'Lunch', 'Afternoon Out'],
            ...Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const row = rows.find((r: any) => Number(r.day) === day);
                return [
                    String(day).padStart(2, '0'),
                    row?.morningIn ?? '',
                    row?.lunchOut ?? '',
                    row?.afternoonOut ?? '',
                ];
            }),
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values },
        });

        return NextResponse.json({ success: true, rowsWritten: values.length });

    } catch (err: any) {
        console.error('Sheets route error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}