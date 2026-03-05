// Place this file at: src/app/api/dtr/timelog/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Column positions in A12:L42 (0-indexed)
// A=Date, B=Day, C=AM IN, D=AM OUT, E=PM IN, F=PM OUT, G=OT IN, H=OT OUT, I=HRS REG, J=MINS REG, K=HRS SAT/SUN, L=MINS SAT/SUN
const COL = {
    date: 0,  // A
    day: 1,  // B
    amIn: 2,  // C
    amOut: 3,  // D
    pmIn: 4,  // E
    pmOut: 5,  // F
    otIn: 6,  // G
    otOut: 7,  // H
    hrsReg: 8,  // I
    minsReg: 9,  // J
    hrsSat: 10, // K
    minsSat: 11, // L
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sheetId = searchParams.get('sheetId');
    const sheetName = searchParams.get('sheetName') ?? 'Sheet1';

    if (!sheetId) {
        return NextResponse.json({ error: 'Missing sheetId parameter.' }, { status: 400 });
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Fetch exactly rows 12–42, columns A–L (no header row needed)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${sheetName}!A12:L42`,
        });

        const rawRows: string[][] = (response.data.values ?? []) as string[][];

        if (rawRows.length === 0) {
            return NextResponse.json({ rows: [] });
        }

        // Map each row to a typed object by column position
        const rows = rawRows.map((row) => ({
            date: row[COL.date] ?? '',
            day: row[COL.day] ?? '',
            amIn: row[COL.amIn] ?? '',
            amOut: row[COL.amOut] ?? '',
            pmIn: row[COL.pmIn] ?? '',
            pmOut: row[COL.pmOut] ?? '',
            otIn: row[COL.otIn] ?? '',
            otOut: row[COL.otOut] ?? '',
            hrsReg: row[COL.hrsReg] ?? '',
            minsReg: row[COL.minsReg] ?? '',
            hrsSat: row[COL.hrsSat] ?? '',
            minsSat: row[COL.minsSat] ?? '',
        }));

        return NextResponse.json({ rows });
    } catch (err: any) {
        console.error('[timelog]', err);
        return NextResponse.json(
            { error: err?.message ?? 'Failed to fetch sheet data.' },
            { status: 500 }
        );
    }
}