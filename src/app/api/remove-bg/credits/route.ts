import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    try {
        const res = await fetch('https://api.remove.bg/v1.0/account', {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey,
            },
            // Don't cache — always get live credit count
            cache: 'no-store',
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch account info.' }, { status: res.status });
        }

        const json = await res.json();

        // remove.bg returns: { data: { attributes: { api: { free_calls, sizes, credits: { total, subscription, payg, enterprise } } } } }
        const attrs = json?.data?.attributes;
        const credits = attrs?.api?.credits;
        const freeCalls = attrs?.api?.free_calls;

        return NextResponse.json({
            totalCredits: credits?.total ?? 0,
            subscriptionCredits: credits?.subscription ?? 0,
            paygCredits: credits?.payg ?? 0,
            freeCalls: freeCalls ?? 0,
        });
    } catch (err) {
        console.error('Credits route error:', err);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}