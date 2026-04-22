import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'remove.bg API key not configured.' }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('image_file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
        }

        // Forward to remove.bg
        const rbFormData = new FormData();
        rbFormData.append('image_file', file);
        rbFormData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
            },
            body: rbFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('remove.bg error:', errorText);

            // Parse remove.bg error format
            try {
                const errorJson = JSON.parse(errorText);
                const msg = errorJson?.errors?.[0]?.title ?? 'remove.bg request failed';
                return NextResponse.json({ error: msg }, { status: response.status });
            } catch {
                return NextResponse.json({ error: 'remove.bg request failed' }, { status: response.status });
            }
        }

        // Return the PNG blob directly to the client
        const imageBuffer = await response.arrayBuffer();
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': 'inline; filename="no-bg.png"',
            },
        });
    } catch (err) {
        console.error('BG removal route error:', err);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}