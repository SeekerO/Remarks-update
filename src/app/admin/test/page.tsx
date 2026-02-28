"use client"

import React, { useState } from 'react';

const toBase64 = (file: File): Promise<{ base64: string; mediaType: string }> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const [header, base64] = result.split(',');
            const mediaType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
            resolve({ base64, mediaType });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const enhanceImage = (file: File): Promise<{ base64: string; mediaType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context failed'));

                canvas.width = img.width;
                canvas.height = img.height;

                // 1. Draw original image
                ctx.drawImage(img, 0, 0);

                // 2. Get image data for manipulation
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    // Calculate Grayscale (Luminance)
                    const avg = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];

                    // Apply a Threshold (if avg > 128 then white, else black)
                    // This creates a "Scan" look. Adjust 140 for sensitivity.
                    const threshold = avg > 140 ? 255 : 0;

                    data[i] = threshold;     // Red
                    data[i + 1] = threshold;   // Green
                    data[i + 2] = threshold;   // Blue
                }

                ctx.putImageData(imageData, 0, 0);

                // Return as high-quality JPEG (smaller than PNG for Vercel limits)
                const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                resolve({ base64, mediaType: 'image/jpeg' });
            };
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const TimeCardExtractor: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [extractedData, setExtractedData] = useState<any[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [rawText, setRawText] = useState('');
    const [sheetId, setSheetId] = useState('');
    const [sheetName, setSheetName] = useState('Sheet1');
    const [transferring, setTransferring] = useState(false);
    const [transferMsg, setTransferMsg] = useState('');

    const processImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatusMsg('Scanning DTR...');
        setExtractedData([]);
        setRawText('');
        setTransferMsg('');
        setPreviewUrl(URL.createObjectURL(file));

        try {
            const { base64, mediaType } = await toBase64(file);
            // const { base64, mediaType } = await enhanceImage(file);
            // setPreviewUrl(`data:${mediaType};base64,${base64}`);


            const response = await fetch('/api/dtr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        content: [
                            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
                            {
                                type: 'text',
                                text: `This is a Daily Time Record (DTR) form.
Extract only 3 time values per row: Morning In, Lunch/Noon break, and Afternoon Out.
Return ONLY a valid JSON array. No explanation, no markdown, no backticks.
Convert all times to 24-hour format.
Format: [{"day": 1, "morningIn": "08:00", "lunchOut": "12:00", "afternoonOut": "17:00"}, ...]
Rules:
- "morningIn" = first column (arrival time)
- "lunchOut" = middle break time (Morning Out or Afternoon In — same value, just pick one)
- "afternoonOut" = last column (departure time)
- Include ALL 31 DAYS; use "" for empty fields
- day must be a number (1–31)`
                            }
                        ]
                    }]
                })
            });

            const data = await response.json();
            const text: string = data.content?.[0]?.text ?? '';
            setRawText(text);

            if (!text) { setStatusMsg('⚠ Empty response from API.'); return; }

            const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

            let parsed: any[] | null = null;
            try { const p = JSON.parse(cleaned); if (Array.isArray(p)) parsed = p; } catch { }
            if (!parsed) { const m = cleaned.match(/\[[\s\S]*\]/); if (m) { try { parsed = JSON.parse(m[0]); } catch { } } }
            if (!parsed) { const objs = cleaned.match(/\{[\s\S]*?\}/g); if (objs) { try { parsed = JSON.parse('[' + objs.join(',') + ']'); } catch { } } }

            if (!parsed) { setStatusMsg('⚠ No JSON array found. See raw output below.'); return; }

            setExtractedData(parsed);
            setStatusMsg(`✓ Extracted ${parsed.length} entries`);

        } catch (err: any) {
            setStatusMsg('❌ ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = async () => {
        const XLSX = await import('xlsx');
        const rows = Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const row = extractedData.find((r: any) => Number(r.day) === day);
            return {
                Day: String(day).padStart(2, '0'),
                'Morning In': ensure24Hour(row?.morningIn ?? ''),
                'Lunch': ensure24Hour(row?.lunchOut ?? ''),
                'Afternoon Out': ensure24Hour(row?.afternoonOut ?? ''),
            };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'DTR');
        XLSX.writeFile(wb, 'DTR.xlsx');
    };

    const sendToSheets = async () => {
        if (!sheetId) { setTransferMsg('❌ Please enter a Spreadsheet ID.'); return; }
        if (!sheetName) { setTransferMsg('❌ Please enter a Sheet name.'); return; }
        if (!extractedData.length) { setTransferMsg('❌ No data to transfer.'); return; }

        setTransferring(true);
        setTransferMsg('📤 Sending to Google Sheets...');

        try {
            const res = await fetch('/api/dtr/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: extractedData, sheetId, sheetName }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error ?? 'Unknown error');
            setTransferMsg(`✅ Transferred ${result.rowsWritten} rows to "${sheetName}"!`);
        } catch (err: any) {
            setTransferMsg('❌ ' + err.message);
        } finally {
            setTransferring(false);
        }
    };

    const ensure24Hour = (timeStr: string): string => {
        if (!timeStr || timeStr.includes(':') === false) return timeStr;

        // Check if it contains AM/PM
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!match) return timeStr;

        let [_, hours, minutes, modifier] = match;
        let h = parseInt(hours, 10);

        if (modifier) {
            const amp = modifier.toUpperCase();
            if (amp === 'PM' && h < 12) h += 12;
            if (amp === 'AM' && h === 12) h = 0;
        }

        return `${h.toString().padStart(2, '0')}:${minutes}`;
    };

    // This a test feature DTR extractor, which is why it's in the admin section. It allows you to upload a photo of a DTR form, uses Groq's vision+language model to extract the time entries, and then optionally send them to Google Sheets or export as Excel. It's meant to be a demo of what's possible with vision+language models and custom APIs, and also a potential real tool for anyone who still has to deal with paper DTRs.

    return (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="w-screen min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="w-full h-full mx-auto overflow-y-auto">
                <h1 className="text-2xl font-bold text-white mb-6">DTR Extractor</h1>
                <div className="grid lg:grid-cols-2 grid-cols-1 w-full gap-6">

                    {/* LEFT: Upload + config */}
                    <div>
                        <div className="mb-6">
                            <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Upload DTR Photo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={processImage}
                                disabled={loading}
                                className="block w-full text-sm text-slate-300 bg-slate-900 border border-slate-700 rounded-lg p-3 cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-600 file:text-white hover:border-blue-500 transition-colors disabled:opacity-50"
                            />
                        </div>

                        {previewUrl && (
                            <img src={previewUrl} className="w-full max-h-64 object-contain rounded-lg border border-slate-800 mb-6" alt="Preview" />
                        )}

                        {statusMsg && (
                            <div className={`px-4 py-3 rounded-lg text-sm font-mono border mb-6 ${statusMsg.startsWith('✓') ? 'bg-green-950 border-green-700 text-green-300' :
                                statusMsg.startsWith('⚠') ? 'bg-yellow-950 border-yellow-700 text-yellow-300' :
                                    statusMsg.startsWith('❌') ? 'bg-red-950 border-red-700 text-red-300' :
                                        'bg-blue-950 border-blue-700 text-blue-300 animate-pulse'
                                }`}>
                                {statusMsg}
                                {loading && <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full animate-pulse w-full" /></div>}
                            </div>
                        )}

                        {rawText && extractedData.length === 0 && (
                            <div className="border border-yellow-800 rounded-lg overflow-hidden mb-6">
                                <div className="px-4 py-2 bg-yellow-950 border-b border-yellow-800">
                                    <span className="text-xs text-yellow-400 uppercase tracking-widest">Raw Groq Output (unparsed)</span>
                                </div>
                                <pre className="p-4 text-xs text-yellow-200 overflow-x-auto max-h-64 whitespace-pre-wrap">{rawText}</pre>
                            </div>
                        )}

                        {/* Google Sheets config */}
                        {extractedData.length > 0 && (
                            <div className="border border-slate-700 rounded-lg p-4 space-y-3">
                                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Send to Google Sheets</p>

                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Spreadsheet ID</label>
                                    <input
                                        type="text"
                                        value={sheetId}
                                        onChange={e => setSheetId(e.target.value)}
                                        placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                    <p className="text-xs text-slate-600 mt-1">From the URL: /spreadsheets/d/<span className="text-slate-400">SPREADSHEET_ID</span>/edit</p>
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Sheet Name (tab)</label>
                                    <input
                                        type="text"
                                        value={sheetName}
                                        onChange={e => setSheetName(e.target.value)}
                                        placeholder="Sheet1"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <button
                                    onClick={sendToSheets}
                                    disabled={transferring}
                                    className="w-full px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                                >
                                    {transferring ? '⏳ Sending...' : '↑ Send to Google Sheets'}
                                </button>

                                {transferMsg && (
                                    <div className={`px-3 py-2 rounded-lg text-xs font-mono border ${transferMsg.startsWith('✅') ? 'bg-green-950 border-green-700 text-green-300' :
                                        transferMsg.startsWith('📤') ? 'bg-blue-950 border-blue-700 text-blue-300' :
                                            'bg-red-950 border-red-700 text-red-300'
                                        }`}>
                                        {transferMsg}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Table */}
                    <div>
                        {extractedData.length > 0 && (
                            <div className="border border-slate-700 rounded-lg overflow-hidden">
                                <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                                    <span className="text-xs text-slate-400 uppercase tracking-widest">Extracted DTR</span>
                                    <button
                                        onClick={exportToExcel}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                                    >
                                        ↓ Export XLSX
                                    </button>
                                </div>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-800 border-b border-slate-700">
                                            <th className="px-4 py-2 text-left text-slate-400 font-normal uppercase tracking-widest">Day</th>
                                            <th className="px-4 py-2 text-left text-blue-400 font-normal uppercase tracking-widest">Morning In</th>
                                            <th className="px-4 py-2 text-left text-violet-400 font-normal uppercase tracking-widest">Lunch</th>
                                            <th className="px-4 py-2 text-left text-orange-400 font-normal uppercase tracking-widest">Afternoon Out</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 31 }, (_, i) => {
                                            const day = i + 1;
                                            const row = extractedData.find((r: any) => Number(r.day) === day);
                                            const hasData = row && (row.morningIn || row.lunchOut || row.afternoonOut);
                                            return (
                                                <tr key={day} className={`border-t border-slate-800/60 ${i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-950'}`}>
                                                    <td className={`px-4 py-1.5 font-bold tabular-nums ${hasData ? 'text-white' : 'text-slate-600'}`}>
                                                        {String(day).padStart(2, '0')}
                                                    </td>
                                                    <td className="px-4 py-1.5 text-blue-300 tabular-nums">{row?.morningIn ?? ''}</td>
                                                    <td className="px-4 py-1.5 text-violet-300 tabular-nums">{row?.lunchOut ?? ''}</td>
                                                    <td className="px-4 py-1.5 text-orange-300 tabular-nums">{row?.afternoonOut ?? ''}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TimeCardExtractor;